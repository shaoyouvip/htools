import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const hookUrl = moduleUrl(`
  let runtime;
  export const setRuntime = (value) => { runtime = value; };
  export const useState = (value) => runtime.useState(value);
  export const useRef = (value) => runtime.useRef(value);
  export const useEffect = (effect, dependencies) => runtime.useEffect(effect, dependencies);
`);
const apiUrl = moduleUrl(`
  let api;
  export const setApi = (value) => { api = value; };
  export const loadGitHubSettings = (...args) => api.load(...args);
  export const loadImageBedSettings = (...args) => api.load(...args);
  export const loadRssHubSettings = (...args) => api.load(...args);
  export const loadTurnstileSettings = (...args) => api.load(...args);
  export const loadUmamiSettings = (...args) => api.load(...args);
  export const loadAdminSecuritySettings = (...args) => api.load(...args);
  export const saveGitHubSettings = (...args) => api.save(...args);
  export const saveImageBedSettings = (...args) => api.save(...args);
  export const saveRssHubSettings = (...args) => api.save(...args);
  export const saveTurnstileSettings = (...args) => api.save(...args);
  export const saveUmamiSettings = (...args) => api.save(...args);
  export const updateAdminPassword = (...args) => api.save(...args);
  export const saveTelegramSettings = (...args) => api.save(...args);
  export const testTelegramSettings = (...args) => api.test(...args);
`);
const { setRuntime } = await import(hookUrl);
const { setApi } = await import(apiUrl);
const panelSource = await readFile(new URL("../../src/components/AdminPanelStates.tsx", import.meta.url), "utf8");
const panelModule = moduleUrl(ts.transpileModule(panelSource, {
  fileName: "AdminPanelStates.tsx",
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
}).outputText
  .replaceAll('from "react/jsx-runtime"', `from "${import.meta.resolve("react/jsx-runtime")}"`)
  .replaceAll('from "lucide-react"', `from "${import.meta.resolve("lucide-react")}"`)
  .replaceAll('from "../article-helpers"', `from "${moduleUrl("export const isChineseLocaleText = () => true;")}"`));
const replacements = {
  react: hookUrl,
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "../../admin-api": apiUrl,
  "../../site-helpers": moduleUrl("export const getLocalizedErrorMessage = (error, t) => t.testLocale ? `${t.testLocale}:${error.message}` : error.message;"),
  "../../admin-helpers": moduleUrl("export const formatAdminDate = (value) => value;"),
  "../../umami": moduleUrl(`
    export const hasCompleteUmamiSettings = (value) => Boolean(value.scriptUrl && value.websiteId);
    export const normalizeUmamiScriptUrl = (value) => value.trim();
    export const normalizeUmamiWebsiteId = (value) => value.trim();
  `),
  "../AdminPanelStates": panelModule,
  "../../shared-ui": moduleUrl("export function SkeletonVisibility() {}"),
  "../../useLoadingSkeleton": moduleUrl("export const useLoadingSkeleton = (loading) => loading;"),
  "../../../shared/rsshub": moduleUrl("export const normalizeRssHubBaseUrl = (value) => value.trim();"),
  "../admin-skeletons": moduleUrl(`
    export function AdminSkeletonLines() {}
    export function getAdminLoadingProps(loading) {
      return loading ? { "aria-busy": true, inert: true, "data-admin-loading": "true" } : {};
    }
  `),
  "./SettingsStatusBadge": moduleUrl("export function SettingsStatusBadge() {}")
};

