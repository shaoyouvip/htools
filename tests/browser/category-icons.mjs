import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  launchEdge, openPage, navigate, evaluate, closeBrowser, safeRemove
} from "../../scripts/browser-regression.mjs";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";
import {
  ICONFONT_ARROW_SVG, ESCAPED_ICONFONT_ARROW_SVG, UNSAFE_CATEGORY_SVGS
} from "../fixtures/category-svg.mjs";

const origin = process.argv.find((arg) => arg.startsWith("--origin="))?.slice(9) ?? "http://127.0.0.1:8788";
const selectedWidths = new Set((process.argv.find((arg) => arg.startsWith("--widths="))?.slice(9) ?? "2560,1920,1366,419").split(",").map(Number));
const svgOnly = process.argv.includes("--svg-only");
const namesOnly = process.argv.includes("--names-only");
const sourcesOnly = process.argv.includes("--sources-only");
const legacyNames = ["constructor", "toString", "__proto__"];
const runId = `category-icons-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const runtimeRoot = resolve("tmp/browser-regression/runtime");
const runtime = join(runtimeRoot, runId);
const artifacts = resolve("tmp/browser-regression/artifacts", runId);
const storageKey = `htools-category-icons-check:${runId}`;
const category = "图标测试分类";
const otherCategory = "另一分类";
const iconByScope = { tools: "folder", articles: "code", content: "rss", push: "send" };
const dialog = ".admin-category-icon-dialog";
const trigger = ".admin-topbar .admin-category-filter-trigger";
const targetRow = '.admin-category-filter-option[data-category-check-target="true"]';
const saveButton = `${dialog} .dialog-footer .primary-button`;
const report = { status: "failed", results: [], errors: [], blocked: [], images: [], dialogs: [], assets: [], artifacts };
let browser;
let client;
let categorySvgModule;
let categoryIconModule;
let iconNames;
let touch = false;
let currentLocale = "zh";
let currentTheme = "light";

// 只有本轮独立浏览器读取此内存 API；真实服务仅提供 GET 静态资源。
function installFixture(config) {
  const params = new URLSearchParams(location.search);
  localStorage.setItem("htools_token", "category-icons-browser-check");
  localStorage.setItem("htools_locale", params.get("locale") ?? "zh");
  localStorage.setItem("htools_theme", params.get("theme") ?? "light");
  for (const key of ["htools_admin_tool_category", "htools_admin_article_category", "htools_admin_content_category"])
    localStorage.setItem(key, "All");
  for (const key of ["htools_admin_tool_search", "htools_admin_article_search", "htools_admin_content_search"])
    localStorage.removeItem(key);
  localStorage.setItem("htools_admin_content_source", "all");
  const stored = JSON.parse(sessionStorage.getItem(config.storageKey) ?? "null");
  const scopes = ["tools", "articles", "content", "push"];
  const categories = config.categories ?? [config.category, config.otherCategory];
  const state = window.__categoryIconsCheck = {
    icons: stored?.icons ?? Object.fromEntries(scopes.map((scope) => [scope, {}])),
    settings: stored?.settings ?? Object.fromEntries(scopes.map((scope) => [scope, [...categories]])),
    writes: stored?.writes ?? [], reads: [], unexpected: [], failNextSave: false, holdSaves: false, pending: []
  };
  const persist = () => sessionStorage.setItem(config.storageKey, JSON.stringify({
    icons: state.icons, settings: state.settings, writes: state.writes
  }));
  const date = "2026-10-17T00:00:00.000Z";
  const tinyImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'/%3E";
  const tools = categories.map((name, index) => ({
    id: `icon-tool-${index}`, name: `分类图标工具 ${index + 1}`, description: "用于分类图标的独立浏览器验证。",
    url: `https://example.invalid/tool/${index}`, demoUrl: "", image: tinyImage, category: name, tags: [],
    githubLanguage: "", githubLicense: "", featured: index === 0, created_at: date, updated_at: date
  }));
  const articles = categories.map((name, index) => ({
    id: `icon-article-${index}`, slug: `icon-article-${index}`, title: `分类图标文章 ${index + 1}`,
    summary: "用于分类图标的独立浏览器验证。", content: "这是本地合成正文。", category: name,
    coverImage: "", tags: [], published: true, created_at: date, updated_at: date, published_at: date
  }));
  const sources = categories.map((name, index) => ({
    id: `icon-source-${index}`, title: `分类图标订阅 ${index + 1}`, url: `https://example.invalid/feed/${index}`,
    siteUrl: "", description: "", category: name, tags: [], enabled: false, created_at: date, updated_at: date
  }));
  const items = articles.map((article, index) => ({
    ...article, id: `icon-item-${index}`, sourceId: sources[index].id, sourceTitle: sources[index].title,
    sourceUrl: "", external_id: `icon-item-${index}`, url: `https://example.invalid/post/${index}`,
    articleId: null, articleSlug: "", author: "", synced_at: date
  }));
  const records = articles.map((article, index) => ({
    id: `icon-push-${index}`, resourceType: "article", resourceId: article.id, title: article.title,
    category: article.category, resourceExists: true,
    resource: { type: "article", id: article.id, title: article.title, description: article.summary,
      url: `https://example.invalid/post/${index}`, demoUrl: "", image: "", category: article.category, tags: [] },
    messageMarkdown: article.title, mediaEnabled: false, mediaUrl: "", syncStatus: "not_pushed", sentAt: "", updatedAt: date
  }));
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  });
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url ?? String(input), location.href);
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (url.origin !== location.origin) {
      state.unexpected.push(`${method} ${url.href}`);
      throw new Error("分类图标回归禁止真实外部请求");
    }
    if (!url.pathname.startsWith("/api/")) return originalFetch(input, init);
    if (method === "PUT" && url.pathname === "/api/admin/category-icons") {
      const body = JSON.parse(init.body);
      state.writes.push({ path: url.pathname, body });
      persist();
      if (state.holdSaves) await new Promise((done) => state.pending.push(done));
      if (state.failNextSave) {
        state.failNextSave = false;
        return json({ error: "Category icon save failed." }, 500);
      }
      if (!scopes.includes(body.scope) || !state.settings[body.scope].includes(body.category))
        return json({ error: "Invalid category." }, 400);
      if (body.icon === null) delete state.icons[body.scope][body.category];
      else state.icons[body.scope][body.category] = structuredClone(body.icon);
      persist();
      return json({ icons: state.icons });
    }
    if (method === "PUT" && url.pathname === "/api/admin/categories") {
      const body = JSON.parse(init.body);
      state.writes.push({ path: url.pathname, body });
      if (body.scope && Array.isArray(body.categories)) state.settings[body.scope] = body.categories;
      persist();
      return json({ settings: state.settings, icons: state.icons });
    }
    if (method !== "GET") {
      state.unexpected.push(`${method} ${url.pathname}`);
      throw new Error("分类图标回归禁止未接管的写请求");
    }
    state.reads.push(url.pathname + url.search);
    const requestedCategory = url.searchParams.get("category");
    const filter = (values) => values.filter((value) => !requestedCategory || value.category === requestedCategory);
    const categoryCounts = Object.fromEntries(categories.map((name) => [name, 1]));
    if (["/api/tools", "/api/admin/tools"].includes(url.pathname)) return json({
      tools: filter(tools), total: filter(tools).length, categoryCounts, featuredTotal: 1, limit: 30, hasMore: false, nextCursor: null
    });
    if (["/api/articles", "/api/admin/articles"].includes(url.pathname)) return json({
      articles: filter(articles), total: filter(articles).length, categoryCounts, limit: 30, hasMore: false, nextCursor: null
    });
    if (url.pathname === "/api/admin/content-sources") return json({ sources });
    if (url.pathname === "/api/admin/content-items") return json({
      items: filter(items), total: filter(items).length, categoryCounts,
      sourceCounts: Object.fromEntries(sources.map((source) => [source.id, 1])), limit: 30, hasMore: false, nextCursor: null
    });
    if (url.pathname === "/api/admin/telegram-messages") return json({
      records: filter(records), categoryOptions: categories, limit: 30, hasMore: false, nextCursor: null
    });
    if (url.pathname === "/api/admin/categories") return json({ settings: state.settings, icons: state.icons });
    if (url.pathname === "/api/categories") return json({
      categories: categories.map((name, index) => ({ category: name, total: 1, featured_total: index === 0 ? 1 : 0 })),
      settings: state.settings, icons: state.icons
    });
    if (url.pathname === "/api/admin/telegram-settings") return json({
      settings: { available: true, enabled: true, target: "local-only", footerMarkdown: "" }
    });
    if (url.pathname === "/api/site-settings") return json({
      settings: { name: "HTools", subtitle: "分类图标本地验证", iconUrl: "" },
      umami: { enabled: false, scriptUrl: "", websiteId: "" }
    });
    if (url.pathname === "/api/proxy-settings") return json({
      settings: { enabled: false, baseUrl: "", mode: "prefix", scope: "all" }
    });
    if (url.pathname === "/api/auth/config") return json({ passwordConfigured: true, turnstile: { enabled: false, siteKey: "" } });
    if (url.pathname.endsWith("-settings")) return json({ settings: { available: false, enabled: false, sources: [] } });
    state.unexpected.push(`${method} ${url.pathname}`);
    return json({ error: `Unexpected API: ${url.pathname}` }, 404);
  };
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const js = (value) => JSON.stringify(value);
async function waitFor(expression, label = expression) {
  let value;
  for (let index = 0; index < 160; index++) {
    value = await evaluate(client, expression);
    if (value) return value;
    await pause(50);
  }
  throw new Error(`等待超时：${label}（${JSON.stringify(value)}）`);
}
async function click(selector) {
  const point = await evaluate(client, `(() => {
    const element = document.querySelector(${js(selector)});
    if (!element || element.disabled) throw new Error('控件不可点击：' + ${js(selector)});
    const initial = element.getBoundingClientRect();
    let clipped = initial.top < 0 || initial.bottom > innerHeight || initial.left < 0 || initial.right > innerWidth;
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
      if (/(auto|scroll)/.test(style.overflowY) && (initial.top < bounds.top || initial.bottom > bounds.bottom)) clipped = true;
      if (/(auto|scroll)/.test(style.overflowX) && (initial.left < bounds.left || initial.right > bounds.right)) clipped = true;
    }
    if (clipped)
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const rect = element.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  if (touch) {
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, radiusX: 1, radiusY: 1, force: 1 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await client.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point });
    await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
  }
}
async function key(value, shiftKey = false) {
  const code = value === " " ? "Space" : value;
  const virtualKey = { Escape: 27, Tab: 9, Enter: 13, " ": 32 }[value];
  const text = value === "Enter" ? "\r" : value === " " ? " " : undefined;
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: value, code, text, unmodifiedText: text,
    windowsVirtualKeyCode: virtualKey, modifiers: shiftKey ? 8 : 0 });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: value, code, modifiers: shiftKey ? 8 : 0 });
}
async function fill(selector, value) {
  await evaluate(client, `(() => {
    const input = document.querySelector(${js(selector)});
    if (!input || input.disabled) throw new Error('输入框不可用：' + ${js(selector)});
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${js(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}
async function paste(selector, value) {
  await click(selector);
  await evaluate(client, `document.querySelector(${js(selector)}).select()`);
  await client.send("Input.insertText", { text: value });
  await waitFor(`document.querySelector(${js(selector)}).value === ${js(value)}`, "SVG 代码粘贴到输入框");
}
async function frame(selector) {
  return evaluate(client, `(() => {
    const element = document.querySelector(${js(selector)});
    if (!element) throw new Error('缺少尺寸目标：' + ${js(selector)});
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      clientWidth: element.clientWidth, offsetWidth: element.offsetWidth };
  })()`);
}
function assertFrameUnchanged(actual, expected, message) {
  for (const [key, value] of Object.entries(expected)) {
    assert.ok(Math.abs(actual[key] - value) < 0.1, `${message}：${key}=${actual[key]}，预期 ${value}`);
  }
}
async function iconState(selector) {
  return evaluate(client, `(() => {
    const root = document.querySelector(${js(selector)});
    const image = root?.querySelector('.category-icon-image');
    return { svg: root?.querySelector('svg')?.getAttribute('class') ?? '',
      image: image?.getAttribute('src') ?? '', imageVisible: Boolean(image && getComputedStyle(image).visibility === 'visible'),
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0) };
  })()`);
}
async function fixtureState() {
  return evaluate(client, `(() => { const s = window.__categoryIconsCheck;
    return { icons: s.icons, writes: s.writes, reads: s.reads, unexpected: s.unexpected, pending: s.pending.length }; })()`);
}
async function screenshot(name) {
  const shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(artifacts, `${name}.png`), Buffer.from(shot.data, "base64"));
}
async function checkBounds() {
  const result = await evaluate(client, `(() => {
    const visible = (e) => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
    const panel = document.querySelector(${js(dialog)}), rect = panel?.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
      panel: rect ? { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null,
      panelOverflow: panel ? panel.scrollWidth > panel.clientWidth + 1 : false,
      controls: panel ? [...panel.querySelectorAll('.admin-category-icon-grid button,.admin-category-icon-mode button,.dialog-footer button')]
        .filter(visible).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height }; }) : [] };
  })()`);
  assert.equal(result.overflow, false, "页面横向溢出");
  assert.equal(result.panelOverflow, false, "弹窗内容横向溢出");
  if (result.panel) {
    assert.ok(result.panel.x >= -1 && result.panel.y >= -1, "弹窗超出视口起点");
    const viewport = await evaluate(client, "({width:innerWidth,height:innerHeight})");
    assert.ok(result.panel.right <= viewport.width + 1 && result.panel.bottom <= viewport.height + 1, "弹窗超出视口");
    for (const control of result.controls) assert.ok(control.x >= result.panel.x - 1 && control.right <= result.panel.right + 1, "按钮超出弹窗外框");
  }
  return result;
}
async function visit(route) {
  await navigate(client, `${origin}${route}?locale=${currentLocale}&theme=${currentTheme}`);
  if (route.startsWith("/admin/")) {
    await waitFor(`Boolean(document.querySelector(${js(trigger)})) && window.__categoryIconsCheck?.reads.includes('/api/admin/categories')`);
    await waitFor("!document.querySelector('.admin-resource-card-skeleton,.content-flow-skeleton')");
  } else {
    await waitFor("document.querySelectorAll('.category-rail button.category-item').length >= 3");
    await waitFor("Boolean(document.querySelector('.category-results[aria-busy=\"false\"]')) && !document.querySelector('.tool-card-skeleton,.article-item-skeleton')");
    await evaluate(client, "window.scrollTo({top:0,left:0,behavior:'instant'})");
  }
  await pause(100);
}
async function openFilter() {
  if (!await evaluate(client, "Boolean(document.querySelector('.admin-category-filter-popover'))")) await click(trigger);
  await waitFor("Boolean(document.querySelector('.admin-category-filter-popover'))");
  await evaluate(client, `(() => {
    for (const row of document.querySelectorAll('.admin-category-filter-option')) {
      const label = row.querySelector('.admin-category-select-option span')?.getAttribute('title');
      if (label === ${js(category)}) row.setAttribute('data-category-check-target', 'true');
    }
  })()`);
  await waitFor(`Boolean(document.querySelector(${js(targetRow)}))`);
  await pause(180);
}
async function openIcon() {
  await openFilter();
  await click(`${targetRow} .admin-category-icon-button`);
  await waitFor(`Boolean(document.querySelector(${js(dialog)}))`);
  await pause(280);
}
async function save() {
  await click(saveButton);
  await waitFor(`!document.querySelector(${js(dialog)})`);
  await pause(80);
}
async function choose(name) {
  await click(`${dialog} [data-icon-mode="lucide"]`);
  await waitFor(`Boolean(document.querySelector(${js(`${dialog} [data-icon-name="${name}"]`)}))`);
  await click(`${dialog} [data-icon-name="${name}"]`);
}
async function dismissDialog() {
  if (!touch) await click(`${dialog} .dialog-header .icon-button`);
  else {
    const point = await evaluate(client, `(() => {const r=document.querySelector('${dialog} .dialog-header').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+18}})()`);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, radiusX: 1, radiusY: 1, force: 1 }] });
    for (let index = 1; index <= 6; index++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x, y: point.y + index * 30, radiusX: 1, radiusY: 1, force: 1 }] });
      await pause(30);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await waitFor(`!document.querySelector(${js(dialog)})`);
}
async function markPublicCategory() {
  await evaluate(client, `(() => {
    const item = [...document.querySelectorAll('.category-rail button.category-item')]
      .find((e) => e.textContent.trim() === ${js(category)});
    if (!item) throw new Error('前台缺少自建分类');
    item.setAttribute('data-category-check-public', 'true');
  })()`);
}

