import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = (await readFile(new URL("../../src/styles.css", import.meta.url), "utf8"))
  .replace(/\r\n?/g, "\n");
const adminSource = (await readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const dialogComponentSource = (
  await readFile(new URL("../../src/components/AdminDialog.tsx", import.meta.url), "utf8")
).replace(/\r\n?/g, "\n");
const telegramPushSource = (
  await readFile(new URL("../../src/components/AdminTelegramPush.tsx", import.meta.url), "utf8")
).replace(/\r\n?/g, "\n");
const panelStatesSource = (
  await readFile(new URL("../../src/components/AdminPanelStates.tsx", import.meta.url), "utf8")
).replace(/\r\n?/g, "\n");
const articleCardSource = (
  await readFile(new URL("../../src/components/admin-cards/AdminArticleCard.tsx", import.meta.url), "utf8")
).replace(/\r\n?/g, "\n");
const appSource = (await readFile(new URL("../../src/App.tsx", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const submitSource = (await readFile(new URL("../../src/SubmitPage.tsx", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const sharedSource = (await readFile(new URL("../../src/shared-ui.tsx", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const fieldAssistButtonSource = (
  await readFile(new URL("../../src/components/AdminFieldAssistButton.tsx", import.meta.url), "utf8")
).replace(/\r\n?/g, "\n");
const fieldAssistConsumers = await Promise.all([
  "../../src/components/AdminAiAction.tsx",
  "../../src/components/AdminAiDocumentImport.tsx",
  "../../src/components/AdminGitHubMetadata.tsx",
  "../../src/components/AdminImageUploadButton.tsx"
].map(async (path) => (
  await readFile(new URL(path, import.meta.url), "utf8")
).replace(/\r\n?/g, "\n")));
const aiActionSource = fieldAssistConsumers[0];

function ruleFor(selector) {
  const start = styles.indexOf(selector);
  assert.notEqual(start, -1, `Missing CSS rule for ${selector}`);
  const open = styles.indexOf("{", start);
  const close = styles.indexOf("}", open);
  return styles.slice(open + 1, close);
}

const CSS_RULES = (() => {
  const parsed = [];
  let depth = 0;
  let selStart = 0;
  let buf = "";
  let sel = "";
  let line = 0;
  for (let index = 0; index < styles.length; index += 1) {
    const ch = styles[index];
    if (ch === "{") {
      if (depth === 0) {
        sel = styles.slice(selStart, index).trim();
        line = styles.slice(0, index).split("\n").length;
      }
      depth += 1;
      if (depth === 1) buf = "";
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        parsed.push({ sel, body: buf, line });
        selStart = index + 1;
      }
      continue;
    }
    if (depth === 1) buf += ch;
  }
  return parsed;
})();

function readDeclaration(body, property) {
  const pattern = new RegExp(`(?:^|[;{\\s])${property}\\s*:\\s*([^;]+);`, "g");
  let match;
  let value = null;
  while ((match = pattern.exec(body))) value = match[1].trim();
  return value;
}

function specificity(selector) {
  const cleaned = selector.replace(/::[a-z-]+/g, "");
  return [
    (cleaned.match(/#[\w-]+/g) ?? []).length,
    (cleaned.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\()[a-z-]+(\([^)]*\))?/g) ?? []).length,
    (cleaned.match(/(^|[\s>+~])[a-z]+/g) ?? []).length
  ];
}

function compareSpecificity(a, b) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function selectorMatches(selector, ownClasses, ancestorClasses) {
  const parts = selector.trim().split(/\s+/).filter((part) => part && part !== ">");
  if (!parts.length) return false;
  const ownRequirement = (parts.at(-1).match(/\.[\w-]+/g) ?? []).map((c) => c.slice(1));
  if (!ownRequirement.length) return false;
  if (!ownRequirement.every((c) => ownClasses.includes(c))) return false;
  const available = [...ownClasses, ...ancestorClasses];
  return parts.slice(0, -1).every((part) =>
    (part.match(/\.[\w-]+/g) ?? []).every((c) => available.includes(c.slice(1)))
  );
}

/**
 * Resolve which declaration wins for an element, mirroring the cascade:
 * specificity first, then source order. `includeHover` adds :hover rules so a
 * later page-level base rule that silently overrides the shared hover shows up.
 */
function resolveDeclaration(ownClasses, ancestorClasses, property, includeHover) {
  let winner = null;
  for (const rule of CSS_RULES) {
    if (rule.sel.startsWith("@")) continue;
    if (readDeclaration(rule.body, property) === null) continue;
    for (const selector of rule.sel.split(",").map((part) => part.trim())) {
      if (/is-touch|:disabled|skeleton|:active|::|:focus/.test(selector)) continue;
      const isHover = /:hover/.test(selector);
      if (!includeHover && isHover) continue;
      const bare = selector.replace(/:[a-z-]+(\([^)]*\))?/g, "");
      if (!selectorMatches(bare, ownClasses, ancestorClasses)) continue;
      const rank = specificity(selector);
      if (
        !winner ||
        compareSpecificity(rank, winner.rank) > 0 ||
        (compareSpecificity(rank, winner.rank) === 0 && rule.line >= winner.line)
      ) {
        winner = { selector, rank, value: readDeclaration(rule.body, property), line: rule.line };
      }
    }
  }
  return winner;
}

test("bordered controls keep their surface and only strengthen the border", () => {
  const borderedRules = [
    ".ghost-button:hover:not(:disabled),",
    ".home-topbar .search-trigger:hover,",
    ".admin-search-field:hover,",
    ".tool-editor-top-actions .tool-editor-action-button:hover,"
  ];

  for (const selector of borderedRules) {
    const rule = ruleFor(selector);
    assert.match(rule, /border-color:\s*var\(--faint\)/);
    assert.match(rule, /background(?:-color)?:\s*var\(--surface\)/);
    assert.doesNotMatch(rule, /admin-borderless-hover-bg/);
  }
});

test("link-check actions reuse the shared bordered button behavior", () => {
  assert.equal(
    (adminSource.match(/className="ghost-button link-check-open-link"/g) ?? [])
      .length,
    2
  );
  assert.doesNotMatch(styles, /\.link-check-open-link:hover/);
  assert.match(
    ruleFor(".admin-workspace .link-check-open-link {"),
    /font-size:\s*14px;[\s\S]*?font-weight:\s*500;[\s\S]*?line-height:\s*1;/
  );
});

test("every icon button surface actually resolves to the shared gray hover", () => {
  const surfaces = [
    ["featured toggle", ["icon-button", "admin-featured-badge"], ["admin-tool-card-actions", "admin-tool-card"]],
    ["publish toggle", ["icon-button", "admin-article-publish-button"], ["admin-tool-card-actions", "admin-article-card"]],
    ["telegram push", ["icon-button", "admin-telegram-button"], ["admin-tool-card-actions", "admin-tool-card"]],
    ["card menu trigger", ["icon-button", "admin-tool-menu-trigger"], ["admin-tool-card-actions", "admin-tool-card"]],
    ["editor dialog close", ["icon-button"], ["dialog-header", "dialog-panel", "tool-editor-dialog"]],
    ["sidebar utility", ["icon-button"], ["admin-sidebar-utility", "admin-workspace"]],
    ["collapsed sidebar", ["icon-button"], ["admin-sidebar-utility", "admin-workspace", "is-sidebar-collapsed"]],
    ["public topbar", ["icon-button"], ["home-topbar"]],
    ["auth card", ["icon-button"], ["auth-card-actions"]],
    ["mobile nav", ["icon-button"], ["mobile-nav-utility"]]
  ];

  for (const [label, ownClasses, ancestorClasses] of surfaces) {
    const base = resolveDeclaration(ownClasses, ancestorClasses, "background", false);
    const hovered = resolveDeclaration(ownClasses, ancestorClasses, "background", true);

    assert.equal(
      base?.value,
      "transparent",
      `${label} should stay transparent when idle, got ${base?.value} from ${base?.selector}`
    );
    assert.match(
      hovered?.value ?? "",
      /admin-borderless-hover-bg/,
      `${label} hover is overridden by ${hovered?.selector} (line ${hovered?.line})`
    );
  }
});

test("borderless icon and menu controls retain the shared gray hover feedback", () => {
  const selectors = [
    ".icon-button:hover,",
    ".menu-option:hover,",
    ".admin-sidebar-nav button:hover,",
    ".category-item:hover,",
    ".admin-tool-action-menu button:hover,"
  ];

  for (const selector of selectors) {
    const rule = ruleFor(selector);
    assert.match(rule, /border-color:\s*transparent/);
    assert.match(rule, /admin-borderless-hover-bg/);
  }

  assert.doesNotMatch(
    styles,
    /@media \(hover: none\) and \(pointer: coarse\) \{[\s\S]*?\.admin-workspace \.icon-button:hover[\s\S]*?background:\s*transparent;/
  );
});

test("tool card media fills its fixed 2:1 frame except for GitHub preview cards", () => {
  // 外框是硬 aspect-ratio: 2 / 1 且 overflow: hidden。底规则必须 cover，否则任意
  // 站点截图（16:9 / 4:3 / 竖图）会在左右留出 var(--surface) 的灰边。
  // v1.0.25 把这行误改成 contain 造成过一次线上留白，而当时整个 tests/ 和
  // browser-regression 都不断言 object-fit，所以静默溜过去了。这条就是那道缺失的闸门。
  assert.match(ruleFor("\n.tool-image-link {"), /aspect-ratio: 2 \/ 1;/);
  assert.match(ruleFor("\n.tool-image {"), /object-fit: cover;/);

  // GitHub 的 OpenGraph 卡是唯一例外：1200×630 且图面上有文字，cover 会把字裁掉，
  // 所以它单独用 contain + 白底。靠类名叠加拿到更高特异性 (0,2,0)，不依赖源码顺序。
  assert.match(
    ruleFor(".tool-image.is-github-preview {"),
    /object-fit: contain;/
  );

  // 这一对是配套的：普通截图 cover + 悬停微放大，GitHub 卡 contain + 不放大。
  // 底规则一旦被改成 contain，留白的图还会继续被放大，两者就散了。
  assert.match(
    styles,
    /\.tool-card:focus-within \.tool-image\.is-github-preview\.is-loaded \{[^}]*transform: none;/
  );
});

test("controls that zero their outline still give keyboard focus a visible ring", () => {
  // 分类下拉触发器的基础规则里写了 outline: 0，而它的悬停反馈来自容器
  // .admin-category-filter:hover。容器的 :focus-within 和 :hover 声明完全相同，
  // 所以键盘聚焦既没有自己的环、又和悬停长得一样，键盘用户分不出来。
  // 这条锁住"清掉了 UA 焦点环，就必须自己补一份"这个约定。
  assert.match(styles, /\.admin-category-filter-trigger \{[^}]*outline: 0;/);
  assert.match(
    styles,
    /\.admin-category-filter-trigger:focus-visible \{\s*outline: 2px solid var\(--text\);\s*outline-offset: -3px;\s*\}/
  );

  // 补的必须是描边而不是背景:容器已经有一层半透明灰底,
  // 内部按钮再加一层会明显变深,那是 CHANGELOG 明令禁止的两层叠加。
  const focusRule = styles.slice(
    styles.indexOf(".admin-category-filter-trigger:focus-visible {")
  );
  assert.doesNotMatch(focusRule.slice(0, focusRule.indexOf("}")), /background/);

  // 同一个模式还有两处:.category-item 和 .content-source-all 都把 :hover /
  // :focus-visible / .is-active 写成同一副样子并清掉 outline,已选中时键盘聚焦零变化。
  // 分类图标选择及模式切换也沿用同样的描边，允许多个选择器共用一条规则。
  for (const selector of [
    ".admin-category-filter-trigger",
    ".category-item",
    ".content-source-all",
    ".admin-category-icon-choice",
    ".admin-segmented-toggle.admin-category-icon-mode button"
  ]) {
    const rule = CSS_RULES.filter(({ sel }) => sel
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .some((part) => part.trim() === `${selector}:focus-visible`)
    ).at(-1);
    assert.ok(rule, `${selector} 缺少键盘焦点规则`);
    assert.equal(readDeclaration(rule.body, "outline"), "2px solid var(--text)",
      `${selector} 缺少统一的键盘焦点环`);
    assert.equal(readDeclaration(rule.body, "outline-offset"), "-3px");
    assert.doesNotMatch(
      rule.body,
      /background/,
      `${selector} 的焦点规则不该动背景,只用描边`
    );
  }
});

test("row-level highlights are scoped with :has() so inner buttons never bubble", () => {
  const rule = ruleFor(".admin-tool-link-row:has(> .admin-tool-link-text:hover),");

  assert.match(rule, /admin-borderless-hover-bg/);
  assert.doesNotMatch(styles, /\.admin-tool-link-row:hover\b/);
  assert.doesNotMatch(styles, /\.admin-tool-link-row:focus-within\b/);
  for (const selector of [
    ".content-source-group",
    ".content-source-item",
    ".content-item-card"
  ]) {
    assert.match(
      styles,
      new RegExp(`\\${selector}:has\\(> \\.[a-z-]+:hover\\)`)
    );
  }
});

test("button interaction rules stay global instead of being rewritten per surface", () => {
  assert.doesNotMatch(styles, /\.admin-workspace \.ghost-button:hover/);
  assert.doesNotMatch(styles, /\.admin-workspace \.icon-button:hover/);
  assert.doesNotMatch(styles, /\.tool-editor-dialog \.field-assist-button:hover/);
  assert.doesNotMatch(
    styles,
    /\.admin-workspace \.admin-sidebar-utility \.icon-button\s*\{[^}]*background:\s*transparent;/
  );
  assert.doesNotMatch(
    styles,
    /\.admin-sidebar-utility \.icon-button,[\s\S]*?background:\s*transparent;/
  );
  assert.doesNotMatch(
    styles,
    /\.auth-card-actions \.icon-button\s*\{[^}]*background:\s*transparent;/
  );
  assert.doesNotMatch(
    styles,
    /\.mobile-nav-utility \.icon-button\s*\{[^}]*background:\s*transparent;/
  );
  assert.match(
    ruleFor(".icon-button:hover,"),
    /border-color:\s*transparent;[\s\S]*?admin-borderless-hover-bg/
  );
  for (const selector of [
    "\\.admin-tool-card-actions \\.icon-button",
    "\\.admin-tool-card-actions \\.admin-featured-badge",
    "\\.admin-tool-card-actions \\.admin-article-publish-button",
    "\\.tool-editor-dialog \\.dialog-header \\.icon-button"
  ]) {
    assert.doesNotMatch(
      styles,
      new RegExp(`${selector}:(?:hover|focus-visible)[^{]*\\{[^}]*admin-borderless-hover-bg`)
    );
  }
  assert.doesNotMatch(
    styles,
    /\.telegram-push-view-link:(?:hover|focus-visible)/
  );
});

test("the admin identity card keeps only its logout icon interactive", () => {
  assert.match(adminSource, /<div className="admin-user-card">/);
  assert.match(
    adminSource,
    /<div className="admin-user-card">[\s\S]*?<button[\s\S]*?className="icon-button"[\s\S]*?onClick=\{handleLogout\}/
  );
  assert.doesNotMatch(
    `${adminSource}\n${appSource}`,
    /<span className="(?:icon-button|action-card-icon)" aria-hidden="true">/
  );
  const cardRule = ruleFor("\n.admin-user-card {");
  const collapsedCardRule = ruleFor(
    ".admin-workspace.is-sidebar-collapsed .admin-user-card {"
  );
  assert.match(cardRule, /border:\s*1px solid var\(--border\)/);
  assert.match(cardRule, /background:\s*var\(--surface\)/);
  assert.match(collapsedCardRule, /border:\s*0/);
  assert.match(collapsedCardRule, /background:\s*transparent/);
  assert.doesNotMatch(styles, /\.admin-user-card:hover/);
});

test("the mobile admin card keeps only its login icon interactive", () => {
  assert.match(appSource, /<div className="mobile-admin-card">/);
  assert.match(
    appSource,
    /<div className="mobile-admin-card">[\s\S]*?<a[\s\S]*?className="icon-button"[\s\S]*?href="\/admin"/
  );
  assert.doesNotMatch(appSource, /<a className="mobile-admin-card"/);
  assert.doesNotMatch(styles, /\.mobile-admin-card:hover|\.mobile-admin-card:focus-visible/);
});

test("field assistant buttons share the bordered gray hover contract", () => {
  for (const source of fieldAssistConsumers) {
    assert.match(source, /AdminFieldAssistButton/);
  }
  assert.match(fieldAssistButtonSource, /field-assist-button/);
  assert.match(fieldAssistButtonSource, /field-assist-button-mobile-label/);
  assert.match(fieldAssistButtonSource, /mobileLabel: string/);
  assert.match(
    adminSource,
    /<AdminImageUploadButton[\s\S]*?mobileLabel=\{locale === "zh" \? "上传" : "Upload"\}/
  );
  assert.match(
    adminSource,
    /<AdminGitHubMetadataButton[\s\S]*?mobileLabel=\{locale === "zh" \? "仓库" : "Repo"\}/
  );
  assert.match(
    adminSource,
    /<AdminFieldAssistButton[\s\S]*?mobileLabel=\{locale === "zh" \? "时间" : "Time"\}/
  );
  assert.match(
    adminSource,
    /<AdminAiDocumentImport[\s\S]*?mobileLabel=\{locale === "zh" \? "导入" : "Import"\}/
  );
  assert.match(
    adminSource,
    /field-assist-toggle[\s\S]*?mobileEnabledLabel=\{locale === "zh" \? "精选" : "Featured"\}/
  );
  assert.match(aiActionSource, /mobileLabel=\{mobileLabel\}/);
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.field-assist-button\.has-mobile-label \.field-assist-button-icon,[\s\S]*?display:\s*none;[\s\S]*?\.field-assist-button\.has-mobile-label \.field-assist-button-mobile-label \{[\s\S]*?display:\s*inline;/
  );
  assert.match(fieldAssistButtonSource, /aria-disabled=\{unavailable \|\| undefined\}/);
  assert.match(fieldAssistButtonSource, /if \(unavailable\) \{[\s\S]*?onUnavailable\?\.\(\)/);
  assert.doesNotMatch(fieldAssistButtonSource, /\sdisabled=\{[^}\n]*unavailable/);

  const baseRule = ruleFor(".field-assist-button {");
  const sharedActionRule = ruleFor(".tool-editor-dialog .tool-editor-action-button {");
  const hoverRule = ruleFor(
    ".field-assist-button:hover:not(:disabled),"
  );
  assert.match(baseRule, /border-color:\s*var\(--border\)/);
  assert.match(baseRule, /background:\s*var\(--surface\)/);
  assert.match(sharedActionRule, /border:\s*1px solid var\(--border\)/);
  assert.match(sharedActionRule, /background:\s*var\(--surface\)/);
  assert.match(sharedActionRule, /height:\s*42px/);
  assert.match(sharedActionRule, /min-height:\s*42px/);
  assert.match(hoverRule, /border-color:\s*var\(--faint\)/);
  assert.match(hoverRule, /background:\s*var\(--surface\)/);
  assert.match(
    styles,
    /\.admin-segmented-toggle\.field-assist-toggle:hover,[\s\S]*?border-color:\s*var\(--faint\);[\s\S]*?background:\s*var\(--surface\);/
  );
  assert.match(
    styles,
    /\.admin-workspace \.tool-form input,[\s\S]*?\.admin-workspace \.tool-form select \{[\s\S]*?min-height:\s*42px;/
  );
  assert.match(
    styles,
    /\.admin-resource-input-row > \.field-assist-button,[\s\S]*?min-height:\s*42px;[\s\S]*?height:\s*42px;/
  );
  assert.match(
    styles,
    /\.admin-segmented-toggle\.field-assist-toggle \{[\s\S]*?height:\s*42px;[\s\S]*?min-height:\s*42px;/
  );
  assert.match(
    styles,
    /\.tool-editor-dialog \.settings-status-switch \{[\s\S]*?height:\s*42px;[\s\S]*?min-height:\s*42px;/
  );
});

test("primary controls retain their solid button surface", () => {
  const rule = ruleFor(".primary-button:hover:not(:disabled) {");
  assert.match(rule, /border-color:\s*var\(--faint\)/);
  assert.match(rule, /background:\s*var\(--button\)/);
  assert.doesNotMatch(rule, /button-hover-overlay/);
});

test("homepage hero actions keep the original primary and secondary visual hierarchy", () => {
  const primaryRule = ruleFor(".primary-button.public-glow-action {");
  const secondaryRule = ruleFor(".hero-ghost {");
  assert.match(primaryRule, /min-height:\s*42px/);
  assert.match(primaryRule, /min-width:\s*214px/);
  assert.match(primaryRule, /border-radius:\s*8px/);
  assert.match(secondaryRule, /min-height:\s*46px/);
  assert.match(secondaryRule, /min-width:\s*160px/);
  assert.match(secondaryRule, /border-radius:\s*999px/);
  assert.match(secondaryRule, /background:\s*var\(--surface\)/);
  assert.doesNotMatch(secondaryRule, /font-weight/);
  assert.doesNotMatch(secondaryRule, /glow|linear-gradient/);
});

test("public glow actions reuse one component and one responsive size contract", () => {
  assert.match(sharedSource, /export function PublicGlowAction/);
  assert.equal((appSource.match(/<PublicGlowAction\b/g) ?? []).length, 4);
  assert.equal((submitSource.match(/<PublicGlowAction\b/g) ?? []).length, 1);
  assert.doesNotMatch(appSource, /glow-button|small-glow|submit-button/);
  assert.doesNotMatch(submitSource, /glow-button|submit-github-metadata-button/);
  assert.doesNotMatch(submitSource, /className="primary-button submit-button/);
  assert.doesNotMatch(styles, /\.small-glow|\.submit-button\s*\{|\.glow-button/);
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.hero-actions,[\s\S]*?\.hero-actions a,[\s\S]*?\.section-action \.public-glow-action \{[\s\S]*?width:\s*100%;/
  );
});

test("shared segmented choices use the solid selected state", () => {
  const rule = ruleFor(".admin-segmented-toggle button.is-active {");
  const optionRule = ruleFor(".admin-segmented-toggle button {");
  assert.match(rule, /background:\s*var\(--button\)/);
  assert.match(rule, /color:\s*var\(--button-text\)/);
  assert.match(optionRule, /min-width:\s*112px/);
  assert.match(styles, /\.admin-segmented-toggle\s*\{/);
  assert.match(adminSource, /admin-segmented-toggle-option/);
  assert.doesNotMatch(styles, /source-mode-toggle/);
  assert.doesNotMatch(styles, /\.article-publish-toggle/);
  assert.doesNotMatch(styles, /\.content-convert-publish-options/);
  assert.doesNotMatch(
    styles,
    /\.article-publish-mode-field \.admin-segmented-toggle-option/
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.admin-workspace \.admin-segmented-toggle button \{[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*100%;/
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.tool-editor-dialog \.admin-resource-input-row > \.field-assist-button,[\s\S]*?flex:\s*0 0 auto;[\s\S]*?width:\s*auto;[\s\S]*?max-width:\s*min\(42%, 160px\);/
  );
  assert.equal((adminSource.match(/admin-segmented-toggle/g) ?? []).length >= 4, true);
});

test("tool featured status reuses the preview image field assistant toggle", () => {
  const toolEditor = adminSource.slice(
    adminSource.indexOf('<form id="admin-tool-editor-form"'),
    adminSource.indexOf("{articleFormOpen ? (")
  );

  assert.match(
    toolEditor,
    /t\.form\.category[\s\S]*?admin-resource-input-row[\s\S]*?tool-featured-status-toggle field-assist-toggle/
  );
  assert.match(toolEditor, /tool-featured-status-toggle field-assist-toggle[\s\S]*?singleOption/);
  assert.match(
    toolEditor,
    /enabledIcon=\{[\s\S]*?<Star[\s\S]*?fill=\{form\.featured \? "currentColor" : "none"\}[\s\S]*?size=\{16\}/
  );
  assert.doesNotMatch(toolEditor, /disabledIcon=\{<Star size=\{16\} \/>\}/);
  assert.equal(
    (toolEditor.match(/tool-featured-status-toggle/g) ?? []).length,
    1
  );
});

test("admin sections reuse one sort control and persist independent preferences", () => {
  assert.equal((adminSource.match(/<AdminSortButton/g) ?? []).length, 4);
  assert.match(adminSource, /htools_admin_tool_sort/);
  assert.match(adminSource, /htools_admin_article_sort/);
  assert.match(adminSource, /htools_admin_content_sort/);
  assert.match(adminSource, /htools_admin_telegram_push_sort/);
  assert.doesNotMatch(adminSource, /const \[sortMode, setSortMode\]/);
});

test("admin navigation resets the shared content scroller for every section", () => {
  assert.match(adminSource, /ref=\{adminContentScrollRef\}/);
  assert.match(
    adminSource,
    /function selectAdminView[\s\S]*adminContentScrollRef\.current\?\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/
  );
});

test("admin dialogs reuse shared top actions, publish mode, footer and confirmation components", () => {
  assert.equal((adminSource.match(/<EditorTopActions/g) ?? []).length, 2);
  assert.equal((adminSource.match(/<PublishModeField/g) ?? []).length, 3);
  assert.equal((adminSource.match(/<BooleanSegmentedToggle/g) ?? []).length, 3);
  const actionTags = [
    ...(adminSource.match(/<AdminDialogActions[\s\S]*?\/>/g) ?? []),
    ...(dialogComponentSource.match(/<AdminDialogActions[\s\S]*?\/>/g) ?? [])
  ];
  assert.equal(actionTags.length, 6);
  assert.equal(actionTags.filter((tag) => /closeLabel=/.test(tag)).length, 1);
  assert.equal((adminSource.match(/<AdminConfirmDialog\b/g) ?? []).length, 13);
  const panelClassNames = [
    ...adminSource.matchAll(/panelClassName="([^"]+)"/g),
    ...dialogComponentSource.matchAll(/panelClassName="([^"]+)"/g)
  ].map((match) => match[1]);
  assert.equal(panelClassNames.length, 11);
  assert.ok(
    panelClassNames.every((className) =>
      className.split(/\s+/).includes("tool-editor-dialog")
    )
  );
});

test("Telegram source sync stays a whole-message footer action while title generation stays field-level", () => {
  const telegramDialog = adminSource.slice(
    adminSource.indexOf("{telegramResource ? ("),
    adminSource.indexOf("{viewingTelegramPush ? (")
  );

  assert.match(
    telegramDialog,
    /footer=\{[\s\S]*?telegramResource\.type !== "custom" \? \([\s\S]*?<button[\s\S]*?className="ghost-button"[\s\S]*?if \(telegramMessage\?\.resourceExists === false\)[\s\S]*?setPendingTelegramSourceSync\(true\)[\s\S]*?>\s*\{telegramText\.syncSource\}\s*<\/button>[\s\S]*?\{telegramText\.save\}/
  );
  assert.doesNotMatch(telegramDialog, /telegram-editor-top-actions/);
  assert.match(
    telegramDialog,
    /<AdminTextField[\s\S]*?inputAside=\{[\s\S]*?<AdminAiAction[\s\S]*?label=\{maintenanceText\.aiGeneratePushTitle\}[\s\S]*?id="telegram-custom-title"/
  );
  assert.doesNotMatch(
    telegramDialog,
    /<AdminTextField[\s\S]*?inputAside=\{[\s\S]*?label=\{telegramText\.syncSource\}[\s\S]*?id="telegram-custom-title"/
  );
});

test("editor and Telegram dialogs rely on the shared top or gesture close", () => {
  const editorActionTags = (adminSource.match(/<AdminDialogActions[\s\S]*?\/>/g) ?? [])
    .filter((tag) => !/closeLabel=\{cancelLabel\}/.test(tag));
  assert.equal(editorActionTags.length, 5);
  assert.ok(editorActionTags.every((tag) => !/closeLabel=/.test(tag)));

  const telegramStart = adminSource.indexOf(
    'panelClassName="tool-editor-dialog admin-tool-editor-dialog telegram-message-dialog"'
  );
  const telegramEnd = adminSource.indexOf("</Dialog>", telegramStart);
  const telegramDialogSource = adminSource.slice(telegramStart, telegramEnd);
  assert.doesNotMatch(telegramDialogSource, /requestTelegramMessageClose/);
  assert.doesNotMatch(telegramDialogSource, /\{t\.actions\.close\}/);
});

test("mobile dialog footers keep every shared action in one equal-width row", () => {
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.dialog-footer \{[\s\S]*?align-items:\s*center;[\s\S]*?flex-direction:\s*row;/
  );
  assert.match(
    styles,
    /\.dialog-panel \.dialog-footer > button \{[\s\S]*?flex:\s*1 1 0;[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*auto;/
  );
  assert.doesNotMatch(styles, /\.admin-delete-dialog/);
  assert.doesNotMatch(
    styles,
    /\.tool-editor-dialog \.dialog-footer\s*\{[^}]*flex-direction:/
  );
  assert.doesNotMatch(styles, /\.telegram-message-dialog \.dialog-footer/);
});

test("admin sections reuse one filter bar and persist independent filters", () => {
  assert.equal((adminSource.match(/<AdminFilterBar/g) ?? []).length, 4);
  for (const key of [
    "htools_admin_tool_search",
    "htools_admin_tool_category",
    "htools_admin_article_search",
    "htools_admin_article_category",
    "htools_admin_content_search",
    "htools_admin_content_category",
    "htools_admin_content_source"
  ]) {
    assert.match(adminSource, new RegExp(key));
  }
  assert.doesNotMatch(adminSource, /resetAdminViewFilters/);
});

test("admin card and module introductions reuse the editor description typography", () => {
  const rule = ruleFor(
    ".admin-workspace .source-public-card > div:first-of-type > p:first-of-type,"
  );

  assert.match(rule, /color:\s*var\(--text\)/);
  assert.match(rule, /font-size:\s*14px/);
    assert.match(rule, /font-weight:\s*400/);
    assert.match(rule, /line-height:\s*1\.4/);
  assert.match(styles, /\.dialog-description\s*\{/);
});

test("admin field labels reuse the editor field label typography", () => {
  const rule = ruleFor(".admin-workspace .source-url-field,");

  assert.match(rule, /color:\s*var\(--text\)/);
  assert.match(rule, /font-size:\s*14px/);
  assert.match(rule, /font-weight:\s*500/);
  assert.match(rule, /line-height:\s*1/);
  assert.match(ruleFor(".proxy-settings-help p {"), /font-size:\s*14px/);
});

test("admin titles and editable values use one typography scale on every viewport", () => {
  const titleRule = ruleFor(".admin-route .dialog-header h2 {");
  const valueRule = ruleFor(".admin-workspace input,");

  assert.match(titleRule, /font-size:\s*18px/);
  assert.match(titleRule, /font-weight:\s*600/);
  assert.match(titleRule, /line-height:\s*1\.2/);
  assert.doesNotMatch(
    styles,
    /\.tool-editor-dialog \.dialog-header h2\s*\{[^}]*font-size:\s*16px/
  );
  assert.match(valueRule, /font-size:\s*14px/);
  assert.match(valueRule, /font-weight:\s*400/);
  assert.match(valueRule, /line-height:\s*1\.4/);
});

test("admin service status text reuses the description typography", () => {
  const rule = ruleFor(".source-card-status {");

  assert.match(rule, /font-size:\s*14px/);
  assert.match(rule, /font-weight:\s*400/);
  assert.match(rule, /line-height:\s*1\.4/);
});

test("admin filter toolbar actions share the field-label typography", () => {
  const rule = ruleFor("\n.admin-category-filter-trigger {");
  const searchRule = ruleFor(".admin-workspace .admin-category-filter-trigger input {");
  const responsiveClearRule = ruleFor(".admin-topbar-actions .admin-clear-filter {");

  assert.match(rule, /font-size:\s*14px/);
  assert.match(rule, /font-weight:\s*500/);
  assert.match(rule, /line-height:\s*1/);
  assert.match(searchRule, /height:\s*1em/);
  assert.match(searchRule, /min-height:\s*1em/);
  assert.match(searchRule, /line-height:\s*1/);
  assert.match(adminSource, /placeholder=\{categoryText\.inputPlaceholder\}/);
  assert.doesNotMatch(adminSource, /className="admin-category-filter-value admin-category-filter-placeholder"/);
  assert.doesNotMatch(adminSource, /placeholder=\{displaySelectedLabel\}/);
  assert.match(responsiveClearRule, /height:\s*40px/);
  assert.match(responsiveClearRule, /min-height:\s*40px/);
});

test("admin category popovers use the shared action and body typography", () => {
  const optionRule = ruleFor(".admin-category-create-option,");
  const emptyRule = ruleFor(".admin-category-filter-empty {");

  assert.match(optionRule, /font-size:\s*14px/);
  assert.match(optionRule, /font-weight:\s*500/);
  assert.match(optionRule, /line-height:\s*1/);
  assert.match(emptyRule, /font-size:\s*14px/);
  assert.match(emptyRule, /font-weight:\s*400/);
  assert.match(emptyRule, /line-height:\s*1\.4/);
  assert.match(emptyRule, /color:\s*var\(--text\)/);
});

test("后台分类选项留出行间距，操作按钮与选项等高且独立于卡片尺寸", () => {
  const listRule = ruleFor("\n.admin-category-filter-list {");
  const optionRule = ruleFor(".admin-category-create-option,");
  const actionRule = ruleFor(".admin-category-filter-list .admin-category-option-action {");

  assert.match(listRule, /row-gap:\s*4px/);
  assert.match(optionRule, /min-height:\s*38px/);
  assert.match(optionRule, /border-radius:\s*6px/);
  for (const property of ["width", "min-width", "height", "min-height"]) {
    assert.match(actionRule, new RegExp(`(?:^|[;\\s])${property}:\\s*38px`));
  }
  assert.equal(
    (styles.match(/\.admin-category-filter-list \.admin-category-option-action\s*\{/g) ?? []).length,
    1,
    "分类操作尺寸只在公共分类规则中定义，不跟随卡片断点覆盖"
  );
  assert.match(ruleFor(".admin-tool-card-actions {"), /--admin-card-action-size:\s*32px/);
  const cardActionRule = ruleFor(".admin-tool-card-actions .icon-button {");
  for (const property of ["width", "min-width", "height", "min-height"]) {
    assert.match(cardActionRule, new RegExp(`${property}:\\s*var\\(--admin-card-action-size\\)`));
  }
  assert.match(
    styles,
    /@media \(max-width: 760px\) \{\s*\.admin-tool-card-actions \{[^}]*--admin-card-action-size:\s*36px/
  );
});

test("admin sidebar, cards, statistics and tables use only the shared text tiers", () => {
  const labelRules = [
    ".admin-sidebar-section {",
    ".admin-sidebar-nav button {",
    ".admin-tool-card-head h2 {",
    ".admin-tool-action-menu button {",
    ".link-check-table th {",
    ".link-check-table td:first-child strong {",
    ".admin-workspace .link-check-open-link {",
    ".content-source-copy strong {",
    ".content-item-select strong {"
  ];
  const bodyRules = [
    ".admin-brand small,",
    ".admin-tool-title-meta span {",
    ".admin-tool-link-row,",
    ".link-check-table th,",
    ".link-check-type-label {",
    ".link-check-result-pill {",
    ".link-check-duration {"
  ];

  for (const selector of labelRules) {
    const rule = ruleFor(selector);
    assert.match(rule, /font-size:\s*14px/, selector);
    assert.match(rule, /font-weight:\s*500/, selector);
    assert.match(rule, /line-height:\s*1(?:;|\s)/, selector);
  }
  for (const selector of bodyRules) {
    const rule = ruleFor(selector);
    assert.match(rule, /font-size:\s*14px/, selector);
    assert.match(rule, /font-weight:\s*400/, selector);
    assert.match(rule, /line-height:\s*1\.4/, selector);
  }
});

test("subscription content uses a compact list, shared actions, and the three-pane reader", () => {
  const cardStart = adminSource.indexOf("function ContentItemCard(");
  const cardEnd = adminSource.indexOf("type AdminCategoryText", cardStart);
  const cardSource = adminSource.slice(cardStart, cardEnd);

  assert.match(cardSource, /useAdminCardActionMenu/);
  assert.match(cardSource, /<AdminCardActionMenu/);
  assert.match(cardSource, /className="content-item-select"/);
  assert.match(cardSource, /admin-article-publish-button/);
  assert.match(cardSource, /contentText\.convert/);
  assert.match(cardSource, /contentText\.updateArticle/);
  assert.match(
    cardSource,
    /\{item\.articleId \? <CheckCircle2 size=\{16\} \/> : <FileText size=\{16\} \/>\}/
  );
  assert.match(cardSource, /contentText\.openOriginalShort/);
  assert.match(cardSource, /onClick=\{onSelect\}/);
  assert.doesNotMatch(cardSource, /window\.open\(browseHref/);
  assert.doesNotMatch(cardSource, /content-item-head|content-item-main|content-item-cover|admin-tool-links/);

  assert.match(
    styles,
    /\.content-flow-layout \{[\s\S]*grid-template-columns:\s*minmax\(190px, 240px\) minmax\(300px, 360px\) minmax\(0, 1fr\);/
  );
  assert.match(
    styles,
    /\.content-item-card\.is-active \{[\s\S]*background:\s*var\(--admin-borderless-hover-bg\);/
  );
  assert.match(
    styles,
    /@media \(max-width: 1200px\) and \(min-width: 921px\) \{[\s\S]*\.content-flow-reader \{[\s\S]*display:\s*none;/
  );
  assert.match(styles, /\.content-item-card\.has-source-icon\s*\{[\s\S]*grid-template-columns:\s*28px minmax\(0, 1fr\)/);
});

test("admin check help and statistic labels use the normal body color", () => {
  assert.match(ruleFor(".link-check-field small {"), /color:\s*var\(--text\)/);
  assert.match(
    ruleFor(".source-report-grid span,"),
    /color:\s*var\(--text\)/
  );
});

test("admin statistics reuse the GitHub detail item appearance", () => {
  const sharedRule = ruleFor(".tool-github-detail-item,");
  const rules = [
    ruleFor(".source-report-grid span,"),
    ruleFor(".source-report-grid strong,")
  ];

  assert.match(sharedRule, /border:\s*1px solid var\(--border\)/);
  assert.match(sharedRule, /border-radius:\s*6px/);
  assert.match(sharedRule, /background:\s*var\(--surface\)/);
  assert.match(sharedRule, /padding:\s*9px 12px/);
  for (const rule of rules) {
    assert.match(rule, /font-size:\s*14px/);
    assert.match(rule, /font-weight:\s*500/);
    assert.match(rule, /line-height:\s*1\.4/);
  }
});

test("admin login uses the shared label and value tiers without a duplicate heading", () => {
  const labelRule = ruleFor(".auth-form label {");
  const inputRule = ruleFor(".auth-form input {");

  assert.match(labelRule, /font-size:\s*14px/);
  assert.match(labelRule, /font-weight:\s*500/);
  assert.match(labelRule, /line-height:\s*1/);
  assert.match(inputRule, /font-size:\s*14px/);
  assert.match(inputRule, /font-weight:\s*400/);
  assert.match(inputRule, /line-height:\s*1\.4/);
  assert.doesNotMatch(styles, /\.auth-card h1\s*\{/);
  assert.doesNotMatch(styles, /\.auth-card p\s*\{/);
});

test("content conversion dialog keeps the shared rounded panel clipping", () => {
  assert.doesNotMatch(
    styles,
    /\.content-convert-dialog\s*\{[\s\S]*?overflow:\s*visible;/
  );
  assert.doesNotMatch(
    styles,
    /\.content-convert-dialog \.dialog-body\s*\{[\s\S]*?overflow:\s*visible;/
  );
  assert.match(ruleFor(".dialog-panel {"), /overflow:\s*hidden/);
  assert.match(
    styles,
    /\.tool-editor-dialog\s*\{[\s\S]*?border-radius:\s*18px 18px 0 0;/
  );
});

test("article cards reuse the shared two-line description height", () => {
  assert.doesNotMatch(
    styles,
    /\.admin-article-card \.admin-tool-description\s*\{[\s\S]*?min-height:\s*48px;/
  );
  const descriptionRule = ruleFor(".admin-tool-description {");
  assert.match(descriptionRule, /height:\s*calc\(1\.4em \* 2\)/);
  assert.match(descriptionRule, /-webkit-line-clamp:\s*2/);
});

test("tool, article, and push cards share the tool card size contract", () => {
  const cardRule = ruleFor(".admin-tool-card {");
  const titleRule = ruleFor(".admin-tool-title {");
  const contentScrollRule = ruleFor(".admin-content-scroll {");

  assert.match(cardRule, /min-height:\s*166px/);
  assert.match(titleRule, /min-height:\s*42px/);
  assert.match(contentScrollRule, /scrollbar-gutter:\s*stable/);
  assert.doesNotMatch(styles, /\.admin-article-card \.admin-tool-title\s*\{/);
  assert.match(
    articleCardSource,
    /function AdminArticleCard\([\s\S]*?<article className="admin-tool-card admin-article-card">/
  );
  assert.match(
    telegramPushSource,
    /function TelegramPushRecordCard\([\s\S]*?<article className="admin-tool-card admin-article-card">/
  );
});

test("content flow scrollbars start below fixed toolbars without shifting between sources", () => {
  assert.match(ruleFor(".content-source-list {"), /scrollbar-gutter:\s*stable/);
  assert.match(ruleFor(".content-flow-main-scroll,"), /scrollbar-gutter:\s*stable/);
  assert.match(ruleFor(".content-flow-main,"), /overflow:\s*hidden/);
  assert.doesNotMatch(ruleFor(".content-source-toolbar,"), /position:\s*sticky/);
  assert.match(adminSource, /className="content-flow-main-scroll"/);
  assert.match(adminSource, /className="content-flow-reader-scroll"/);
});

test("shared scrollbars match the published width without arrow buttons", () => {
  const desktopScrollbars = styles.slice(
    styles.indexOf("/* Match the published scrollbar width"),
    styles.indexOf("html {")
  );

  assert.match(desktopScrollbars, /@media \(min-width: 921px\)/);
  assert.match(desktopScrollbars, /\*::-webkit-scrollbar \{[^}]*width:\s*10px/);
  assert.match(desktopScrollbars, /\*::-webkit-scrollbar \{[^}]*height:\s*10px/);
  assert.match(desktopScrollbars, /\*::-webkit-scrollbar-button \{[^}]*display:\s*none/);
  assert.match(desktopScrollbars, /\*::-webkit-scrollbar-button \{[^}]*width:\s*0/);
  assert.match(desktopScrollbars, /\*::-webkit-scrollbar-button \{[^}]*height:\s*0/);
  assert.doesNotMatch(styles, /scrollbar-width:\s*thin/);
});

test("public article cards align desktop summaries without adding mobile whitespace", () => {
  const publicSummaryRule = ruleFor(".article-item p {");
  assert.match(publicSummaryRule, /min-height:\s*calc\(1\.45em \* 2\)/);
  assert.match(publicSummaryRule, /-webkit-line-clamp:\s*2/);
  assert.match(
    styles,
    /@media \(max-width: 640px\) \{[\s\S]*?\.article-item p \{[\s\S]*?min-height:\s*0;/
  );
  assert.doesNotMatch(styles, /#latest-articles \.article-item p/);
  assert.doesNotMatch(styles, /\.article-page-list \.article-item p/);
});
