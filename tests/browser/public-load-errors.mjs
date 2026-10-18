import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { launchEdge, openPage, navigate, evaluate, closeBrowser, safeRemove } from "../../scripts/browser-regression.mjs";

// 所有业务请求都在本轮 Edge 内替换；8788 仅提供静态资源。
const origin = process.argv.find((arg) => arg.startsWith("--origin="))?.slice(9) ?? "http://127.0.0.1:8788";
const runId = `public-load-errors-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const runtimeRoot = resolve("tmp/browser-regression/runtime");
const runtime = join(runtimeRoot, runId);
const artifacts = resolve("tmp/browser-regression/artifacts", runId);
const report = { status: "failed", results: [], errors: [], blocked: [], assets: [] };
let browser, client;
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => client?.close());

function installResponses() {
  const params = new URLSearchParams(location.search);
  const kind = params.get("checkKind");
  const locale = params.get("checkLocale") ?? localStorage.getItem("htools_locale") ?? "zh";
  const failure = params.get("checkFailure") === "network" ? "network" : Number(params.get("checkFailure"));
  localStorage.removeItem("htools_token");
  localStorage.removeItem("htools_site_settings_cache");
  localStorage.setItem("htools_locale", locale);
  localStorage.setItem("htools_theme", "light");
  const state = window.__publicLoadCheck = {
    kind, locale, failure,
    outcomes: { detail: 200, tools: 200, articles: 200, site: 200 },
    reads: [], writes: [], unexpected: [],
    hold: { detail: false, tools: false, articles: false, site: false },
    pending: { detail: [], tools: [], articles: [], site: [] }
  };
  for (const resource of kind === "home" ? ["tools", "articles"] : [kind]) state.outcomes[resource] = failure;
  state.release = (resource, outcome) => {
    state.outcomes[resource] = outcome;
    state.hold[resource] = false;
    for (const done of state.pending[resource].splice(0)) done();
  };
  const date = "2026-10-17T00:00:00Z";
  const article = {
    id: "error-check-article", slug: "error-check-article",
    title: locale === "zh" ? "恢复后的文章" : "Recovered article",
    summary: locale === "zh" ? "重新加载后显示的文章摘要。" : "Article summary after retry.",
    content: locale === "zh" ? "## 正文\n\n恢复后的文章正文。" : "## Content\n\nRecovered article body.",
    category: "验证", tags: ["验证"], coverImage: "", published: true,
    published_at: date, created_at: date, updated_at: date
  };
  const tool = {
    id: "error-check-tool", name: locale === "zh" ? "恢复后的工具" : "Recovered tool",
    description: locale === "zh" ? "重新加载后显示的工具说明。" : "Tool description after retry.",
    url: "https://example.invalid/error-check", demoUrl: "",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23eeeeee'/%3E%3C/svg%3E",
    category: "验证", tags: ["验证"], featured: false, created_at: date, updated_at: date
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  });
  const originalFetch = window.fetch.bind(window);
  const pageContent = {
    zh: "## 恢复后的页面正文\n\n已加载站点实际保存的正文。",
    en: "## Recovered page content\n\nThe site's saved content has loaded."
  };
  if (params.get("checkCached") === "true") {
    localStorage.setItem("htools_site_settings_cache", JSON.stringify({
      name: "HTools", subtitle: "本地恢复验证", iconUrl: "",
      aboutContent: { zh: "旧缓存正文", en: "Stale cached content" },
      privacyContent: { zh: "旧缓存正文", en: "Stale cached content" },
      termsContent: { zh: "旧缓存正文", en: "Stale cached content" }
    }));
    state.hold.site = true;
  }
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url ?? String(input), location.href);
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method !== "GET" || url.origin !== location.origin) {
      state.unexpected.push(`${method} ${url.href}`);
      if (method !== "GET") state.writes.push(url.href);
      throw new Error("回归禁止写入或外部请求");
    }
    if (!url.pathname.startsWith("/api/")) return originalFetch(input, init);
    const resource = url.pathname === "/api/articles/error-check-article" ? "detail"
      : url.pathname === "/api/tools" ? "tools" : url.pathname === "/api/articles" ? "articles"
        : url.pathname === "/api/site-settings" ? "site" : null;
    state.reads.push({ resource, path: url.pathname, query: url.search });
    if (resource) {
      const signal = init.signal ?? (input instanceof Request ? input.signal : null);
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (state.hold[resource]) await new Promise((done, reject) => {
        const release = () => {
          signal?.removeEventListener("abort", abort);
          done();
        };
        const abort = () => {
          state.pending[resource] = state.pending[resource].filter((entry) => entry !== release);
          reject(new DOMException("Aborted", "AbortError"));
        };
        state.pending[resource].push(release);
        signal?.addEventListener("abort", abort, { once: true });
      });
      const outcome = state.outcomes[resource];
      if (outcome === "network") throw new TypeError("Failed to fetch");
      if (outcome !== 200) return json({ error: outcome === 404 ? "Article not found." : "Service unavailable." }, outcome);
      if (resource === "detail") return json({ article });
      if (resource === "site") return json({
        settings: { name: "HTools", subtitle: "本地恢复验证", iconUrl: "", aboutContent: pageContent, privacyContent: pageContent, termsContent: pageContent },
        umami: { enabled: false, scriptUrl: "", websiteId: "" }
      });
      const rows = resource === "tools" ? { tools: [tool], featuredTotal: 0 } : { articles: [article] };
      return json({ ...rows, total: 1, categoryCounts: { "验证": 1 }, limit: 30, hasMore: false, nextCursor: null });
    }
    if (url.pathname === "/api/proxy-settings") return json({ settings: { enabled: false, baseUrl: "", mode: "prefix", scope: "all" } });
    if (url.pathname === "/api/categories") return json({
      categories: [{ category: "验证", total: 1, featured_total: 0 }],
      settings: { tools: ["验证"], articles: ["验证"], content: [], push: [] },
      icons: { tools: {}, articles: {}, content: {}, push: {} }
    });
    if (url.pathname === "/api/auth/config") return json({ passwordConfigured: true, turnstile: { enabled: false, siteKey: "" } });
    state.unexpected.push(url.pathname);
    return json({ error: "Unexpected API." }, 404);
  };
}

async function waitFor(expression) {
  for (let index = 0; index < 160; index++) {
    if (await evaluate(client, expression)) return;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`等待超时：${expression}`);
}

async function settle() {
  await evaluate(client, "new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))", { awaitPromise: true });
}

async function pointAt(selector) {
  await evaluate(client, `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})`);
  await settle();
  return evaluate(client, `(() => {
    const element=document.querySelector(${JSON.stringify(selector)});
    if(!element) throw new Error('找不到点击目标');
    const rect=element.getBoundingClientRect();
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    if(!element.contains(document.elementFromPoint(x,y))) throw new Error('点击目标被遮挡');
    return {x,y};
  })()`);
}

async function pointerClick(point, mobile) {
  if (mobile) {
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, radiusX: 1, radiusY: 1, force: 1 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await client.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  }
}

async function screenshot(name) {
  await settle();
  const shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(artifacts, `${name}.png`), Buffer.from(shot.data, "base64"));
  return `${name}.png`;
}

function errorSelector(kind, resource = kind) {
  return kind === "home" ? `#latest-${resource} .public-load-error` : "main .public-load-error";
}