async function checkScope(scope, name) {
  const result = { name: `${name}-${scope}`, scope };
  await visit(`/admin/${scope}`);
  result.before = await frame(trigger);
  const initialValue = await evaluate(client, `document.querySelector(${js(trigger)}).textContent`);
  await openFilter();
  result.defaultIcon = await iconState(`${targetRow} .admin-category-icon-button`);
  assert.match(result.defaultIcon.svg, /lucide-tags/, "自建分类没有默认标签图标");
  result.rowBefore = await frame(targetRow);
  result.specialRows = await evaluate(client, `([...document.querySelectorAll('.admin-category-filter-option')].map((row) => ({
    label: row.querySelector('.admin-category-select-option span')?.getAttribute('title'),
    editable: Boolean(row.querySelector('.admin-category-icon-button:not(:disabled)')),
    height: row.getBoundingClientRect().height,
    overflow: row.scrollWidth > row.clientWidth + 1
  })))`);
  for (const row of result.specialRows) {
    if (![category, otherCategory].includes(row.label)) assert.equal(row.editable, false, "特殊分类出现图标编辑入口");
    assert.equal(row.height, result.rowBefore.height, "特殊分类与普通分类的行高不统一");
    assert.equal(row.overflow, false, "分类行横向溢出");
  }
  await click(`${targetRow} .admin-category-icon-button`);
  await waitFor(`Boolean(document.querySelector(${js(dialog)}))`);
  await pause(280);
  assert.equal(await evaluate(client, `document.querySelector(${js(trigger)})?.textContent`), initialValue, "点击图标误改分类筛选");
  await click(`${dialog} [data-icon-mode="lucide"]`);
  assert.equal(await evaluate(client, `document.querySelectorAll('${dialog} [data-icon-name]').length`), iconNames.length, "图标库数量不完整");
  await fill(`${dialog} .admin-category-icon-search`, "文件夹");
  await waitFor(`Boolean(document.querySelector('${dialog} [data-icon-name="folder"]')) && document.querySelectorAll('${dialog} [data-icon-name]').length < ${iconNames.length}`);
  assert.equal(await evaluate(client, `Boolean(document.querySelector('${dialog} [data-icon-name="server"]'))`), false, "中文搜索包含无关图标");
  await fill(`${dialog} .admin-category-icon-search`, "missing-category-icon-check");
  await waitFor(`Boolean(document.querySelector('${dialog} .admin-category-icon-empty'))`);
  await fill(`${dialog} .admin-category-icon-search`, "");
  const lastName = iconNames.at(-1);
  await click(`${dialog} [data-icon-name="${lastName}"]`);
  assert.equal(await evaluate(client, `document.querySelector('${dialog} [data-icon-name="${lastName}"]').getAttribute('aria-pressed')`), "true", "图标库末项无法点击");
  await click(`${dialog} [data-icon-name="${iconByScope[scope]}"]`);
  result.dialog = await checkBounds();
  if (["1366", "419"].some((width) => name.startsWith(width))) await screenshot(`${result.name}-choose`);
  await save();
  assert.deepEqual((await fixtureState()).icons[scope][category], { type: "lucide", value: iconByScope[scope] });
  await openFilter();
  result.selectedIcon = await iconState(`${targetRow} .admin-category-icon-button`);
  assert.match(result.selectedIcon.svg, new RegExp(`lucide-${iconByScope[scope]}(?:\\s|$)`));
  result.rowAfter = await frame(targetRow);
  assert.deepEqual(result.rowAfter, result.rowBefore, "更换图标后分类行外框变化");
  await click(`${targetRow} .admin-category-select-option`);
  await waitFor("!document.querySelector('.admin-category-filter-popover')");
  assert.equal(await evaluate(client, `document.querySelector(${js(trigger)}).querySelector('.admin-category-filter-value').textContent`), category, "分类名称点击未筛选");
  assert.equal(await evaluate(client, `Boolean(document.querySelector(${js(dialog)}))`), false, "普通分类选择误开图标弹窗");
  result.after = await frame(trigger);
  assert.deepEqual(result.after, result.before, "选分类后公共筛选器外框变化");
  assert.match((await iconState(trigger)).svg, new RegExp(`lucide-${iconByScope[scope]}(?:\\s|$)`));
  await visit(`/admin/${scope}`);
  await openFilter();
  assert.match((await iconState(`${targetRow} .admin-category-icon-button`)).svg, new RegExp(`lucide-${iconByScope[scope]}(?:\\s|$)`), "刷新丢失分类图标");
  await key("Escape");
  result.fixture = await fixtureState();
  assert.deepEqual(result.fixture.unexpected, []);
  for (const [otherScope, icon] of Object.entries(result.fixture.icons)) {
    if (Object.hasOwn(icon, category)) assert.equal(icon[category].value, iconByScope[otherScope], "同名分类跨栏目覆盖");
  }
  await checkBounds();
  report.results.push(result);
  console.log(`[通过] ${result.name}：默认、搜索、保存刷新、独立分类与外框`);
}