async function loadComponent(name) {
  const source = await readFile(new URL(`../../src/components/admin-settings/${name}.tsx`, import.meta.url), "utf8");
  let code = ts.transpileModule(source, {
    fileName: `${name}.tsx`,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) {
    code = code.replaceAll(`from "${specifier}"`, `from "${replacement}"`);
  }
  return (await import(moduleUrl(code)))[name];
}

// 执行真实组件的状态与事件回调；仅替换 React 挂载环境及网络请求。
function mount(Component, api, initialProps = {}) {
  const hooks = [];
  let index = 0;
  let dirty = false;
  let effects = [];
  let tree;
  const dirtyReports = [];
  let props = {
    maintenanceText: {}, t: { githubSettings: {}, actions: {} }, token: "local-test-token", reloadKey: 0,
    onDirtyChange(value) { dirtyReports.push(value); }, onStatus() {}, setStatus() {},
    onSettingsChange() {}, onLoadingChange() {}, onTokenChange() {},
    ...initialProps
  };
  const runtime = {
    useState(initial) {
      const slot = index++;
      hooks[slot] ??= { value: typeof initial === "function" ? initial() : initial };
      return [hooks[slot].value, (next) => {
        const value = typeof next === "function" ? next(hooks[slot].value) : next;
        if (!Object.is(value, hooks[slot].value)) dirty = true;
        hooks[slot].value = value;
      }];
    },
    useRef(initial) {
      const slot = index++;
      return hooks[slot] ??= { current: initial };
    },
    useEffect(effect, dependencies) {
      const slot = index++;
      const previous = hooks[slot];
      if (!previous || dependencies.some((value, item) => !Object.is(value, previous.dependencies[item]))) {
        hooks[slot] = { dependencies, cleanup: previous?.cleanup };
        effects.push(() => {
          hooks[slot].cleanup?.();
          hooks[slot].cleanup = effect();
        });
      }
    }
  };
  function render(nextProps = {}) {
    props = { ...props, ...nextProps };
    index = 0;
    dirty = false;
    effects = [];
    setRuntime(runtime);
    setApi(api);
    tree = Component(props);
    for (const effect of effects) effect();
  }
  render();
  return {
    render,
    get dirty() { return dirtyReports.at(-1); },
    dirtyReports,
    async flush() {
      for (let iteration = 0; iteration < 12; iteration += 1) {
        await Promise.resolve();
        if (dirty) render();
      }
    },
    find(predicate) {
      function walk(value) {
        if (Array.isArray(value)) return value.flatMap(walk);
        if (!value || typeof value !== "object") return [];
        if (value.type?.name === "AdminSettingsLoadError") return walk(value.type(value.props));
        return [...(predicate(value) ? [value] : []), ...walk(value.props?.children)];
      }
      return walk(tree);
    },
    unmount() { for (const hook of hooks) hook.cleanup?.(); }
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const cards = [
  { name: "GitHubSettingsForm", initial: { enabled: true, owner: "old-owner", repo: "old-repo", labels: [] }, restored: { enabled: false, owner: "new-owner", repo: "new-repo", labels: ["restored"] }, value: "new-owner" },
  { name: "ImageBedSettingsCard", initial: { available: true, enabled: true, baseUrl: "https://old.example/", uploadChannel: "telegram", channelName: "", uploadNameType: "default", uploadFolder: "old" }, restored: { available: true, enabled: false, baseUrl: "https://new.example/", uploadChannel: "s3", channelName: "new", uploadNameType: "origin", uploadFolder: "new" }, value: "https://new.example/" },
  { name: "RssHubSettingsCard", initial: { enabled: true, baseUrl: "https://old.example/" }, restored: { enabled: false, baseUrl: "https://new.example/" }, value: "https://new.example/" }
];

for (const card of cards) {
  const Component = await loadComponent(card.name);
  card.Component = Component;
  test(`${card.name} 加载期间保留真实表单结构并限制交互，完成后解除加载态`, async () => {
    const pending = deferred();
    const mounted = mount(Component, { load: () => pending.promise });
    try {
      const controls = mounted.find((node) => ["input", "select"].includes(node.type));
      assert.ok(controls.length > 0, "真实字段应在加载期间参与布局");
      const loadingRoot = mounted.find((node) => node.props?.["aria-busy"] === true);
      assert.equal(loadingRoot.length, 1);
      assert.equal(loadingRoot[0].props.inert, true);
      assert.equal(mounted.find((node) => node.type?.name === "AdminSkeletonLines")[0].props.loading, true);

      pending.resolve(card.restored);
      await mounted.flush();
      assert.equal(mounted.find((node) => node.props?.["aria-busy"] === true).length, 0);
      assert.deepEqual(
        mounted.find((node) => ["input", "select"].includes(node.type)).map((node) => node.type),
        controls.map((node) => node.type)
      );
      assert.equal(mounted.find((node) => node.type?.name === "AdminSkeletonLines")[0].props.loading, false);
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, card.value);
    } finally { mounted.unmount(); }
  });

  test(`${card.name} 在备份恢复刷新后同步新配置并替换旧草稿`, async () => {
    let saved = card.initial;
    let reads = 0;
    const mounted = mount(Component, { load: async () => { reads += 1; return saved; } });
    try {
      await mounted.flush();
      mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "unsaved-draft" } });
      await mounted.flush();
      saved = card.restored;
      mounted.render({ reloadKey: 1 });
      await mounted.flush();
      assert.equal(reads, 2);
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, card.value);
      assert.equal(mounted.find((node) => node.type?.name === "SettingsStatusBadge")[0].props.enabled, false);
    } finally { mounted.unmount(); }
  });

  test(`${card.name} 忽略恢复前尚未完成的加载响应`, async () => {
    const pending = [];
    const mounted = mount(Component, { load: (_token, options) => {
      const request = { ...deferred(), signal: options.signal };
      pending.push(request);
      return request.promise;
    } });
    try {
      mounted.render({ reloadKey: 1 });
      await mounted.flush();
      assert.equal(pending.length, 2);
      assert.equal(pending[0].signal.aborted, true);
      pending[1].resolve(card.restored);
      await mounted.flush();
      pending[0].resolve(card.initial);
      await mounted.flush();
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, card.value);
    } finally { mounted.unmount(); }
  });

  test(`${card.name} 恢复后的配置不会被更早的手动重试响应覆盖`, async () => {
    const pending = [];
    const mounted = mount(Component, { load: () => {
      const request = deferred();
      pending.push(request);
      return request.promise;
    } });
    try {
      pending[0].reject(new Error("本地模拟读取失败"));
      await mounted.flush();
      mounted.find((node) => node.type === "button")[0].props.onClick();
      await mounted.flush();
      mounted.render({ reloadKey: 1 });
      await mounted.flush();
      assert.equal(pending.length, 3);
      pending[2].resolve(card.restored);
      await mounted.flush();
      pending[1].resolve(card.initial);
      await mounted.flush();
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, card.value);
    } finally { mounted.unmount(); }
  });
}