async function snapshot(selector) {
  return evaluate(client, `(() => {
    const element=document.querySelector(${JSON.stringify(selector)});
    const button=element?.querySelector('button');
    const rect=button?.getBoundingClientRect();
    const counts=Object.fromEntries(['tools','articles','detail','site'].map(kind=>[kind,window.__publicLoadCheck.reads.filter(row=>row.resource===kind).length]));
    return {
      heading:element?.querySelector('h2')?.textContent.trim(),text:element?.innerText,
      button:button?{text:button.textContent.trim(),disabled:button.disabled,width:rect.width,height:rect.height}:null,
      busy:element?.getAttribute('aria-busy'),title:document.title,
      locale:window.__publicLoadCheck.locale,htmlLang:document.documentElement.lang,
      robots:document.querySelector('meta[name="robots"]')?.content,
      overflow:document.documentElement.scrollWidth>innerWidth+1,counts,
      pending:Object.fromEntries(Object.entries(window.__publicLoadCheck.pending).map(([kind,entries])=>[kind,entries.length])),
      writes:window.__publicLoadCheck.writes,unexpected:window.__publicLoadCheck.unexpected,
      mainText:document.querySelector('main')?.innerText
    };
  })()`);
}

function assertError(state, locale, failure) {
  assert.equal(state.heading, locale === "zh" ? "数据连接异常" : "Site data connection issue");
  assert.equal(state.button?.text, locale === "zh" ? "重试" : "Retry");
  assert.equal(state.button?.disabled, false);
  assert.equal(state.busy, "false");
  assert.equal(state.overflow, false);
  assert.doesNotMatch(state.text, /文章不存在|Article not found/);
  if (locale === "zh") assert.doesNotMatch(state.text, /Service unavailable|Failed to fetch|Request failed/);
  if (failure === "network") {
    assert.match(
      state.text,
      locale === "zh" ? /网络连接失败，请检查网络后重试/ : /Network connection failed\. Check your connection/
    );
    assert.doesNotMatch(state.text, /本地预览服务|local preview server/);
  }
}