async function checkPublic(scope, name, expected = iconByScope[scope]) {
  await visit(`/${scope}`);
  await markPublicCategory();
  const selector = '[data-category-check-public="true"]';
  const result = { name: `${name}-public-${scope}`, before: await frame(selector), icon: await iconState(selector) };
  assert.match(result.icon.svg, new RegExp(`lucide-${expected}(?:\\s|$)`), "前台未同步后台分类图标");
  await click(selector);
  await waitFor(`document.querySelector(${js(selector)}).getAttribute('aria-pressed') === 'true'`);
  await waitFor("window.scrollY === 0", "分类点击后回到页首");
  result.after = await frame(selector);
  assert.deepEqual(result.after, result.before, "前台选分类时外框变化");
  await checkBounds();
  result.fixture = await fixtureState();
  assert.deepEqual(result.fixture.unexpected, []);
  report.results.push(result);
  console.log(`[通过] ${result.name}：前台同步、选择与外框`);
}

async function checkFailureAndImages(name) {
  const result = { name: `${name}-failure-images-keyboard` };
  await visit("/admin/tools");
  await openIcon();
  await click(`${dialog} [data-icon-mode="image"]`);
  await fill(`${dialog} .admin-category-icon-url`, "javascript:alert(1)");
  const beforeInvalid = (await fixtureState()).writes.length;
  await click(saveButton);
  await waitFor(`document.querySelector('${dialog} .admin-category-icon-url').getAttribute('aria-invalid') === 'true'`);
  assert.equal((await fixtureState()).writes.length, beforeInvalid, "无效地址发出了保存请求");
  const validImage = "https://icons.example.invalid/valid.png";
  await fill(`${dialog} .admin-category-icon-url`, validImage);
  await waitFor(`(() => {const img=document.querySelector('${dialog} .admin-category-icon-preview img');return Boolean(img?.complete&&img.naturalWidth>0&&getComputedStyle(img).visibility==='visible')})()`);
  result.imagePreview = await iconState(`${dialog} .admin-category-icon-preview`);
  await evaluate(client, "window.__categoryIconsCheck.failNextSave = true");
  await click(saveButton);
  await waitFor(`Boolean(document.querySelector('${dialog} [role="alert"]')) && !document.querySelector(${js(saveButton)}).disabled`);
  assert.equal(await evaluate(client, `document.querySelector('${dialog} .admin-category-icon-url').value`), validImage, "失败后草稿丢失");
  assert.deepEqual((await fixtureState()).icons.tools[category], { type: "lucide", value: "folder" }, "失败请求覆盖了已保存图标");
  const beforeDouble = (await fixtureState()).writes.length;
  await evaluate(client, "window.__categoryIconsCheck.holdSaves = true");
  await evaluate(client, `(() => {const button=document.querySelector(${js(saveButton)});button.click();button.click();})()`);
  await waitFor("window.__categoryIconsCheck.pending.length > 0");
  await pause(150);
  assert.equal((await fixtureState()).writes.length, beforeDouble + 1, "连续保存发出重复请求");
  assert.equal(await evaluate(client, `document.querySelector(${js(saveButton)}).disabled`), true, "保存中没有禁用按钮");
  await key("Escape");
  assert.equal(await evaluate(client, `Boolean(document.querySelector(${js(dialog)}))`), true, "保存中 Escape 关闭了弹窗");
  await evaluate(client, "window.__categoryIconsCheck.holdSaves=false;window.__categoryIconsCheck.pending.splice(0).forEach(done=>done())");
  await waitFor(`!document.querySelector(${js(dialog)})`);
  assert.deepEqual((await fixtureState()).icons.tools[category], { type: "image", value: validImage });
  await visit("/tools");
  await markPublicCategory();
  const publicSelector = '[data-category-check-public="true"]';
  await waitFor(`(() => {const img=document.querySelector(${js(publicSelector)}).querySelector('img');return Boolean(img?.complete&&img.naturalWidth>0&&getComputedStyle(img).visibility==='visible')})()`);
  result.publicImage = await iconState(publicSelector);
  result.publicImageFrame = await frame(publicSelector);
  await visit("/admin/tools");
  await openIcon();
  const brokenImage = "https://icons.example.invalid/broken.png";
  await fill(`${dialog} .admin-category-icon-url`, brokenImage);
  await waitFor(`document.querySelector('${dialog} .admin-category-icon-status').textContent.trim().length > 0 && Boolean(document.querySelector('${dialog} .admin-category-icon-preview .lucide-tags'))`);
  await waitFor(`(() => {const img=document.querySelector('${dialog} .admin-category-icon-preview img');return Boolean(img?.complete&&img.naturalWidth===0)})()`);
  result.failedImagePreview = await iconState(`${dialog} .admin-category-icon-preview`);
  assert.equal(result.failedImagePreview.imageVisible, false);
  assert.match(result.failedImagePreview.svg, /lucide-tags/);
  result.dialog = await checkBounds();
  await screenshot(`${result.name}-fallback`);
  await save();
  await visit("/tools");
  await markPublicCategory();
  await waitFor(`(() => {const img=document.querySelector(${js(publicSelector)}).querySelector('img');return Boolean(img?.complete&&img.naturalWidth===0)})()`);
  result.publicFailedImage = await iconState(publicSelector);
  assert.equal(result.publicFailedImage.imageVisible, false);
  assert.match(result.publicFailedImage.svg, /lucide-tags/);
  assert.deepEqual(await frame(publicSelector), result.publicImageFrame, "图片失败回退改变分类外框");
  await visit("/admin/tools");
  await openIcon();
  await fill(`${dialog} .admin-category-icon-url`, "");
  await save();
  assert.equal(Object.hasOwn((await fixtureState()).icons.tools, category), false, "空图片地址没有恢复默认");
  await openIcon();
  await choose("folder");
  await save();
  await openIcon();
  await click(`${dialog} .admin-category-icon-restore`);
  assert.equal(await evaluate(client, `document.querySelector('${dialog} [data-icon-mode="default"]').getAttribute('aria-pressed')`), "true");
  await save();
  assert.equal(Object.hasOwn((await fixtureState()).icons.tools, category), false, "恢复默认后配置仍残留");
  await openFilter();
  await evaluate(client, `document.querySelector(${js(`${targetRow} .admin-category-icon-button`)}).focus()`);
  await key("Enter");
  await waitFor(`Boolean(document.querySelector(${js(dialog)}))`);
  await pause(280);
  await key("Tab");
  assert.equal(await evaluate(client, `Boolean(document.activeElement.closest(${js(dialog)}))`), true, "键盘焦点离开弹窗");
  await evaluate(client, `document.querySelector('${dialog} [data-icon-mode="lucide"]').focus()`);
  await key(" ");
  await waitFor(`document.querySelector('${dialog} [data-icon-mode="lucide"]').getAttribute('aria-pressed') === 'true'`);
  await key("Escape");
  await waitFor(`!document.querySelector(${js(dialog)})`);
  await waitFor(`document.activeElement === document.querySelector(${js(trigger)})`);
  await openIcon();
  await choose("folder");
  await dismissDialog();
  assert.equal(Object.hasOwn((await fixtureState()).icons.tools, category), false, "取消弹窗仍保存了草稿");
  result.fixture = await fixtureState();
  assert.deepEqual(result.fixture.unexpected, []);
  for (const scope of ["articles", "content", "push"])
    assert.deepEqual(result.fixture.icons[scope][category], { type: "lucide", value: iconByScope[scope] }, "工具图标操作影响其他栏目");
  report.results.push(result);
  console.log(`[通过] ${result.name}：校验、失败草稿、防连点、图片回退、恢复默认与键盘`);
}

