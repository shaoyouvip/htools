import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const adminSource = await readFile(
  new URL("../../src/AdminApp.tsx", import.meta.url),
  "utf8"
);
const adminApiSource = await readFile(
  new URL("../../src/admin-api.ts", import.meta.url),
  "utf8"
);
const githubSettingsSource = await readFile(
  new URL("../../src/components/admin-settings/GitHubSettingsForm.tsx", import.meta.url),
  "utf8"
);
const adminDisplaySource = await readFile(
  new URL("../../src/admin-display.ts", import.meta.url),
  "utf8"
);
const githubHookSource = await readFile(
  new URL("../../src/useAdminGitHubMetadata.ts", import.meta.url),
  "utf8"
);
const toolCardSource = await readFile(
  new URL("../../src/components/admin-cards/AdminToolCard.tsx", import.meta.url),
  "utf8"
);
const articleCardSource = await readFile(
  new URL("../../src/components/admin-cards/AdminArticleCard.tsx", import.meta.url),
  "utf8"
);
const umamiCardSource = await readFile(
  new URL("../../src/components/admin-settings/UmamiSettingsCard.tsx", import.meta.url),
  "utf8"
);
const turnstileCardSource = await readFile(
  new URL("../../src/components/admin-settings/TurnstileSettingsCard.tsx", import.meta.url),
  "utf8"
);