async function retryResource(scenario, resource) {
  const selector = errorSelector(scenario.kind, resource);
  const buttonSelector = `${selector} button`;
  const initial = await snapshot(selector);
  assertError(initial, scenario.locale, scenario.failure);
  const otherResources = ["tools", "articles", "detail", "site"].filter((entry) => entry !== resource);
  const phases = [];
  // 一次失败后仍可重试；第二次恢复。暂停读取能检查连续点击和忙碌外框。
  for (const outcome of [scenario.failure, 200]) {
    const before = await snapshot(selector);
    const point = await pointAt(buttonSelector);
    await evaluate(client, `window.__publicLoadCheck.hold[${JSON.stringify(resource)}]=true`);
    await pointerClick(point, scenario.mobile);
    await waitFor(`window.__publicLoadCheck.pending[${JSON.stringify(resource)}].length===1`);
    for (let attempt = 0; attempt < 3; attempt++) await pointerClick(point, scenario.mobile);
    await settle();
    const busy = await snapshot(selector);
    assert.equal(busy.counts[resource], before.counts[resource] + 1, "连续点击只发送一次请求");
    assert.equal(busy.pending[resource], 1);
    assert.equal(busy.button?.disabled, true);
    assert.equal(busy.button?.text, before.button.text);
    assert.equal(busy.busy, "true");
    assert.equal(busy.button.width, before.button.width);
    assert.equal(busy.button.height, before.button.height);
    for (const other of otherResources) assert.equal(busy.counts[other], before.counts[other], "只重试当前资源");
    if (outcome !== 200) busy.image = await screenshot(`${scenario.name}-${resource}-retrying`);
    await evaluate(client, `window.__publicLoadCheck.release(${JSON.stringify(resource)},${JSON.stringify(outcome)})`);
    if (outcome === 200) {
      const successSelector = resource === "detail" ? ".article-detail-card h1"
        : resource === "site" ? "main .markdown-content"
        : scenario.kind === "home" ? resource === "tools" ? "#latest-tools .tool-card:not(.tool-card-skeleton)" : "#latest-articles .article-item:not(.article-item-skeleton)"
          : resource === "tools" ? ".tool-grid .tool-card:not(.tool-card-skeleton)" : ".article-page-list .article-item:not(.article-item-skeleton)";
      await waitFor(`!document.querySelector(${JSON.stringify(selector)})&&Boolean(document.querySelector(${JSON.stringify(successSelector)}))`);
      if (resource === "detail") await waitFor("Boolean(document.querySelector('.article-detail-card .markdown-content'))");
      await settle();
      const recovered = await snapshot(selector);
      assert.equal(recovered.counts[resource], before.counts[resource] + 1);
      assert.match(recovered.mainText, resource === "tools" ? /恢复后的工具|Recovered tool/
        : resource === "site" ? /恢复后的页面正文|Recovered page content/ : /恢复后的文章|Recovered article/);
      if (resource === "site") assert.doesNotMatch(recovered.mainText, /旧缓存正文|Stale cached content/);
      if (resource === "detail") {
        assert.match(recovered.title, /恢复后的文章|Recovered article/);
        assert.doesNotMatch(recovered.title, /文章不存在|Article not found|数据连接异常|Site data connection issue/);
        assert.match(recovered.mainText, /恢复后的文章正文|Recovered article body/);
      }
      await pointAt(successSelector);
      const image = await screenshot(`${scenario.name}-${resource}-recovered`);
      phases.push({ outcome, busy, recovered, image });
    } else {
      await waitFor(`document.querySelector(${JSON.stringify(buttonSelector)})?.disabled===false`);
      const failedAgain = await snapshot(selector);
      assertError(failedAgain, scenario.locale, scenario.failure);
      assert.equal(failedAgain.counts[resource], before.counts[resource] + 1);
      phases.push({ outcome, busy, failedAgain });
    }
  }
  return { resource, initial, phases };
}