async function readSvgImage(selector) {
  await waitFor(`(() => {const image=document.querySelector(${js(selector)})?.querySelector('img');
    return Boolean(image?.complete && image.naturalWidth > 0 && getComputedStyle(image).visibility === 'visible')})()`, "SVG 图片完成渲染");
  const state = await evaluate(client, `(() => {
    const root=document.querySelector(${js(selector)}), image=root.querySelector('img');
    const source=image.getAttribute('src'), separator=source.indexOf(',');
    const markup=source.slice(0,separator).includes(';base64') ? atob(source.slice(separator+1)) : decodeURIComponent(source.slice(separator+1));
    const documentSvg=new DOMParser().parseFromString(markup,'image/svg+xml');
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const context=canvas.getContext('2d');context.drawImage(image,0,0,64,64);
    const pixels=context.getImageData(0,0,64,64).data, opaqueColors=new Set();
    let nontransparent=0;
    for(let offset=0;offset<pixels.length;offset+=4){
      if(pixels[offset+3])nontransparent++;
      if(pixels[offset+3]===255)opaqueColors.add([pixels[offset],pixels[offset+1],pixels[offset+2]].join(','));
    }
    return { source, markup, inlineSvgCount:root.querySelectorAll('svg').length,
      filter:getComputedStyle(image).filter, width:image.getBoundingClientRect().width,
      height:image.getBoundingClientRect().height, viewBox:documentSvg.documentElement.getAttribute('viewBox'),
      pathCount:documentSvg.querySelectorAll('path').length,
      pathColors:[...documentSvg.querySelectorAll('path')].map(path=>path.getAttribute('fill')),
      opaqueColors:[...opaqueColors], nontransparent };
  })()`);
  assert.match(state.source, /^data:image\/svg\+xml[;,]/, "SVG 代码没有作为图片渲染");
  assert.equal(state.inlineSvgCount, 0, "用户 SVG 被直接插入了页面 DOM");
  assert.ok(state.nontransparent > 0 && state.opaqueColors.length > 0, "SVG 图片未绘制可见内容");
  return state;
}

