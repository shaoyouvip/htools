import assert from "node:assert/strict";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";
import { ESCAPED_ICONFONT_ARROW_SVG, UNSAFE_CATEGORY_SVGS } from "../fixtures/category-svg.mjs";

const clientBuild = await compileTypescriptModule(new URL("../../src/api-client.ts", import.meta.url));
const apiBuild = await compileTypescriptModule(new URL("../../src/admin-api.ts", import.meta.url), {
  importReplacements: { "./api-client": clientBuild.url.href },
  transformSource: (source) => `
    import { confirmTimedOutWrite, requestJsonWithTimeout, TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS } from "./api-client";
    import { CATEGORY_ICON_SCOPES, normalizeCategoryIcon, normalizeCategoryIconSettings } from "./category-icon-settings";
    ${source.slice(source.indexOf("export async function loadAdminCategorySettings("), source.indexOf("export async function saveAdminCategorySettings("))}
  `
});
const api = await import(apiBuild.url.href);
after(async () => { await apiBuild.cleanup(); await clientBuild.cleanup(); });
const empty = () => ({ tools: {}, articles: {}, push: {}, content: {} });
const settings = { tools: ["开发"], articles: [], push: [], content: [] };
const icon = { type: "lucide", value: "code" };

test("分类配置一次读取数组和图标，旧数组接口与缺图标响应保持兼容", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push(url);
    assert.equal(init.headers.Authorization, "Bearer local-test-token");
    return Response.json({ settings, icons: { ...empty(), tools: { 开发: icon } } });
  });
  assert.deepEqual(await api.loadAdminCategoryConfiguration("local-test-token"), { settings, icons: { ...empty(), tools: { 开发: icon } } });
  assert.deepEqual(calls, ["/api/admin/categories"]);
  assert.deepEqual(await api.loadAdminCategorySettings("local-test-token"), settings);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ settings }));
  assert.deepEqual(await api.loadAdminCategoryConfiguration("local-test-token"), { settings, icons: empty() });
});

test("分类或图标加载失败不转换为成功空值，读取支持取消和重试", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "unavailable", code: "SERVER_ERROR" }, { status: 500 }));
  await assert.rejects(api.loadAdminCategoryConfiguration("local-test-token"), { code: "SERVER_ERROR" });
  await assert.rejects(api.loadAdminCategoryIcons("local-test-token"), { code: "SERVER_ERROR" });
  for (const payload of [{}, { settings: {} }, { settings, icons: [] }, { settings, icons: null }]) {
    globalThis.fetch.mock.mockImplementation(async () => Response.json(payload));
    await assert.rejects(api.loadAdminCategoryConfiguration("local-test-token"), /Invalid category response/);
  }
  globalThis.fetch.mock.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  const controller = new AbortController();
  const pending = api.loadAdminCategoryIcons("local-test-token", { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ icons: empty() }));
  assert.deepEqual(await api.loadAdminCategoryIcons("local-test-token"), empty());
});

test("保存只发送当前分类和归一化图标，恢复默认发送 null", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, method: init.method, body: JSON.parse(init.body) });
    return Response.json({ icons: { ...empty(), tools: { 开发: icon } } });
  });
  await api.saveAdminCategoryIcon("local-test-token", "tools", " 开发 ", { type: "image", value: " https://example.com/a b.svg " });
  await api.saveAdminCategoryIcon("local-test-token", "articles", "文章", null);
  assert.deepEqual(calls, [
    { url: "/api/admin/category-icons", method: "PUT", body: { scope: "tools", category: "开发", icon: { type: "image", value: "https://example.com/a%20b.svg" } } },
    { url: "/api/admin/category-icons", method: "PUT", body: { scope: "articles", category: "文章", icon: null } }
  ]);
});

test("SVG 保存只发送规范化的隔离图片内容，非法 SVG 不发出请求", async (t) => {
  let saved;
  const fetch = t.mock.method(globalThis, "fetch", async (_url, init) => {
    saved = JSON.parse(init.body);
    return Response.json({ icons: { ...empty(), tools: { 开发: saved.icon } } });
  });
  const result = await api.saveAdminCategoryIcon("local-test-token", "tools", "开发", { type: "svg", value: ESCAPED_ICONFONT_ARROW_SVG });
  assert.equal(saved.icon.type, "svg");
  assert.match(saved.icon.value, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.equal([...saved.icon.value.matchAll(/fill="#333333"/g)].length, 2);
  assert.doesNotMatch(saved.icon.value, /\\<|p-id=|class=/);
  assert.deepEqual(result.tools.开发, saved.icon);
  for (const value of UNSAFE_CATEGORY_SVGS) {
    await assert.rejects(api.saveAdminCategoryIcon("local-test-token", "tools", "开发", { type: "svg", value }), /Invalid category icon/);
  }
  assert.equal(fetch.mock.callCount(), 1);
});

test("SVG 保存超时只读确认规范化后的本分类，不重复写入", async (t) => {
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => originalTimeout(callback, Math.min(delay, 5), ...args));
  const calls = [];
  let normalized;
  t.mock.method(globalThis, "fetch", (_url, init) => {
    calls.push(init.method ?? "GET");
    if (init.method === "PUT") {
      normalized = JSON.parse(init.body).icon;
      return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
    }
    return Promise.resolve(Response.json({ icons: { ...empty(), tools: { 开发: normalized, 并发新增: icon } } }));
  });
  const result = await api.saveAdminCategoryIcon("local-test-token", "tools", "开发", { type: "svg", value: ESCAPED_ICONFONT_ARROW_SVG });
  assert.deepEqual(result.tools.开发, normalized);
  assert.deepEqual(calls, ["PUT", "GET"]);
});

for (const clear of [false, true]) {
  test(`保存超时后只读确认${clear ? "恢复默认" : "本分类"}，其他分类变化不影响成功`, async (t) => {
    const originalTimeout = globalThis.setTimeout;
    t.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => originalTimeout(callback, Math.min(delay, 5), ...args));
    const calls = [];
    const confirmed = { ...empty(), tools: { ...(clear ? {} : { 开发: icon }), 并发新增: { type: "lucide", value: "cloud" } }, push: { 推送: { type: "lucide", value: "send" } } };
    t.mock.method(globalThis, "fetch", (_url, init) => {
      calls.push(init.method ?? "GET");
      if (init.method === "PUT") return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
      return Promise.resolve(Response.json({ icons: confirmed }));
    });
    assert.deepEqual(await api.saveAdminCategoryIcon("local-test-token", "tools", "开发", clear ? null : icon), confirmed);
    assert.deepEqual(calls, ["PUT", "GET"]);
  });
}

test("超时确认不同或读取失败保留超时错误，不重复写入", async (t) => {
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => originalTimeout(callback, Math.min(delay, 5), ...args));
  const calls = [];
  let failRead = false;
  t.mock.method(globalThis, "fetch", (_url, init) => {
    calls.push(init.method ?? "GET");
    if (init.method === "PUT") return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
    return Promise.resolve(failRead ? Response.json({ error: "unavailable" }, { status: 500 }) : Response.json({ icons: empty() }));
  });
  await assert.rejects(api.saveAdminCategoryIcon("local-test-token", "tools", "开发", icon), { code: "REQUEST_TIMEOUT" });
  failRead = true;
  await assert.rejects(api.saveAdminCategoryIcon("local-test-token", "tools", "开发", icon), { code: "REQUEST_TIMEOUT" });
  assert.deepEqual(calls, ["PUT", "GET", "PUT", "GET"]);
});