test("GitHub 切换语言保留草稿，备份恢复读取失败后重试仍以恢复值替换旧草稿", async () => {
  const card = cards[0];
  let current = card.initial;
  let fail = false;
  const mounted = mount(card.Component, { load: async () => {
    if (fail) throw new Error("本地模拟读取失败");
    return current;
  } });
  try {
    await mounted.flush();
    mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "unsaved-owner" } });
    await mounted.flush();
    mounted.render({ t: { githubSettings: {}, actions: {} } });
    await mounted.flush();
    assert.equal(mounted.find((node) => node.type === "input")[0].props.value, "unsaved-owner");
    current = card.restored;
    fail = true;
    mounted.render({ reloadKey: 1 });
    await mounted.flush();
    fail = false;
    mounted.find((node) => node.type === "button")[0].props.onClick();
    await mounted.flush();
    assert.equal(mounted.find((node) => node.type === "input")[0].props.value, card.value);
  } finally { mounted.unmount(); }
});

for (const card of [
  ...cards,
  { name: "TurnstileSettingsCard", restored: { available: false, enabled: false, siteKey: "" } },
  { name: "UmamiSettingsCard", restored: { enabled: false, scriptUrl: "", websiteId: "" } },
  { name: "SecuritySettingsCard", restored: { passwordConfigured: true, source: "database", updatedAt: "" } }
]) {
  const Component = card.Component ?? await loadComponent(card.name);
  test(`${card.name} 重试期间切换语言不重复读取，旧请求失败按当前语言展示`, async () => {
    const pending = [];
    const mounted = mount(Component, { load: () => {
      const request = deferred();
      pending.push(request);
      return request.promise;
    } }, { t: { githubSettings: {}, actions: {}, testLocale: "zh" } });
    const errorPanel = () => mounted.find((node) => node.props?.className === "settings-card-error")[0];
    const retryButton = () => mounted.find((node) => node.type === "button")[0];
    try {
      pending[0].reject(new Error("initial-error"));
      await mounted.flush();
      assert.equal(mounted.find((node) => node.type === "p")[0].props.children, "zh:initial-error");
      retryButton().props.onClick();
      await mounted.flush();
      assert.equal(retryButton().props.disabled, true);
      mounted.render({ t: { githubSettings: {}, actions: {}, testLocale: "en" } });
      await mounted.flush();
      assert.equal(pending.length, 2, "切换语言不应取消或重复设置读取");
      assert.equal(errorPanel().props["aria-busy"], true);
      assert.equal(retryButton().props.disabled, true);
      assert.equal(mounted.find((node) => node.type === "p")[0].props.children, "en:initial-error");

      pending[1].reject(new Error("retry-error"));
      await mounted.flush();
      assert.equal(retryButton().props.disabled, false);
      assert.equal(mounted.find((node) => node.type === "p")[0].props.children, "en:retry-error");
      retryButton().props.onClick();
      await mounted.flush();
      pending[2].resolve(card.restored);
      await mounted.flush();
      assert.equal(errorPanel(), undefined, "再次读取成功应恢复实际设置内容");
    } finally { mounted.unmount(); }
  });
}