async function checkSvgVariant(name) {
  const input = `${dialog} textarea.admin-category-icon-url`;
  const preview = `${dialog} .admin-category-icon-preview`;
  const publicSelector = '[data-category-check-public="true"]';
  const defaultFrames = {};
  for (const scope of ["tools", "articles"]) {
    await visit(`/${scope}`);
    await markPublicCategory();
    defaultFrames[scope] = await frame(publicSelector);
  }
  await visit("/admin/tools");
  await openIcon();
  await click(`${dialog} [data-icon-mode="lucide"]`);
  const allNames = await evaluate(client, `([...document.querySelectorAll('${dialog} [data-icon-name]')].map(button=>button.dataset.iconName))`);
  assert.deepEqual(allNames, iconNames, "浏览器图标库与共享图标清单不一致");
  const lastName = iconNames.at(-1);
  await click(`${dialog} [data-icon-name="${lastName}"]`);
  assert.equal(await evaluate(client, `document.querySelector('${dialog} [data-icon-name="${lastName}"]').getAttribute('aria-pressed')`), "true", "新图标库末项无法触摸选择");
  await fill(`${dialog} .admin-category-icon-search`, "文件夹");
  await waitFor(`Boolean(document.querySelector('${dialog} [data-icon-name="folder"]')) && document.querySelectorAll('${dialog} [data-icon-name]').length < ${iconNames.length}`);
  assert.equal(await evaluate(client, `Boolean(document.querySelector('${dialog} [data-icon-name="server"]'))`), false);
  await fill(`${dialog} .admin-category-icon-search`, lastName);
  await waitFor(`Boolean(document.querySelector('${dialog} [data-icon-name="${lastName}"]'))`);
  const libraryBounds = await checkBounds();
  report.results.push({ name: `${name}-expanded-library`, count: allNames.length, lastName, bounds: libraryBounds });
  console.log(`[通过] ${name}-expanded-library：共享 ${allNames.length} 图标、中文搜索和末项 ${lastName}`);

  await click(`${dialog} [data-icon-mode="image"]`);
  const previewBefore = await frame(preview);
  await paste(input, ICONFONT_ARROW_SVG);
  const originalPreview = await readSvgImage(preview);
  assert.equal(originalPreview.viewBox, "0 0 1024 1024", "用户原 SVG 的 viewBox 丢失");
  assert.equal(originalPreview.pathCount, 2, "用户原 SVG 的两条路径丢失");
  assert.deepEqual(originalPreview.pathColors, ["#333333", "#333333"], "用户指定颜色被更改");
  assert.deepEqual(originalPreview.opaqueColors, ["51,51,51"], "用户原 SVG 的实际绘制颜色不是 #333333");
  assert.equal(originalPreview.filter, "none", "明确颜色的 SVG 被主题滤镜覆盖");
  assert.deepEqual(await frame(preview), previewBefore, "粘贴 SVG 后预览框尺寸或位置变化");
  await evaluate(client, "window.__categoryIconsCheck.failNextSave=true");
  await click(saveButton);
  await waitFor(`Boolean(document.querySelector('${dialog} [role="alert"]')) && !document.querySelector(${js(saveButton)}).disabled`);
  assert.equal(await evaluate(client, `document.querySelector(${js(input)}).value`), ICONFONT_ARROW_SVG, "SVG 保存失败后草稿丢失");
  await save();
  const savedOriginal = (await fixtureState()).icons.tools[category];
  assert.equal(savedOriginal.type, "svg");
  assert.equal(savedOriginal.value, originalPreview.markup, "保存值与已验证的 SVG 不一致");
  await visit("/admin/tools");
  await openIcon();
  assert.equal(await evaluate(client, `document.querySelector(${js(input)}).value`), savedOriginal.value, "刷新后 SVG 代码丢失");
  await paste(input, ESCAPED_ICONFONT_ARROW_SVG);
  const escapedPreview = await readSvgImage(preview);
  assert.equal(escapedPreview.markup, savedOriginal.value, "聊天转义 SVG 未恢复成原始图标");
  await screenshot(`${name}-svg-original`);
  await save();
  await visit("/tools");
  await markPublicCategory();
  const publicOriginal = await readSvgImage(publicSelector);
  assert.equal(publicOriginal.markup, savedOriginal.value, "前台 SVG 与后台保存值不同");
  assert.deepEqual(publicOriginal.opaqueColors, ["51,51,51"]);
  assert.equal(publicOriginal.filter, "none");
  assert.deepEqual(await frame(publicSelector), defaultFrames.tools, "自定义 SVG 改变前台分类外框");

  const currentColorSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>';
  await visit("/admin/articles");
  await openIcon();
  await click(`${dialog} [data-icon-mode="image"]`);
  await paste(input, currentColorSvg);
  const themedPreview = await readSvgImage(preview);
  assert.equal(themedPreview.filter, currentTheme === "dark" ? "invert(1)" : "none", "currentColor 图标没有适配当前主题");
  await save();
  await visit("/articles");
  await markPublicCategory();
  const publicThemed = await readSvgImage(publicSelector);
  assert.equal(publicThemed.filter, currentTheme === "dark" ? "invert(1)" : "none");
  assert.deepEqual(await frame(publicSelector), defaultFrames.articles, "currentColor SVG 改变前台分类外框");
  await checkBounds();
  report.results.push({ name: `${name}-svg-storage-theme`, previewBefore, originalPreview, escapedPreview,
    publicOriginal, themedPreview, publicThemed, savedOriginal, defaultFrames });
  console.log(`[通过] ${name}-svg-storage-theme：原 SVG 与转义粘贴、保色、失败草稿、刷新和前台主题`);

  await visit("/admin/tools");
  await openIcon();
  const validFrame = await frame(preview);
  const beforeUnsafe = await fixtureState();
  const rejected = [];
  for (const code of [...UNSAFE_CATEGORY_SVGS, '<svg><path d="M0 0h20v20z"></svg>']) {
    await paste(input, code);
    await click(saveButton);
    await waitFor(`document.querySelector(${js(input)}).getAttribute('aria-invalid') === 'true'`, "不安全 SVG 被拒绝");
    assert.equal((await fixtureState()).writes.length, beforeUnsafe.writes.length, "不安全 SVG 触发了保存请求");
    assert.deepEqual((await fixtureState()).icons, beforeUnsafe.icons, "不安全 SVG 改写了已保存图标");
    assert.equal(await evaluate(client, "globalThis.__svgAttack === true"), false, "不安全 SVG 执行了脚本");
    assertFrameUnchanged(await frame(preview), validFrame, "无效 SVG 撑开预览框");
    rejected.push(code);
  }
  assert.deepEqual(report.blocked, [], "SVG 触发外部资源请求");
  assert.deepEqual(report.dialogs, [], "SVG 执行了浏览器对话框");
  await screenshot(`${name}-svg-invalid`);
  await checkBounds();
  report.results.push({ name: `${name}-svg-rejection`, rejected, writes: beforeUnsafe.writes.length, validFrame });
  console.log(`[通过] ${name}-svg-rejection：${rejected.length} 种无效或不安全输入，无写入、外网或弹框`);

  const png = "https://icons.example.invalid/valid.png";
  await paste(input, png);
  await waitFor(`(() => {const img=document.querySelector(${js(preview)})?.querySelector('img');return Boolean(img?.complete&&img.naturalWidth>0&&img.getAttribute('src')===${js(png)})})()`);
  assert.deepEqual(await frame(preview), validFrame, "切回图片地址改变预览框");
  await save();
  assert.deepEqual((await fixtureState()).icons.tools[category], { type: "image", value: png });
  await visit("/tools");
  await markPublicCategory();
  await waitFor(`(() => {const img=document.querySelector(${js(publicSelector)})?.querySelector('img');return Boolean(img?.complete&&img.naturalWidth>0)})()`);
  assert.equal((await iconState(publicSelector)).image, png);
  assert.deepEqual(await frame(publicSelector), defaultFrames.tools);
  await visit("/admin/tools");
  await openIcon();
  await click(`${dialog} .admin-category-icon-restore`);
  await save();
  const finalFixture = await fixtureState();
  assert.equal(Object.hasOwn(finalFixture.icons.tools, category), false, "自定义图片恢复默认失败");
  assert.equal(finalFixture.icons.articles[category].type, "svg", "恢复工具图标时影响文章图标");
  assert.deepEqual(finalFixture.unexpected, []);
  report.results.push({ name: `${name}-png-compatibility`, fixture: finalFixture });
  console.log(`[通过] ${name}-png-compatibility：PNG 地址、前台显示与恢复默认继续正常`);
}