const scenarios = [
  ...[404, 503, "network"].flatMap((failure) => [
    { kind: "detail", path: "/articles/error-check-article", failure, width: 1366, height: 768, locale: failure === "network" ? "en" : "zh" },
    { kind: "detail", path: "/articles/error-check-article", failure, width: 419, height: 790, locale: failure === "network" ? "zh" : "en" }
  ]),
  ...["tools", "articles", "home"].flatMap((kind) => [
    { kind, path: kind === "home" ? "/" : `/${kind}`, failure: 503, width: 1366, height: 768, locale: kind === "articles" ? "en" : "zh" },
    { kind, path: kind === "home" ? "/" : `/${kind}`, failure: 503, width: 419, height: 790, locale: kind === "articles" ? "zh" : "en" }
  ]),
  ...["about", "privacy", "terms"].flatMap((page, index) => [
    { kind: "site", path: `/${page}`, failure: 503, width: 1366, height: 768, locale: index === 1 ? "en" : "zh" },
    { kind: "site", path: `/${page}`, failure: "network", width: 419, height: 790, locale: index === 1 ? "zh" : "en" }
  ]),
  { kind: "site", path: "/about", failure: 503, width: 1366, height: 768, locale: "zh", cached: true },
  { kind: "site", path: "/privacy", failure: "network", width: 419, height: 790, locale: "en", cached: true }
].map((scenario) => ({ ...scenario, mobile: scenario.width < 921, name: `${scenario.width}-${scenario.locale}-${scenario.kind === "site" ? scenario.path.slice(1) : scenario.kind}-${scenario.failure}${scenario.cached ? "-cached" : ""}` }));