function getFunctionSource(name, nextName) {
  const start = adminSource.indexOf(`async function ${name}`);
  const end = adminSource.indexOf(`async function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `${name} should exist`);
  return adminSource.slice(start, end < 0 ? undefined : end);
}

test("admin list refreshes accept only their latest response", () => {
  for (const [functionName, generationRef, nextName] of [
    ["refresh", "adminToolsRequestGenerationRef", "refreshArticles"],
    ["refreshArticles", "adminArticlesRequestGenerationRef", "loadMoreAdminArticles"],
    ["refreshContent", "contentItemsRequestGenerationRef", "loadMoreContentItems"]
  ]) {
    const source = getFunctionSource(functionName, nextName);
    assert.match(source, new RegExp(`${generationRef}\\.current \\+ 1`));
    assert.match(source, new RegExp(`${generationRef}\\.current !== generation`));
  }
});

test("category refreshes ignore stale responses and errors", () => {
  const source = getFunctionSource("refreshAdminCategories", "rememberAdminCategory");
  assert.match(source, /adminCategoryLoadRequestRef\.current \+ 1/);
  assert.match(source, /adminCategoryLoadRequestRef\.current !== requestId/);
  assert.match(source, /adminCategoryLoadRequestRef\.current === requestId/);
});

test("only the latest mutation refresh may restore the scroll position", () => {
  const source = getFunctionSource("refreshAfterMutation", "refresh");
  assert.match(source, /mutationRefreshGenerationRef\.current \+ 1/);
  assert.match(source, /try \{[\s\S]*await refreshAction\(\{ reportError: false \}\)[\s\S]*catch \{/);
  assert.match(source, /categoryText\.refreshFailedHint/);
  assert.match(source, /mutationRefreshGenerationRef\.current !== generation/);
  assert.match(
    source,
    /requestAnimationFrame\([\s\S]*mutationRefreshGenerationRef\.current === generation[\s\S]*scrollTo/
  );
});

test("a failed initial content sync does not report a successful source save as failed", () => {
  const source = getFunctionSource("handleSaveContentSource", "handleSyncContentSource");
  assert.match(
    source,
    /const savedSource =[\s\S]*setContentSources\(\(current\) => \[[\s\S]*savedSource[\s\S]*requestContentSourceEditorClose\(\)[\s\S]*try \{[\s\S]*syncContentSource\(savedSource\.id, token\)[\s\S]*catch \(error\)[\s\S]*contentText\.savedSyncFailed\(syncError\)/
  );
});

test("content source preview cancels and ignores stale requests", () => {
  const source = getFunctionSource("handlePreviewContentSource", "handleSaveContentSource");
  assert.match(source, /contentPreviewRequestRef\.current \+ 1/);
  assert.match(source, /contentPreviewAbortRef\.current\?\.abort\(\)/);
  assert.match(source, /previewContentSource\(payload, token, \{[\s\S]*signal: controller\.signal/);
  assert.match(source, /contentPreviewRequestRef\.current !== requestId/);
  assert.match(source, /current\.title\.trim\(\)[\s\S]*title: preview\.title/);
  assert.match(source, /contentPreviewAppliedTitleRef\.current = preview\.title/);
  assert.match(
    adminApiSource,
    /previewContentSource\([\s\S]*options: \{ signal\?: AbortSignal \}[\s\S]*signal: options\.signal/
  );
});

test("changing the feed URL or closing the editor invalidates its preview", () => {
  assert.match(
    adminSource,
    /function closeContentSourceEditor\(\) \{[\s\S]*?invalidateContentPreview\(\)/
  );
  assert.match(
    adminSource,
    /value=\{contentSourceForm\.url\}[\s\S]*?onChange=\{\(event\) => \{[\s\S]*?invalidateContentPreview\(\)[\s\S]*?onBlur=\{\(\) => \{[\s\S]*?invalidateContentPreview\(\)/
  );
  assert.match(
    adminSource,
    /shouldClearPreviewTitle[\s\S]*contentPreviewAppliedTitleRef\.current[\s\S]*\{ title: "" \}/
  );
});

test("saving a tool keeps its loaded GitHub details on screen", () => {
  const source = getFunctionSource("handleSave", "handleDelete");

  // Resetting here blanked the GitHub detail card mid-save, and on a failed save the
  // admin was left with an empty card and had to read the repository again.
  assert.doesNotMatch(source, /toolGitHub\.reset\(\)/);
  // Closing the editor is what clears it, through the dialog's onClose handler.
  assert.match(adminSource, /function closeToolEditor\(\)[\s\S]{0,120}toolGitHub\.reset\(\)/);
  assert.match(adminSource, /onClose=\{\(\) => \{[\s\S]{0,80}closeToolEditor\(\)/);
});

test("GitHub metadata keeps edits made while the request is pending", () => {
  assert.match(githubHookSource, /const requestSnapshot = getSnapshotRef\.current\(\)/);
  assert.match(
    githubHookSource,
    /onMetadataRef\.current\([\s\S]*lastAppliedRef\.current\?\.metadata \?\? null,[\s\S]*overwrite,[\s\S]*requestSnapshot/
  );
  assert.match(
    adminDisplaySource,
    /currentValue === snapshotValue \? metadataValue : currentValue/
  );
  for (const field of ["name", "description", "demoUrl", "image"]) {
    assert.match(
      adminDisplaySource,
      new RegExp(`applyIfUnchanged\\([\\s\\S]*current\\.${field}[\\s\\S]*snapshot\\.${field}`)
    );
  }
});

test("changing a GitHub URL invalidates stale metadata responses and notices", () => {
  const toolUrlFieldStart = adminSource.indexOf('id="admin-tool-url"');
  const toolUrlFieldEnd = adminSource.indexOf("<AdminUrlField", toolUrlFieldStart + 1);
  assert.notEqual(toolUrlFieldStart, -1, "tool URL field should exist");
  const toolUrlFieldSource = adminSource.slice(
    toolUrlFieldStart,
    toolUrlFieldEnd < 0 ? undefined : toolUrlFieldEnd
  );
  assert.match(toolUrlFieldSource, /value=\{form\.url\}/);
  assert.match(toolUrlFieldSource, /if \(nextUrl !== form\.url\) toolGitHub\.reset\(nextUrl\)/);
  assert.match(
    toolUrlFieldSource,
    /setForm\(\(current\) => \(\{ \.\.\.current, url: nextUrl \}\)\)/
  );
  assert.match(
    githubHookSource,
    /requestIdRef\.current \+= 1[\s\S]*setMetadata\(null\)[\s\S]*catch \(error\) \{[\s\S]*requestIdRef\.current === requestId/
  );
});

test("GitHub metadata request deduplication separates refresh mode and login token", () => {
  assert.match(
    adminApiSource,
    /const requestMode = options\.forceRefresh \? "force" : "cached"/
  );
  assert.match(
    adminApiSource,
    /const requestKey = `\$\{token\}\\u0000\$\{requestMode\}\\u0000\$\{url\.trim\(\)\.toLowerCase\(\)\}`/
  );
  assert.match(
    adminApiSource,
    /pendingGitHubMetadataRequests\.get\(requestKey\)[\s\S]*pendingGitHubMetadataRequests\.set\(requestKey, request\)/
  );
});

test("card-level featured and publish toggles require confirmation before mutation", () => {
  assert.match(
    adminSource,
    /const \[pendingFeaturedTool, setPendingFeaturedTool\] = useState<Tool \| null>\(null\)/
  );
  assert.match(
    adminSource,
    /const \[pendingPublishedArticle, setPendingPublishedArticle\][\s\S]*useState<ArticleSummary \| null>\(null\)/
  );
  assert.match(
    adminSource,
    /onToggleFeatured=\{\(\) => requestToggleFeatured\(tool\)\}/
  );
  assert.match(
    adminSource,
    /onTogglePublished=\{\(\) => requestToggleArticlePublished\(article\)\}/
  );
  assert.match(adminSource, /toggle-featured-dialog-description/);
  assert.match(adminSource, /toggle-published-dialog-description/);
  assert.equal(
    (adminSource.match(/confirmLabel=\{t\.actions\.confirm\}/g) ?? []).length,
    10
  );
  assert.doesNotMatch(adminSource, /deleteContinue/);
  assert.match(
    adminSource,
    /setPendingFeaturedTool\(null\);\s*void handleToggleFeatured\(tool\)/
  );
  assert.match(
    adminSource,
    /setPendingPublishedArticle\(null\);\s*void handleToggleArticlePublished\(article\)/
  );
});

test("conflicting admin mutations share one lock per entity", () => {
  assert.match(
    adminSource,
    /function getAdminWriteEntityKey\([\s\S]*return `\$\{scope\}:\$\{id \|\| "new"\}`/
  );

  for (const key of [
    'getAdminWriteEntityKey("tool", editingTool?.id)',
    'getAdminWriteEntityKey("tool", tool.id)',
    'getAdminWriteEntityKey("article", editingArticle?.id)',
    'getAdminWriteEntityKey("article", article.id)',
    'getAdminWriteEntityKey("content-source", editingContentSource?.id)',
    'getAdminWriteEntityKey("content-source", source.id)',
    'getAdminWriteEntityKey("content-item", item.id)'
  ]) {
    assert.ok(adminSource.includes(key), `${key} should be used`);
  }

  assert.doesNotMatch(
    adminSource,
    /`(?:tool|article|content-source|content-item):(?:save|delete|sync|featured|published|convert):/
  );
});