async function markLegacyAdminRow(value) {
  if (!await evaluate(client, "Boolean(document.querySelector('.admin-category-filter-popover'))")) await click(trigger);
  await waitFor("Boolean(document.querySelector('.admin-category-filter-popover'))");
  await evaluate(client, "Promise.all(document.querySelector('.admin-category-filter-popover').getAnimations().map(animation => animation.finished))", { awaitPromise: true });
  await evaluate(client, `(() => {
    const row=[...document.querySelectorAll('.admin-category-filter-option')]
      .find(item=>item.querySelector('.admin-category-select-option span')?.getAttribute('title')===${js(value)});
    if(!row)throw new Error('后台缺少旧分类：'+${js(value)});
    row.setAttribute('data-category-check-legacy',${js(value)});
  })()`);
  return `.admin-category-filter-option[data-category-check-legacy=${js(value)}]`;
}

async function checkLegacyNames(scope, name, admin) {
  const result = { name: `${name}-legacy-${admin ? "admin" : "public"}-${scope}`, categories: [] };
  await visit(`${admin ? "/admin" : ""}/${scope}`);
  for (const value of legacyNames) {
    let selector;
    if (admin) selector = await markLegacyAdminRow(value);
    else {
      await evaluate(client, `(() => {
        const item=[...document.querySelectorAll('.category-rail button.category-item')].find(element=>element.textContent.trim()===${js(value)});
        if(!item)throw new Error('前台缺少旧分类：'+${js(value)});
        item.setAttribute('data-category-check-legacy',${js(value)});
      })()`);
      selector = `.category-rail button[data-category-check-legacy=${js(value)}]`;
    }
    const state = { value, icon: await iconState(selector), frame: await frame(selector) };
    assert.match(state.icon.svg, /lucide-tags/, `${value} 没有正确回退到默认图标`);
    if (admin) {
      const label = await evaluate(client, `(() => { const element = document.querySelector(${js(selector)}).querySelector('.admin-category-select-option span'); return { full: element.title, visible: element.textContent }; })()`);
      assert.equal(label.full, value, "后台旧分类完整名称丢失");
      assert.equal(label.visible, value === "constructor" ? "construct…" : value, "后台旧分类未沿用名称省略规则");
      state.editable = await evaluate(client, `Boolean(document.querySelector(${js(selector)}).querySelector('.admin-category-icon-button:not(:disabled)'))`);
      assert.equal(state.editable, value === "toString", "旧分类图标编辑权限与名称边界不符");
      if (state.editable) {
        await click(`${selector} .admin-category-icon-button`);
        await waitFor(`Boolean(document.querySelector(${js(dialog)}))`);
        await pause(280);
        assert.match(await evaluate(client, `document.querySelector('${dialog} .dialog-header h2').textContent`), /toString/);
        await dismissDialog();
        await pause(350);
        selector = await markLegacyAdminRow(value);
      }
      await click(`${selector} .admin-category-select-option`);
      await waitFor("!document.querySelector('.admin-category-filter-popover')");
      assert.equal(await evaluate(client, `document.querySelector(${js(trigger)}).querySelector('.admin-category-filter-value').title`), value, "旧分类无法正常筛选");
      assert.match((await iconState(trigger)).svg, /lucide-tags/);
    } else {
      await click(selector);
      await waitFor(`document.querySelector(${js(selector)}).getAttribute('aria-pressed')==='true'`);
      await waitFor("window.scrollY===0");
      const selectedFrame = await frame(selector);
      if (touch) {
        for (const key of ["width", "height", "clientWidth", "offsetWidth"]) {
          assert.equal(selectedFrame[key], state.frame[key], "手机横向分类滚动改变外框尺寸");
        }
      } else assert.deepEqual(selectedFrame, state.frame, "旧分类选择改变前台外框");
    }
    result.categories.push(state);
    await checkBounds();
  }
  if (admin) await markLegacyAdminRow("toString");
  await screenshot(result.name);
  result.fixture = await fixtureState();
  assert.deepEqual(result.fixture.writes, [], "旧分类读取与筛选产生写入");
  assert.deepEqual(result.fixture.unexpected, []);
  report.results.push(result);
  console.log(`[通过] ${result.name}：三种旧分类原样显示、默认图标、筛选和编辑边界`);
}