for (const fail of [false, true]) {
  test(`图床开关${fail ? "失败" : "成功"}时保留未保存的地址和目录`, async () => {
    const card = cards[1];
    let written;
    const mounted = mount(card.Component, {
      load: async () => card.initial,
      save: async (next) => {
        written = next;
        if (fail) throw new Error("本地模拟保存失败");
        return { ...next, available: true };
      }
    });
    try {
      await mounted.flush();
      mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "https://draft.example/" } });
      await mounted.flush();
      mounted.find((node) => node.type === "input").at(-1).props.onChange({ target: { value: "draft-folder" } });
      await mounted.flush();
      mounted.find((node) => node.type?.name === "SettingsStatusBadge")[0].props.onChange();
      await mounted.flush();
      assert.equal(written.baseUrl, card.initial.baseUrl);
      assert.equal(written.uploadFolder, card.initial.uploadFolder);
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, "https://draft.example/");
      assert.equal(mounted.find((node) => node.type === "input").at(-1).props.value, "draft-folder");
    } finally { mounted.unmount(); }
  });
}

test("恢复备份刷新标记传到三个服务卡片", async () => {
  const source = await readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8");
  for (const { name } of cards) {
    assert.ok(new RegExp(`<${name}\\b[^>]*reloadKey=\\{settingsReloadKey\\}`).test(source), `${name} 应接收恢复后的刷新标记`);
  }
});