try {
  await mkdir(runtime, { recursive: true });
  await mkdir(artifacts, { recursive: true });
  browser = await launchEdge(join(runtime, "profile"));
  ({ client } = await openPage(browser));
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  client.on("Runtime.exceptionThrown", (event) => report.errors.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text));
  client.on("Fetch.requestPaused", (event) => {
    const url = new URL(event.request.url);
    if (url.origin === origin && /^\/assets\/.*\.(?:js|css)$/.test(url.pathname) && !report.assets.includes(url.pathname)) report.assets.push(url.pathname);
    const blocked = url.origin !== origin || event.request.method !== "GET" || url.pathname.startsWith("/api/");
    if (blocked) report.blocked.push(`${event.request.method} ${event.request.url}`);
    void client.send(blocked ? "Fetch.failRequest" : "Fetch.continueRequest", blocked
      ? { requestId: event.requestId, errorReason: "BlockedByClient" }
      : { requestId: event.requestId }).catch(() => {});
  });
  await client.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await client.send("Page.addScriptToEvaluateOnNewDocument", { source: `(${installResponses.toString()})()` });
  console.log(`[通过] 前台失败恢复回归已启动：${scenarios.length} 个内存场景，复用单个临时 Edge`);
  for (const scenario of scenarios) {
    report.current = scenario.name;
    await client.send("Emulation.setDeviceMetricsOverride", { width: scenario.width, height: scenario.height, mobile: scenario.mobile, deviceScaleFactor: 1 });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: scenario.mobile, maxTouchPoints: 1 });
    await navigate(client, `${origin}${scenario.path}?checkKind=${scenario.kind}&checkFailure=${scenario.failure}&checkLocale=${scenario.locale}&checkCached=${Boolean(scenario.cached)}`);
    if (scenario.cached) {
      await waitFor("window.__publicLoadCheck?.pending.site.length===1&&Boolean(document.querySelector('main'))");
      assert.equal(await evaluate(client, "Boolean(document.querySelector('main .markdown-content'))"), false, "未确认的缓存正文不得冒充加载成功");
      await evaluate(client, `window.__publicLoadCheck.release('site',${JSON.stringify(scenario.failure)})`);
    }
    await waitFor(`window.__publicLoadCheck?.kind===${JSON.stringify(scenario.kind)}&&window.__publicLoadCheck?.locale===${JSON.stringify(scenario.locale)}&&Boolean(document.querySelector('main .empty-state h2'))`);
    const result = { ...scenario, resources: [], screenshots: [] };
    if (scenario.failure === 404) {
      await waitFor("!document.querySelector('.article-body-skeleton')");
      const state = await snapshot("main .empty-state");
      assert.equal(state.heading, scenario.locale === "zh" ? "文章不存在" : "Article not found");
      assert.equal(state.button, null);
      assert.equal(state.counts.detail, 1);
      assert.equal(state.overflow, false);
      assert.match(state.title, scenario.locale === "zh" ? /文章不存在/ : /Article not found/);
      assert.match(state.robots, /noindex/);
      result.state = state;
      result.screenshots.push(await screenshot(`${scenario.name}-not-found`));
      const back = await evaluate(client, "document.querySelector('main .empty-state a')?.getAttribute('href')");
      assert.equal(back, "/articles");
      await pointerClick(await pointAt("main .empty-state a"), scenario.mobile);
      await waitFor("location.pathname==='/articles'&&Boolean(document.querySelector('.article-page-list .article-item:not(.article-item-skeleton)'))");
      result.backLinkWorked = true;
    } else {
      for (const resource of scenario.kind === "home" ? ["tools", "articles"] : [scenario.kind]) {
        const selector = errorSelector(scenario.kind, resource);
        await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
        await pointAt(`${selector} button`);
        result.screenshots.push(await screenshot(`${scenario.name}-${resource}-failed`));
        const initial = await snapshot(selector);
        assertError(initial, scenario.locale, scenario.failure);
        if (resource === "detail") {
          assert.doesNotMatch(initial.title, /文章不存在|Article not found/);
          assert.match(initial.robots, /noindex/);
        }
        result.resources.push(await retryResource(scenario, resource));
      }
    }
    const finalState = await snapshot("main .public-load-error");
    assert.deepEqual(finalState.writes, []);
    assert.deepEqual(finalState.unexpected, []);
    assert.equal(finalState.overflow, false);
    result.finalState = finalState;
    report.results.push(result);
    console.log(`[通过] ${scenario.name}：${scenario.failure === 404 ? "不存在及返回入口" : "错误提示、再次失败、连续点击一请求、重试恢复"}`);
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.blocked, []);
  report.status = "passed";
} catch (error) {
  report.error = error.stack;
  process.exitCode = 1;
  console.error(error.stack);
  if (client) {
    try { report.failureScreenshot = await screenshot(`${report.current}-failure`); } catch {}
  }
} finally {
  client?.close();
  await closeBrowser(browser);
  await safeRemove(runtimeRoot, runtime);
  await mkdir(artifacts, { recursive: true });
  report.finishedAt = new Date().toISOString();
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ status: report.status, scenarios: report.results.length, report: join(artifacts, "report.json") }));
}