async function checkPushSources(name) {
  await visit("/admin/push");
  const result = { name: `${name}-push-sources`, sources: [] };
  const labels = currentLocale === "zh"
    ? ["工具库", "文章管理", "订阅内容"]
    : ["Tool Library", "Articles", "Subscription Content"];
  const expected = ["wrench", "file-text", "rss"];
  const triggerBefore = await frame(trigger);
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index];
    const selector = await markLegacyAdminRow(label);
    const before = await frame(selector);
    const icon = await iconState(selector);
    assert.match(icon.svg, new RegExp(`lucide-${expected[index]}(?:\\s|$)`), `${label} 来源图标仍为通用标签`);
    assert.equal(await evaluate(client, `Boolean(document.querySelector(${js(selector)}).querySelector('.admin-category-icon-button'))`), false, "固定来源出现自定义入口");
    await click(`${selector} .admin-category-select-option`);
    await waitFor("!document.querySelector('.admin-category-filter-popover')");
    assert.equal(await evaluate(client, `document.querySelector(${js(trigger)}).querySelector('.admin-category-filter-value').title`), label);
    assert.match((await iconState(trigger)).svg, new RegExp(`lucide-${expected[index]}(?:\\s|$)`), "选中来源后图标不一致");
    assert.deepEqual(await frame(trigger), triggerBefore, "来源选择改变筛选器外框");
    await markLegacyAdminRow(label);
    assert.match((await iconState(trigger)).svg, new RegExp(`lucide-${expected[index]}(?:\\s|$)`), "展开筛选器后来源图标不一致");
    assert.deepEqual(await frame(selector), before, "来源选择改变下拉行外框");
    assert.equal(await evaluate(client, `document.querySelector(${js(selector)}).querySelector('.admin-category-select-option').getAttribute('aria-selected')`), "true");
    result.sources.push({ label, icon, frame: before });
    await checkBounds();
    await key("Escape");
  }
  await markLegacyAdminRow(labels[2]);
  await screenshot(result.name);
  result.fixture = await fixtureState();
  assert.deepEqual(result.fixture.writes, [], "固定来源筛选产生写入");
  assert.deepEqual(result.fixture.unexpected, []);
  report.results.push(result);
  console.log(`[通过] ${result.name}：三个来源图标、展开与收起、鼠标或触摸筛选及外框`);
}

