import assert from "node:assert/strict";
import { test } from "node:test";
import { Miniflare } from "miniflare";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";
import { ESCAPED_ICONFONT_ARROW_SVG, UNSAFE_CATEGORY_SVGS } from "../fixtures/category-svg.mjs";

test("分类图标在独立 workerd D1 中完成并发保存、清理和备份恢复", { timeout: 60_000 }, async (t) => {
  const compiled = [];
  async function compile(path, importReplacements = {}, transformSource) {
    const build = await compileTypescriptModule(new URL(path, import.meta.url), { importReplacements, transformSource });
    compiled.push(build);
    return build;
  }
  const runtime = new Miniflare({
    host: "127.0.0.1", port: 0, cf: false, telemetry: { enabled: false },
    workers: [{ config: {
      name: "htools-category-icons-test", compatibilityDate: "2026-06-30",
      manifest: { mainModule: "worker.mjs", modules: { "worker.mjs": {
        type: "esm", contents: "export default { fetch() { return new Response('integration'); } };"
      } } }, env: { DB: { type: "d1", id: "category-icons-db" } }
    }, dev: { unsafeRegisterWorker: false } }]
  });
  try {
    const sharedBuild = await compile("../../functions/_shared.ts");
    const shared = await import(sharedBuild.url.href);
    const iconsBuild = await compile("../../functions/_category-icons.ts", { "./_shared": sharedBuild.url.href });
    const icons = await import(iconsBuild.url.href);
    const settingsBuild = await compile("../../src/category-icon-settings.ts");
    const settingsContract = await import(settingsBuild.url.href);
    const tagsBuild = await compile("../../shared/effective-tags.ts");
    const telegramBuild = await compile("../../functions/_telegram.ts", {
      "./_shared": sharedBuild.url.href, "../shared/effective-tags": tagsBuild.url.href
    });
    const imports = { "../../_shared": sharedBuild.url.href, "../../_category-icons": iconsBuild.url.href, "../../_telegram": telegramBuild.url.href };
    const routeBuild = await compile("../../functions/api/admin/category-icons.ts", imports);
    const route = await import(routeBuild.url.href);
    const categoriesBuild = await compile("../../functions/api/admin/categories.ts", imports);
    const categories = await import(categoriesBuild.url.href);
    const publicBuild = await compile("../../functions/api/categories.ts", {
      "../_shared": sharedBuild.url.href, "../_category-icons": iconsBuild.url.href
    });
    const publicCategories = await import(publicBuild.url.href);
    const backupBuild = await compile("../../functions/api/admin/backup.ts", imports,
      (source) => `${source}\nexport { readBackupData, restoreBackupData, normalizeBackupPayload };`);
    const backup = await import(backupBuild.url.href);
    const db = await runtime.getD1Database("DB");
    await shared.ensureDatabaseSchema(db);
    const env = { DB: db, ADMIN_PASSWORD: "category-icons-test-password" };
    const token = await shared.createToken(env);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const request = (path, method = "GET", body, auth = true) => new Request(`https://example.com/api/${path}`, {
      method, headers: auth ? headers : { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const update = (scope, category, icon) => icons.saveCategoryIconSettings(env, { scope, category, icon });
    const icon = (value) => ({ type: "lucide", value });
    const readRaw = async () => (await db.prepare("SELECT value FROM app_settings WHERE key = 'category_icons'").first()).value;
    const setRaw = (value) => db.prepare("UPDATE app_settings SET value = ? WHERE key = 'category_icons'").bind(value).run();
    const makeSizedSettings = (bytes) => {
      const result = settingsContract.createEmptyCategoryIconSettings();
      const prefix = '<svg xmlns="http://www.w3.org/2000/svg"><title>';
      const suffix = '</title></svg>';
      for (let index = 0; index < 34; index += 1) result.tools[`容量${index}`] = { type: "svg", value: prefix + suffix };
      let remaining = bytes - Buffer.byteLength(JSON.stringify(result));
      for (const entry of Object.values(result.tools)) {
        const add = Math.min(remaining, settingsContract.MAX_CATEGORY_SVG_LENGTH - Buffer.byteLength(prefix + suffix));
        entry.value = prefix + "图".repeat(Math.floor(add / 3)) + "a".repeat(add % 3) + suffix;
        remaining -= add;
      }
      assert.equal(remaining, 0);
      assert.equal(Buffer.byteLength(JSON.stringify(result)), bytes);
      assert.deepEqual(settingsContract.normalizeCategoryIconSettings(result), result);
      return result;
    };
    const noExternalRequests = t.mock.method(globalThis, "fetch", () => { throw new Error("分类图标测试禁止外部请求"); });

    await t.test("旧库返回空图标且保留原分类数组，管理员接口要求认证", async () => {
      await shared.saveAdminCategorySettings(env, { tools: ["Development"], articles: ["News"] });
      const response = await categories.onRequestGet({ env, request: request("admin/categories") });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.deepEqual(data.settings.tools, ["Development"]);
      assert.deepEqual(data.icons, { tools: {}, articles: {}, push: {}, content: {} });
      const unauthorized = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", { scope: "tools", category: "Development", icon: icon("code") }, false) });
      assert.equal(unauthorized.status, 401);
      assert.equal(await db.prepare("SELECT value FROM app_settings WHERE key = 'category_icons'").first(), null);
    });

    await t.test("不同分类和分区的并发补丁全部保留，特殊字符键不改变 JSON 路径", async () => {
      const categories = ["Development", '点.引号"方括号[0]\\', "数据库"];
      await Promise.all([
        ...categories.map((category) => update("tools", category, icon("code"))),
        update("articles", "News", icon("newspaper")), update("push", "发布", icon("send"))
      ]);
      const current = await icons.getCategoryIconSettings(env);
      for (const category of categories) assert.deepEqual(current.tools[category], icon("code"));
      assert.deepEqual(current.articles.News, icon("newspaper"));
      assert.deepEqual(current.push.发布, icon("send"));
      await update("tools", "Development", { type: "image", value: "https://example.com/icon.svg" });
      await update("tools", "数据库", null);
      const saved = JSON.parse((await db.prepare("SELECT value FROM app_settings WHERE key = 'category_icons'").first()).value);
      assert.deepEqual(saved.tools.Development, { type: "image", value: "https://example.com/icon.svg" });
      assert.equal(Object.hasOwn(saved.tools, "数据库"), false);
      assert.deepEqual(saved.articles.News, icon("newspaper"));
    });

    await t.test("无效分类与图标返回 400 且数据库保持原样，成功保存更新公开缓存版本", async () => {
      const before = (await db.prepare("SELECT value FROM app_settings WHERE key = 'category_icons'").first()).value;
      for (const invalid of [
        null, [], { scope: "bad", category: "A", icon: icon("tags") },
        ...["All", "精选", "__admin_featured__", "__telegram_tool__", "__proto__", "constructor", "prototype", "a".repeat(49)].map((category) => ({ scope: "tools", category, icon: icon("tags") })),
        { scope: "tools", category: "A", icon: icon("unknown") },
        { scope: "tools", category: "A", icon: { type: "image", value: "data:image/svg+xml,<svg/>" } },
        { scope: "tools", category: "A" }
      ]) {
        const response = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", invalid) });
        assert.equal(response.status, 400, JSON.stringify(invalid));
      }
      assert.equal((await db.prepare("SELECT value FROM app_settings WHERE key = 'category_icons'").first()).value, before);
      const version = await shared.getPublicApiCacheVersion(env);
      const response = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", { scope: "tools", category: "Development", icon: icon("terminal") }) });
      assert.equal(response.status, 200);
      assert.notEqual(await shared.getPublicApiCacheVersion(env), version);
      const publicResponse = await publicCategories.onRequestGet({ env, request: request("categories"), waitUntil: () => {} });
      const published = await publicResponse.json();
      assert.deepEqual(published.icons.tools.Development, icon("terminal"));
      assert.deepEqual(published.icons.articles.News, icon("newspaper"));
      assert.deepEqual(published.icons.push, {});
      assert.deepEqual(published.icons.content, {});
      assert.deepEqual(published.settings.tools, ["Development"]);
    });

    await t.test("达到分区上限的并发新增只接受一条，现有图标仍可更换和清除", async () => {
      const current = await icons.getCategoryIconSettings(env);
      current.content = Object.fromEntries(Array.from({ length: 119 }, (_, index) => [`C${index}`, icon("rss")]));
      await db.prepare("UPDATE app_settings SET value = ? WHERE key = 'category_icons'").bind(JSON.stringify(current)).run();
      const results = await Promise.allSettled([update("content", "last-a", icon("tags")), update("content", "last-b", icon("folder"))]);
      assert.equal(results.filter((entry) => entry.status === "fulfilled").length, 1);
      assert.equal(results.filter((entry) => entry.status === "rejected").length, 1);
      assert.equal(results.find((entry) => entry.status === "rejected").reason.name, "CategoryIconCapacityError");
      assert.equal(Object.keys((await icons.getCategoryIconSettings(env)).content).length, 120);
      await update("content", "C0", icon("cloud"));
      await update("content", "C1", null);
      assert.equal(Object.keys((await icons.getCategoryIconSettings(env)).content).length, 119);
    });

    await t.test("用户 SVG 通过真实路由保存与读取，公开仅返回工具和文章图标，危险输入不写库", async () => {
      const svg = { type: "svg", value: ESCAPED_ICONFONT_ARROW_SVG };
      const normalized = settingsContract.normalizeCategoryIcon(svg);
      for (const scope of ["tools", "articles", "push", "content"]) {
        const response = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", { scope, category: "圆圈箭头", icon: svg }) });
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).icons[scope].圆圈箭头, normalized);
      }
      const loaded = await route.onRequestGet({ env, request: request("admin/category-icons") });
      assert.deepEqual((await loaded.json()).icons.tools.圆圈箭头, normalized);
      const publicResponse = await publicCategories.onRequestGet({ env, request: request("categories"), waitUntil: () => {} });
      const published = await publicResponse.json();
      assert.deepEqual(published.icons.tools.圆圈箭头, normalized);
      assert.deepEqual(published.icons.articles.圆圈箭头, normalized);
      assert.deepEqual(published.icons.push, {});
      assert.deepEqual(published.icons.content, {});
      const before = await readRaw();
      for (const value of UNSAFE_CATEGORY_SVGS) {
        const response = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", { scope: "tools", category: "圆圈箭头", icon: { type: "svg", value } }) });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).code, "INVALID_REQUEST");
        assert.equal(await readRaw(), before);
      }
    });

    await t.test("1 MiB UTF-8 总容量原子检查并发更新，超限不改变原值和缓存，清除仍可执行", async () => {
      const original = await readRaw();
      const limit = settingsContract.MAX_CATEGORY_ICON_SETTINGS_BYTES;
      try {
        const exact = makeSizedSettings(limit);
        await setRaw(JSON.stringify(exact));
        const existing = exact.tools.容量0;
        await update("tools", "容量0", existing);
        assert.equal(Buffer.byteLength(await readRaw()), limit);
        const version = await shared.getPublicApiCacheVersion(env);
        const before = await readRaw();
        const response = await route.onRequestPut({ env, request: request("admin/category-icons", "PUT", { scope: "push", category: "超出", icon: icon("tags") }) });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).code, "CATEGORY_ICONS_CAPACITY");
        assert.equal(await readRaw(), before);
        assert.equal(await shared.getPublicApiCacheVersion(env), version);

        const roomForOne = makeSizedSettings(limit - 40);
        await setRaw(JSON.stringify(roomForOne));
        const results = await Promise.allSettled([update("push", "A", icon("tags")), update("push", "B", icon("tags"))]);
        assert.equal(results.filter((entry) => entry.status === "fulfilled").length, 1);
        assert.equal(results.filter((entry) => entry.status === "rejected").length, 1);
        const actual = await icons.getCategoryIconSettings(env);
        assert.deepEqual(actual.tools, roomForOne.tools);
        assert.equal(Object.keys(actual.push).length, 1);
        assert.ok(Buffer.byteLength(await readRaw()) <= limit);

        const legacy = makeSizedSettings(limit + 500);
        await setRaw(JSON.stringify(legacy));
        assert.deepEqual(await icons.getCategoryIconSettings(env), legacy);
        await update("tools", "容量33", null);
        const shrunk = JSON.parse(await readRaw());
        assert.equal(Object.hasOwn(shrunk.tools, "容量33"), false);
        assert.ok(Buffer.byteLength(await readRaw()) > limit);
        delete legacy.tools.容量33;
        assert.deepEqual(await icons.getCategoryIconSettings(env), legacy);
      } finally {
        await setRaw(original);
      }
    });

    await t.test("超出图标总容量的备份整份拒绝，旧库和其他设置不变", async () => {
      const before = await readRaw();
      const beforeSettings = await db.prepare("SELECT key, value, updated_at FROM app_settings ORDER BY key").all();
      const exported = await backup.readBackupData(db);
      exported.settings.find((setting) => setting.key === "category_icons").value = JSON.stringify(makeSizedSettings(settingsContract.MAX_CATEGORY_ICON_SETTINGS_BYTES + 1));
      const payload = { source: "htools-backup", version: "4", data: exported };
      assert.throws(() => backup.normalizeBackupPayload(payload), { name: "CategoryIconCapacityError" });
      const response = await backup.onRequestPost({ env, request: request("admin/backup", "POST", payload) });
      assert.equal(response.status, 400);
      const failure = await response.json();
      assert.equal(failure.code, "CATEGORY_ICONS_CAPACITY");
      assert.equal(await readRaw(), before);
      assert.deepEqual((await db.prepare("SELECT key, value, updated_at FROM app_settings ORDER BY key").all()).results, beforeSettings.results);
    });

    await t.test("删除或迁移分类清除源图标并保留目标和其他分区", async () => {
      await shared.saveAdminCategorySettings(env, { tools: ["Development", "Target", "Delete"] });
      await update("tools", "Target", icon("folder"));
      await update("tools", "Delete", icon("wrench"));
      for (const [category, action, targetCategory] of [["Development", "migrate", "Target"], ["Delete", "delete", ""]]) {
        const response = await categories.onRequestPost({ env, request: request("admin/categories", "POST", { scope: "tools", category, action, targetCategory }) });
        assert.equal(response.status, 200, await response.clone().text());
        const data = await response.json();
        assert.equal(Object.hasOwn(data.icons.tools, category), false);
        assert.deepEqual(data.icons.tools.Target, icon("folder"));
        assert.deepEqual(data.icons.articles.News, icon("newspaper"));
      }
    });

    await t.test("备份包含图标，恢复清理危险数据，旧备份清除现有覆盖", async () => {
      const exported = await backup.readBackupData(db);
      const row = exported.settings.find((setting) => setting.key === "category_icons");
      assert.ok(row);
      const expected = await icons.getCategoryIconSettings(env);
      assert.deepEqual(JSON.parse(row.value), expected);
      const restored = backup.normalizeBackupPayload({ source: "htools-backup", version: "4", data: exported });
      await backup.restoreBackupData(db, restored);
      assert.deepEqual(await icons.getCategoryIconSettings(env), expected);
      row.value = '{"tools":{"Safe":{"type":"lucide","value":"tags"},"Bad":{"type":"image","value":"javascript:alert(1)"},"__proto__":{"type":"lucide","value":"tags"}},"unknown":{"x":true}}';
      const sanitized = backup.normalizeBackupPayload({ source: "htools-backup", version: "4", data: exported });
      await backup.restoreBackupData(db, sanitized);
      assert.deepEqual(await icons.getCategoryIconSettings(env), { tools: { Safe: icon("tags") }, articles: {}, push: {}, content: {} });
      const older = { ...exported, settings: exported.settings.filter((setting) => setting.key !== "category_icons") };
      await backup.restoreBackupData(db, backup.normalizeBackupPayload({ source: "htools-backup", version: "4", data: older }));
      assert.deepEqual(await icons.getCategoryIconSettings(env), { tools: {}, articles: {}, push: {}, content: {} });
    });
    assert.equal(noExternalRequests.mock.callCount(), 0);
  } finally {
    await runtime.dispose();
    for (const build of compiled.reverse()) await build.cleanup();
  }
});