for (const card of cards.filter(({ name }) => name !== "GitHubSettingsForm")) {
  test(`${card.name} 上报未保存草稿，保存失败保留，成功和卸载后清除`, async () => {
    let fail = true;
    const mounted = mount(card.Component, {
      load: async () => card.initial,
      save: async (next) => {
        if (fail) throw new Error("本地模拟保存失败");
        return { ...card.initial, ...next };
      }
    });
    try {
      await mounted.flush();
      assert.equal(mounted.dirty, false, "初始配置不应被当成草稿");
      mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "https://draft.example/" } });
      await mounted.flush();
      assert.equal(mounted.dirty, true, "编辑应上报给恢复备份提醒");
      await mounted.find((node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
      await mounted.flush();
      assert.equal(mounted.dirty, true, "保存失败不能清除提醒");
      assert.equal(mounted.find((node) => node.type === "input")[0].props.value, "https://draft.example/");
      fail = false;
      await mounted.find((node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
      await mounted.flush();
      assert.equal(mounted.dirty, false, "保存成功应清除提醒");
      mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "https://another-draft.example/" } });
      await mounted.flush();
      assert.equal(mounted.dirty, true);
    } finally {
      mounted.unmount();
    }
    assert.equal(mounted.dirty, false, "卸载后不应残留旧草稿标记");
  });
}

test("Telegram 上报目标和页脚草稿，保存失败保留，成功和卸载后清除", async () => {
  const Component = await loadComponent("TelegramSettingsCard");
  const initial = { available: true, enabled: true, target: "@old_target", footerMarkdown: "old footer" };
  let fail = true;
  const mounted = mount(Component, {
    save: async (next) => {
      if (fail) throw new Error("本地模拟保存失败");
      return { ...next, available: true };
    }
  }, {
    locale: "zh", settings: initial, settingsError: null, loading: false,
    onReload: async () => {},
    onSettingsChange: (settings) => mounted.render({ settings })
  });
  try {
    await mounted.flush();
    assert.equal(mounted.dirty, false);
    assert.ok(!mounted.dirtyReports.includes(true), "初始化已保存配置不应短暂报告未保存");
    mounted.find((node) => node.type === "input")[0].props.onChange({ target: { value: "@draft_target" } });
    await mounted.flush();
    assert.equal(mounted.dirty, true);
    await mounted.find((node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
    await mounted.flush();
    assert.equal(mounted.dirty, true);
    assert.equal(mounted.find((node) => node.type === "input")[0].props.value, "@draft_target");
    fail = false;
    await mounted.find((node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
    await mounted.flush();
    assert.equal(mounted.dirty, false);
    mounted.find((node) => node.type === "input")[1].props.onChange({ target: { value: "draft footer" } });
    await mounted.flush();
    assert.equal(mounted.dirty, true, "只改页脚也要提醒");
    mounted.find((node) => node.type?.name === "SettingsStatusBadge")[0].props.onChange(false);
    await mounted.flush();
    assert.equal(mounted.dirty, true, "关闭服务不应清除页脚草稿提醒");
    assert.equal(mounted.find((node) => node.type === "input")[1].props.value, "draft footer");
  } finally {
    mounted.unmount();
  }
  assert.equal(mounted.dirty, false);
});

test("服务卡草稿统一接入恢复备份提醒，不增加离开设置页拦截", async () => {
  const source = await readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8");
  const unsaved = source.match(/const hasUnsavedSettings =([\s\S]*?);/)?.[1];
  assert.ok(unsaved);
  for (const [name, state, callback] of [
    ["ImageBedSettingsCard", "imageBedSettingsDirty", "setImageBedSettingsDirty"],
    ["RssHubSettingsCard", "rssHubSettingsDirty", "setRssHubSettingsDirty"],
    ["TelegramSettingsCard", "telegramSettingsDirty", "setTelegramSettingsDirty"]
  ]) {
    assert.ok(new RegExp(`<${name}\\b[^>]*onDirtyChange=\\{${callback}\\}`).test(source), `${name} 应上报草稿`);
    assert.ok(unsaved.includes(state), `${name} 的草稿应纳入提醒判断`);
  }
  assert.match(source, /function requestBackupRestore\(\) \{\s*if \(hasUnsavedSettings\)/);
  assert.equal((source.match(/\bhasUnsavedSettings\b/g) ?? []).length, 2, "未保存判断只由备份恢复调用");
});