process.once("SIGINT", () => client?.close());
process.once("SIGTERM", () => client?.close());
try {
  categorySvgModule = await compileTypescriptModule(new URL("../../src/category-svg.ts", import.meta.url));
  categoryIconModule = await compileTypescriptModule(new URL("../../src/category-icon-settings.ts", import.meta.url), {
    importReplacements: { "./category-svg": categorySvgModule.url.href }
  });
  ({ CATEGORY_ICON_NAMES: iconNames } = await import(categoryIconModule.url.href));
  await mkdir(runtime, { recursive: true });
  await mkdir(artifacts, { recursive: true });
  browser = await launchEdge(join(runtime, "profile"));
  ({ client } = await openPage(browser));
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  client.on("Runtime.exceptionThrown", (event) => report.errors.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text));
  client.on("Page.javascriptDialogOpening", (event) => {
    report.dialogs.push({ type: event.type, message: event.message });
    void client.send("Page.handleJavaScriptDialog", { accept: false }).catch(() => {});
  });
  client.on("Fetch.requestPaused", (event) => {
    const url = new URL(event.request.url);
    if (url.origin === origin && /^\/assets\/.*\.(?:js|css)$/.test(url.pathname) && !report.assets.includes(url.pathname))
      report.assets.push(url.pathname);
    if (url.hostname === "icons.example.invalid") {
      report.images.push(url.href);
      void client.send("Fetch.fulfillRequest", {
        requestId: event.requestId, responseCode: url.pathname === "/broken.png" ? 404 : 200,
        responseHeaders: [{ name: "Content-Type", value: "image/png" }],
        body: url.pathname === "/broken.png" ? "" : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII="
      }).catch(() => {});
      return;
    }
    if (url.origin === origin && url.pathname.startsWith("/icons/")) {
      void client.send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "image/svg+xml" }],
        body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>').toString("base64")
      }).catch(() => {});
      return;
    }
    const blocked = url.origin !== origin || event.request.method !== "GET" || url.pathname.startsWith("/api/");
    if (blocked) report.blocked.push(`${event.request.method} ${event.request.url}`);
    void client.send(blocked ? "Fetch.failRequest" : "Fetch.continueRequest", blocked
      ? { requestId: event.requestId, errorReason: "BlockedByClient" }
      : { requestId: event.requestId }).catch(() => {});
  });
  await client.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(${installFixture.toString()})(${js({ storageKey, category, otherCategory,
      ...(namesOnly ? { categories: legacyNames } : {}) })})`
  });
  console.log("[通过] 分类图标回归启动：单个临时 Edge，复用 8788 静态资源，API 与图片全部本地替身");
  for (const [width, height] of [[2560, 1440], [1920, 1080], [1366, 768], [419, 790]]) {
    if (svgOnly || namesOnly || sourcesOnly) continue;
    if (!selectedWidths.has(width)) continue;
    touch = width < 921;
    currentLocale = "zh";
    currentTheme = "light";
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: 1 });
    if (await evaluate(client, "location.origin !== 'null'")) await evaluate(client, `sessionStorage.removeItem(${js(storageKey)})`);
    const name = `${width}-zh-light`;
    report.current = name;
    for (const scope of Object.keys(iconByScope)) await checkScope(scope, name);
    for (const scope of ["tools", "articles"]) await checkPublic(scope, name);
    if ([1366, 419].includes(width)) await checkFailureAndImages(name);
  }
  currentLocale = "en";
  currentTheme = "dark";
  for (const [width, height] of [[1366, 768], [419, 790]]) {
    if (svgOnly || namesOnly || sourcesOnly) continue;
    if (!selectedWidths.has(width)) continue;
    touch = width < 921;
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: 1 });
    await evaluate(client, `sessionStorage.removeItem(${js(storageKey)})`);
    const name = `${width}-en-dark`;
    report.current = name;
    for (const scope of Object.keys(iconByScope)) await checkScope(scope, name);
    for (const scope of ["tools", "articles"]) await checkPublic(scope, name);
  }
  for (const [width, height] of [[1366, 768], [419, 790]]) {
    if (namesOnly || sourcesOnly) continue;
    if (!selectedWidths.has(width)) continue;
    touch = width < 921;
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: 1 });
    for (const [locale, theme] of [["zh", "light"], ["en", "dark"]]) {
      currentLocale = locale;
      currentTheme = theme;
      if (await evaluate(client, "location.origin !== 'null'")) await evaluate(client, `sessionStorage.removeItem(${js(storageKey)})`);
      const name = `${width}-${locale}-${theme}`;
      report.current = `${name}-svg`;
      await checkSvgVariant(name);
    }
  }
  if (namesOnly) for (const [width, height] of [[1366, 768], [419, 790]]) {
    if (!selectedWidths.has(width)) continue;
    touch = width < 921;
    currentLocale = "zh";
    currentTheme = "light";
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: 1 });
    const name = `${width}-zh-light`;
    report.current = `${name}-legacy`;
    await checkLegacyNames("tools", name, true);
    await checkLegacyNames("tools", name, false);
  }
  if (sourcesOnly) for (const [width, height] of [[1366, 768], [419, 790]]) {
    if (!selectedWidths.has(width)) continue;
    touch = width < 921;
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: 1 });
    for (const [locale, theme] of [["zh", "dark"], ["en", "light"]]) {
      currentLocale = locale;
      currentTheme = theme;
      const name = `${width}-${locale}-${theme}`;
      report.current = `${name}-push-sources`;
      await checkPushSources(name);
    }
  }
  assert.deepEqual(report.errors, [], "浏览器运行异常");
  assert.deepEqual(report.blocked, [], "存在未接管网络请求");
  assert.deepEqual(report.dialogs, [], "自定义图标触发了浏览器对话框");
  report.status = "passed";
} catch (error) {
  report.error = error.stack;
  if (client) {
    report.diagnostic = await evaluate(client, `({ url:location.href, active:document.activeElement?.outerHTML,
      dialog:document.querySelector(${js(dialog)})?.outerHTML, body:document.body.innerText.slice(0,12000),
      fixture:window.__categoryIconsCheck ? {icons:window.__categoryIconsCheck.icons,writes:window.__categoryIconsCheck.writes,
        reads:window.__categoryIconsCheck.reads,unexpected:window.__categoryIconsCheck.unexpected} : null })`).catch(() => null);
    await screenshot("failure").catch(() => {});
  }
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  client?.close();
  await closeBrowser(browser);
  await safeRemove(runtimeRoot, runtime);
  await categoryIconModule?.cleanup();
  await categorySvgModule?.cleanup();
  report.finishedAt = new Date().toISOString();
  await mkdir(artifacts, { recursive: true });
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ status: report.status, scenarios: report.results.length, report: join(artifacts, "report.json") }));
}