test("article detail loading participates in entity locks", () => {
  const articleSource = getFunctionSource("openEditArticle", "handleSave");
  assert.match(articleSource, /acquireWriteAction\(actionKey\)/);
  assert.match(articleSource, /finally \{[\s\S]*releaseWriteAction\(actionKey\)/);
});

test("entity locks drive every conflicting card action disabled state", () => {
  assert.match(
    adminSource,
    /const \[writeLockedEntityKeys, setWriteLockedEntityKeys\] = useState<Set<string>>/
  );
  assert.match(
    adminSource,
    /function acquireWriteAction\([\s\S]*setWriteLockedEntityKeys\([\s\S]*next\.add\(key\)/
  );
  assert.match(
    adminSource,
    /function releaseWriteAction\([\s\S]*setWriteLockedEntityKeys\([\s\S]*next\.delete\(key\)/
  );

  for (const staleName of [
    "featuredUpdatingIds",
    "articlePublishUpdatingIds",
    "syncingSourceIds",
    "convertingItemIds",
    "setItemActionPending"
  ]) {
    assert.doesNotMatch(adminSource, new RegExp(staleName));
  }

  assert.match(
    toolCardSource,
    /export function AdminToolCard\([\s\S]*disabled=\{isBusy\}/
  );
  assert.match(
    articleCardSource,
    /export function AdminArticleCard\([\s\S]*disabled=\{isBusy\}/
  );
  assert.match(
    adminSource,
    /function AdminContentFlowPanel\([\s\S]*disabled=\{writeLockedEntityKeys\.has\(getAdminWriteEntityKey\("content-source", selectedSource\.id\)\)\}/
  );
  assert.match(
    adminSource,
    /function ContentItemCard\([\s\S]*disabled=\{isBusy\}/
  );
});

test("system service save and toggle requests are serialized per service", () => {
  const githubSource = githubSettingsSource;

  assert.match(githubSource, /const writeInProgressRef = useRef\(false\)/);
  assert.match(
    githubSource,
    /async function handleSave[\s\S]*if \(writeInProgressRef\.current\) return[\s\S]*writeInProgressRef\.current = true[\s\S]*finally \{[\s\S]*writeInProgressRef\.current = false/
  );
  assert.match(
    githubSource,
    /async function toggleEnabled[\s\S]*if \(!settings \|\| writeInProgressRef\.current\) return[\s\S]*writeInProgressRef\.current = true[\s\S]*finally \{[\s\S]*writeInProgressRef\.current = false/
  );

  assert.match(adminSource, /if \(proxySavingRef\.current\) \{[\s\S]*proxySavingRef\.current = true/);
  assert.match(umamiCardSource, /if \(savingRef\.current\) return[\s\S]*savingRef\.current = true/);
  assert.match(
    turnstileCardSource,
    /if \(writeInProgressRef\.current\) return[\s\S]*writeInProgressRef\.current = true[\s\S]*finally \{[\s\S]*writeInProgressRef\.current = false/
  );
  assert.match(adminSource, /acquireSettingsWriteLock\(`source`\)/);
});

test("article editor accepts only the latest detail request", () => {
  const source = getFunctionSource("openEditArticle", "handleSave");
  assert.match(source, /articleEditorLoadRequestRef\.current \+ 1/);
  assert.match(source, /articleEditorLoadRequestRef\.current !== requestId/);
  assert.match(source, /articleEditorLoadRequestRef\.current === requestId/);
  assert.doesNotMatch(source, /if \(loadingArticleEditorRef\.current\) return/);
  assert.match(adminSource, /function openCreateArticle\(\) \{[\s\S]*?articleEditorLoadRequestRef\.current \+= 1/);
});

function extractFunctions(source, names, fileName = "AdminApp.tsx") {
  const found = new Map();
  const tree = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) {
      found.set(node.name.text, node.getText(tree).replace(/^export\s+/, ""));
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return names.map((name) => {
    assert.ok(found.has(name), `缺少真实函数 ${name}`);
    return found.get(name);
  }).join("\n");
}

const listFunctionNames = [
  "refresh", "refreshArticles", "refreshContent", "refreshTelegramPushRecords",
  "loadMoreContentItems", "refreshAfterMutation", "combineAdminRefreshResults",
  "handleDelete", "handleDeleteArticle", "handleDeleteContentSource", "handleDeleteTelegramPush"
];
const listFunctions = extractFunctions(adminSource, listFunctionNames);
const listProgram = ts.transpileModule(listFunctions, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;

function pendingResult() {
  let resolve;
  let reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

const contentPage = (total = 7, items = [{ id: "current-item" }]) => ({
  items, hasMore: true, nextCursor: `cursor-${total}`, total,
  sourceCounts: { source: total }, categoryCounts: { news: total }
});

// 只替换请求、React 状态容器和浏览器宿主；执行上面从产品源码提取的真实函数。
function createListRuntime() {
  const scope = {
    token: "test-token", tools: [{ id: "deleted" }], adminArticles: [{ id: "deleted" }],
    contentItems: [{ id: "deleted" }], contentSources: [{ id: "deleted" }],
    contentLoadError: null, contentSourcesLoadError: null,
    contentSourceFilter: "all", contentItemsHasMore: false, isDeletingTelegramPush: false,
    telegramPushRecords: [{ id: "deleted" }], viewingTelegramPush: null,
    t: { status: { toolDeleted: "已删除", deleteFailed: "删除失败" } },
    articleText: { deleted: "已删除" }, contentText: { deleted: "已删除" },
    telegramText: { management: { deleted: "已删除" } },
    categoryText: { refreshFailedHint: "读取失败，请重新加载" },
    getLocalizedErrorMessage: (error) => error.message,
    getAdminWriteEntityKey: (kind, id) => `${kind}:${id}`,
    acquireWriteAction: () => true, releaseWriteAction: () => {},
    getAdminArticleRequestParams: () => ({}), getTelegramPushRequestParams: () => ({}),
    getContentItemRequestParams: (cursor) => ({ cursor }),
    window: { requestAnimationFrame: (callback) => callback() }
  };
  for (const [, name] of listFunctions.matchAll(/\b(set[A-Z]\w*)\(/g)) {
    const key = name[3].toLowerCase() + name.slice(4);
    scope[name] = (value) => { scope[key] = typeof value === "function" ? value(scope[key]) : value; };
  }
  for (const [name] of listFunctions.matchAll(/\b\w+Ref\b/g)) scope[name] ??= { current: 0 };
  scope.adminContentScrollRef.current = null;
  scope.contentSourcesLoadedRef.current = true;
  const responses = {
    loadAdminTools: [],
    loadAdminArticles: { articles: [], hasMore: false, nextCursor: null, total: 0, categoryCounts: {} },
    loadContentSources: [], loadContentItems: contentPage(),
    loadTelegramPushRecords: { records: [], categoryOptions: [], hasMore: false, nextCursor: null }
  };
  const queues = new Map();
  const reads = [];
  const writes = [];
  for (const name of Object.keys(responses)) {
    scope[name] = async (...args) => {
      reads.push({ name, args });
      const next = queues.get(name)?.shift();
      if (next instanceof Error) throw next;
      return next ?? responses[name];
    };
  }
  for (const name of ["deleteTool", "deleteArticle", "deleteContentSource", "deleteTelegramPush"]) {
    scope[name] = async (...args) => { writes.push({ name, args }); };
  }
  const actions = new Function("scope", `with (scope) { ${listProgram}; return { ${listFunctionNames.join(",")} }; }`)(scope);
  return {
    scope, actions, reads, writes, responses,
    enqueue(name, result) {
      if (!queues.has(name)) queues.set(name, []);
      queues.get(name).push(result);
    }
  };
}

function readListError(scope, key) {
  return key === "contentLoadError"
    ? scope.contentLoadError ?? scope.contentSourcesLoadError
    : scope[key];
}

const listCases = [
  ["工具", "handleDelete", "refresh", "loadAdminTools", "toolsLoadError", "isLoadingTools"],
  ["文章", "handleDeleteArticle", "refreshArticles", "loadAdminArticles", "articlesLoadError", "isLoadingArticles"],
  ["推送", "handleDeleteTelegramPush", "refreshTelegramPushRecords", "loadTelegramPushRecords", "telegramPushLoadError", "isLoadingTelegramPushes"],
  ["订阅内容", "handleDeleteContentSource", "refreshContent", "loadContentItems", "contentLoadError", "isLoadingContent"],
  ["订阅源", "handleDeleteContentSource", "refreshContent", "loadContentSources", "contentLoadError", "isLoadingContent"]
];

for (const [label, remove, refresh, request, errorKey, loadingKey] of listCases) {
  test(`${label}删除成功后只读重试保留错误，成功或再次失败均不重复删除`, async () => {
    const runtime = createListRuntime();
    runtime.enqueue(request, new Error("第一次读取失败"));
    assert.equal(await runtime.actions[remove]({ id: "deleted", resourceType: "custom", resourceId: "source" }), true);
    assert.equal(runtime.writes.length, 1);
    assert.equal(readListError(runtime.scope, errorKey), "第一次读取失败");

    const retry = pendingResult();
    runtime.enqueue(request, retry.promise);
    const pending = runtime.actions[refresh]();
    assert.equal(runtime.scope[loadingKey], true);
    assert.equal(readListError(runtime.scope, errorKey), "第一次读取失败");
    assert.equal(runtime.writes.length, 1);
    retry.reject(new Error("再次读取失败"));
    assert.equal(await pending, "failed");
    assert.equal(readListError(runtime.scope, errorKey), "再次读取失败");
    assert.equal(runtime.scope[loadingKey], false);

    const success = pendingResult();
    runtime.enqueue(request, success.promise);
    const pendingSuccess = runtime.actions[refresh]();
    assert.equal(readListError(runtime.scope, errorKey), "再次读取失败");
    success.resolve(runtime.responses[request]);
    assert.equal(await pendingSuccess, "success");
    assert.equal(readListError(runtime.scope, errorKey), null);
    assert.equal(runtime.scope[loadingKey], false);
    assert.equal(runtime.writes.length, 1);
  });

  test(`${label}过期成功和失败都不能覆盖新一轮结果`, async () => {
    for (const oldSucceeds of [true, false]) {
      const runtime = createListRuntime();
      const old = pendingResult();
      const current = pendingResult();
      runtime.enqueue(request, old.promise);
      runtime.enqueue(request, current.promise);
      const oldRequest = runtime.actions[refresh]();
      const currentRequest = runtime.actions[refresh]();
      if (oldSucceeds) current.reject(new Error("当前读取失败"));
      else current.resolve(runtime.responses[request]);
      assert.equal(await currentRequest, oldSucceeds ? "failed" : "success");
      const currentError = readListError(runtime.scope, errorKey);
      if (oldSucceeds) old.resolve(runtime.responses[request]);
      else old.reject(new Error("过期读取失败"));
      assert.equal(await oldRequest, "superseded");
      assert.equal(readListError(runtime.scope, errorKey), currentError);
      if (request === "loadContentSources") {
        assert.equal(runtime.scope.contentSourcesLoadError, currentError);
      }
      assert.equal(runtime.scope[loadingKey], false);
    }
  });
}

for (const currentItemsFirst of [true, false]) {
  test(`分类操作后仅刷新内容时保留仍有效的订阅源错误：${currentItemsFirst ? "内容先完成" : "订阅源先完成"}`, async () => {
    const runtime = createListRuntime();
    const source = pendingResult();
    const oldItems = pendingResult();
    const currentItems = pendingResult();
    runtime.enqueue("loadContentSources", source.promise);
    runtime.enqueue("loadContentItems", oldItems.promise);
    runtime.enqueue("loadContentItems", currentItems.promise);

    const mutationRefresh = runtime.actions.refreshAfterMutation(runtime.actions.refreshContent, "分类已删除");
    const filterRefresh = runtime.actions.refreshContent({ reloadSources: false });
    assert.equal(runtime.reads.filter(({ name }) => name === "loadContentSources").length, 1);

    if (currentItemsFirst) {
      currentItems.resolve(contentPage(0, []));
      await filterRefresh;
    }
    source.reject(new Error("订阅源读取失败"));
    oldItems.resolve(contentPage(0, []));
    assert.equal(await mutationRefresh, "failed");
    if (!currentItemsFirst) {
      currentItems.resolve(contentPage(0, []));
      await filterRefresh;
    }

    assert.equal(readListError(runtime.scope, "contentLoadError"), "订阅源读取失败");
    assert.equal(runtime.scope.contentSourcesLoadError, "订阅源读取失败");
    assert.equal(runtime.scope.isLoadingContent, false);
    assert.equal(runtime.writes.length, 0);
  });
}

test("订阅源和内容分别重试时只清除各自已恢复的错误", async () => {
  const runtime = createListRuntime();
  runtime.scope.contentLoadError = "内容旧错误";
  runtime.scope.contentSourcesLoadError = "订阅源旧错误";
  runtime.enqueue("loadContentItems", new Error("内容仍失败"));
  assert.equal(await runtime.actions.refreshContent(), "failed");
  assert.equal(runtime.scope.contentSourcesLoadError, null);
  assert.equal(readListError(runtime.scope, "contentLoadError"), "内容仍失败");

  runtime.enqueue("loadContentSources", new Error("订阅源仍失败"));
  assert.equal(await runtime.actions.refreshContent(), "failed");
  assert.equal(runtime.scope.contentLoadError, null);
  assert.equal(readListError(runtime.scope, "contentLoadError"), "订阅源仍失败");

  assert.equal(await runtime.actions.refreshContent(), "success");
  assert.equal(readListError(runtime.scope, "contentLoadError"), null);
  assert.equal(runtime.writes.length, 0);
});

test("订阅追加的空统计保留首屏值，刷新替换统计且过期追加不污染新结果", async () => {
  const runtime = createListRuntime();
  await runtime.actions.refreshContent();
  const initialCounts = [runtime.scope.contentItemsTotal, runtime.scope.contentSourceCounts, runtime.scope.contentCategoryCounts];
  runtime.enqueue("loadContentItems", { ...contentPage(), items: [{ id: "appended" }], total: null, sourceCounts: null, categoryCounts: null });
  await runtime.actions.loadMoreContentItems();
  assert.deepEqual([runtime.scope.contentItemsTotal, runtime.scope.contentSourceCounts, runtime.scope.contentCategoryCounts], initialCounts);
  assert.deepEqual(runtime.scope.contentItems.map(({ id }) => id), ["current-item", "appended"]);
  assert.equal(runtime.reads.filter(({ name }) => name === "loadContentItems").at(-1).args[1].includeCounts, false);

  const stale = pendingResult();
  runtime.enqueue("loadContentItems", stale.promise);
  const oldAppend = runtime.actions.loadMoreContentItems();
  runtime.enqueue("loadContentItems", contentPage(9, [{ id: "fresh" }]));
  await runtime.actions.refreshContent();
  stale.resolve(contentPage(99, [{ id: "stale" }]));
  await oldAppend;
  assert.equal(runtime.scope.contentItemsTotal, 9);
  assert.deepEqual(runtime.scope.contentSourceCounts, { source: 9 });
  assert.deepEqual(runtime.scope.contentCategoryCounts, { news: 9 });
  assert.deepEqual(runtime.scope.contentItems, [{ id: "fresh" }]);
  assert.notEqual(runtime.reads.filter(({ name }) => name === "loadContentItems").at(-1).args[1].includeCounts, false);
});

test("公共错误组件重试期间保留错误文本并禁用重试按钮", async () => {
  const panelSource = await readFile(new URL("../../src/components/AdminPanelStates.tsx", import.meta.url), "utf8");
  const program = ts.transpileModule(extractFunctions(panelSource, ["AdminInitialLoadError"], "AdminPanelStates.tsx"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React }
  }).outputText;
  const Component = new Function("React", "RefreshCw", `${program}; return AdminInitialLoadError;`)(React, () => null);
  for (const isRetrying of [undefined, false, true]) {
    const tree = Component({ message: "读取失败", onRetry: () => {}, isRetrying });
    const button = React.Children.toArray(tree.props.children).find((child) => child.type === "button");
    assert.equal(button.props.disabled, isRetrying === true);
    assert.equal(tree.props["aria-busy"], isRetrying === true);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /读取失败/);
    assert.equal(/<button[^>]*disabled/.test(html), isRetrying === true);
  }
});

test("四类列表面板将各自读取状态传入公共错误组件", async () => {
  assert.match(adminSource, /loadError=\{contentLoadError\s*\?\?\s*contentSourcesLoadError\}/);
  const pushSource = await readFile(new URL("../../src/components/AdminTelegramPush.tsx", import.meta.url), "utf8");
  const calls = [...`${adminSource}\n${pushSource}`.matchAll(/<AdminInitialLoadError\b[\s\S]*?\/>/g)]
    .map(([call]) => call);
  assert.equal(calls.length, 4);
  for (const loading of ["isLoadingTools", "isLoadingArticles", "isLoadingContent", "isLoading"]) {
    assert.equal(calls.filter((call) => call.includes(`isRetrying={${loading}}`)).length, 1);
  }
});

test("推送面板在空列表重试时仍显示公共错误态，首次无错误加载才显示骨架", async () => {
  const source = await readFile(new URL("../../src/components/AdminTelegramPush.tsx", import.meta.url), "utf8");
  const program = ts.transpileModule(extractFunctions(source, ["AdminTelegramPushPanel"], "AdminTelegramPush.tsx"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React }
  }).outputText;
  const ErrorView = ({ message }) => React.createElement("section", { role: "alert" }, message);
  const Skeleton = ({ children }) => React.createElement("section", { "data-skeleton": true }, children);
  const Panel = new Function("React", "AdminInitialLoadError", "SkeletonVisibility", "AdminResourceCardSkeletonGrid",
    `${program}; return AdminTelegramPushPanel;`)(React, ErrorView, Skeleton, () => null);
  const props = {
    records: [], isLoading: true, loadError: "读取失败", showSkeletons: true,
    serviceEnabled: true, settingsLoading: false, text: { title: "消息推送" }, onRetry: () => {}
  };
  for (const records of [[], [{ id: "existing" }]]) {
    for (const isLoading of [false, true]) {
      const tree = Panel({ ...props, records, isLoading });
      const content = React.Children.toArray(tree.props.children)[0];
      assert.equal(content.type, ErrorView, `记录数 ${records.length}、读取中 ${isLoading} 时应保留错误态`);
      assert.equal(content.props.isRetrying, isLoading);
      const html = renderToStaticMarkup(tree);
      assert.match(html, /role="alert"/);
      assert.doesNotMatch(html, /data-skeleton/);
    }
  }
  const initial = Panel({ ...props, loadError: null });
  assert.equal(React.Children.toArray(initial.props.children)[0].type, Skeleton);
  assert.match(renderToStaticMarkup(initial), /data-skeleton/);
});

function createCategoryIconRuntime() {
  const names = ["refreshAdminCategories", "editCategoryIcon", "submitCategoryIcon"];
  const functions = extractFunctions(adminSource, names);
  const program = ts.transpileModule(functions, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText;
  const scope = {
    token: "本地测试凭据",
    editingCategoryIcon: { scope: "tools", category: "开发" },
    isApplyingCategoryAction: false,
    adminCategoryIconsReady: true,
    adminCategoryIcons: { tools: {}, articles: {}, push: {}, content: {} },
    categoryIconSaveRef: { current: false }, categoryIconGenerationRef: { current: 0 },
    adminCategoryLoadRequestRef: { current: 0 },
    adminCategorySaveGenerationRef: { current: { tools: 0, articles: 0, push: 0, content: 0 } },
    t: { categoryIcons: { saved: "已保存", saveFailed: "保存失败" } },
    categoryText: { loadFailed: "加载失败" },
    getLocalizedErrorMessage: (error) => error.message,
    isEditableCategoryIconCategory: () => true,
    document: { activeElement: null },
    getDialogReturnFocusTarget: () => null,
    rememberNextDialogReturnFocus: () => {},
    commitAdminCategorySettings(value) { this.settings = value; }
  };
  for (const [, name] of functions.matchAll(/\b(set[A-Z]\w*)\(/g)) {
    const key = name[3].toLowerCase() + name.slice(4);
    scope[name] = (value) => { scope[key] = value; };
  }
  const actions = new Function("scope", `with (scope) { ${program}; return { ${names.join(",")} }; }`)(scope);
  return { scope, actions };
}

test("分类图标保存防止连点，旧分类读取不能覆盖已保存的新图标", async () => {
  const { scope, actions } = createCategoryIconRuntime();
  const reading = pendingResult();
  scope.loadAdminCategoryConfiguration = () => reading.promise;
  const refresh = actions.refreshAdminCategories();
  const saving = pendingResult();
  const requests = [];
  scope.saveAdminCategoryIcon = (...args) => { requests.push(args); return saving.promise; };
  const icon = { type: "lucide", value: "folder" };
  const save = actions.submitCategoryIcon(icon);
  await actions.submitCategoryIcon(icon);
  assert.equal(requests.length, 1);
  assert.equal(scope.categoryIconSaving, true);
  const current = { ...scope.adminCategoryIcons, tools: { 开发: icon } };
  saving.resolve(current);
  await save;
  reading.resolve({ settings: {}, icons: { tools: {}, articles: {}, push: {}, content: {} } });
  await refresh;
  assert.deepEqual(scope.adminCategoryIcons, current);
  assert.equal(scope.categoryIconSaving, false);
  assert.equal(scope.editingCategoryIcon, null);
});

test("分类图标保存失败保持编辑目标和原图标并释放保存锁", async () => {
  const { scope, actions } = createCategoryIconRuntime();
  scope.saveAdminCategoryIcon = async () => { throw new Error("本地模拟失败"); };
  const original = scope.adminCategoryIcons;
  await actions.submitCategoryIcon({ type: "lucide", value: "folder" });
  assert.equal(scope.adminCategoryIcons, original);
  assert.deepEqual(scope.editingCategoryIcon, { scope: "tools", category: "开发" });
  assert.equal(scope.categoryIconError, "本地模拟失败");
  assert.equal(scope.categoryIconSaving, false);
  assert.equal(scope.categoryIconSaveRef.current, false);
});

test("分类迁移进行期间不能打开图标编辑器", async () => {
  const { scope, actions } = createCategoryIconRuntime();
  scope.editingCategoryIcon = null;
  scope.isApplyingCategoryAction = true;
  await actions.editCategoryIcon("tools", "开发");
  assert.equal(scope.editingCategoryIcon, null);
});

test("凭据更换清除图标保存状态并忽略旧保存响应", async () => {
  const { scope, actions } = createCategoryIconRuntime();
  const tree = ts.createSourceFile("AdminApp.tsx", adminSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "useEffect" &&
        node.arguments[1]?.getText(tree) === "[token]" &&
        node.arguments[0]?.getText(tree).includes("categoryIconGenerationRef.current += 1") &&
        node.arguments[0]?.getText(tree).includes("return () =>")) {
      callback = node.arguments[0].getText(tree);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(callback);
  const effect = new Function("scope", `with (scope) { return (${callback}); }`)(scope);
  const cleanup = effect();
  scope.editingCategoryIcon = { scope: "tools", category: "开发" };
  const pending = pendingResult();
  scope.saveAdminCategoryIcon = () => pending.promise;
  const save = actions.submitCategoryIcon({ type: "lucide", value: "folder" });
  assert.equal(scope.categoryIconSaving, true);
  cleanup();
  effect();
  const original = scope.adminCategoryIcons;
  pending.resolve({ tools: { 开发: { type: "lucide", value: "folder" } }, articles: {}, push: {}, content: {} });
  await save;
  assert.equal(scope.categoryIconSaving, false);
  assert.equal(scope.categoryIconSaveRef.current, false);
  assert.equal(scope.editingCategoryIcon, null);
  assert.equal(scope.adminCategoryIcons, original);
});
