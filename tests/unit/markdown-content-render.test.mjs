import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { createElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const proxy = await compileTypescriptModule(new URL("../../src/proxy.ts", import.meta.url));
after(() => proxy.cleanup());
const stub = (body) => `data:text/javascript,${encodeURIComponent(body)}`;
const articleHelpers = await compileTypescriptModule(new URL("../../src/article-helpers.ts", import.meta.url), {
  importReplacements: {
    "lucide-react": import.meta.resolve("lucide-react"),
    "./admin-field-examples": stub("export const ADMIN_RESOURCE_FIELD_EXAMPLES = { zh: {}, en: {} };"),
    "./i18n": stub("export const translations = { zh: {}, en: {} };"),
    "./admin-helpers": stub('export const ADMIN_FEATURED_CATEGORY = "Featured";')
  }
});
after(() => articleHelpers.cleanup());
const locales = await Promise.all(["zh", "en"].map((locale) => compileTypescriptModule(
  new URL(`../../src/i18n/${locale}.ts`, import.meta.url),
  { importReplacements: { "../admin-field-examples": stub("export const ADMIN_RESOURCE_FIELD_EXAMPLES = { zh: {}, en: {} };") } }
)));
after(() => Promise.all(locales.map((locale) => locale.cleanup())));
const i18n = stub(`import { zh } from "${locales[0].url.href}"; import { en } from "${locales[1].url.href}"; export const translations = { zh, en };`);
const toastContext = await compileTypescriptModule(new URL("../../src/toast-context.ts", import.meta.url), {
  importReplacements: { react: import.meta.resolve("react") }
});
after(() => toastContext.cleanup());
const source = await readFile(new URL("../../src/components/MarkdownContent.tsx", import.meta.url), "utf8");
let compiled = ts.transpileModule(source, {
  fileName: "MarkdownContent.tsx",
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
for (const specifier of ["react", "react/jsx-runtime", "lucide-react", "react-markdown", "rehype-raw", "rehype-sanitize", "remark-breaks", "remark-gfm", "remark-parse", "unified"]) {
  compiled = compiled.replaceAll(`from "${specifier}"`, `from "${import.meta.resolve(specifier)}"`);
}
compiled = compiled.replaceAll('from "../proxy"', `from "${proxy.url.href}"`);
compiled = compiled.replaceAll('from "../article-helpers"', `from "${articleHelpers.url.href}"`);
compiled = compiled.replaceAll('from "../i18n"', `from "${i18n}"`);
compiled = compiled.replaceAll('from "../toast-context"', `from "${toastContext.url.href}"`);
compiled += "\nexport { copyTextToClipboard, getMarkdownCodeBlockLabels };";
const { default: MarkdownContent, ArticleSummary, copyTextToClipboard, getMarkdownCodeBlockLabels } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const render = (content) => renderToStaticMarkup(createElement(MarkdownContent, { content, locale: "zh" }));
const renderSummary = (summary, content) => renderToStaticMarkup(createElement(ArticleSummary, { summary, content }));

test("正文重渲染保留组件身份，内容、语言和代理变更仍更新实际输出", () => {
  const proxySettings = { enabled: false, baseUrl: "", mode: "prefix", scope: "all" };
  const content = "```js\nconst marker = 1;\n```\n\n[文档](https://example.test/docs)\n\n![示例](https://example.test/image.png)";
  const changedContent = content.replace("marker = 1", "marker = 2");
  const inputs = [
    { content, locale: "zh", proxySettings },
    { content, locale: "zh", proxySettings },
    { content: changedContent, locale: "zh", proxySettings },
    { content: changedContent, locale: "en", proxySettings },
    { content: changedContent, locale: "en", proxySettings: { ...proxySettings, enabled: true, baseUrl: "https://proxy.test/" } }
  ];
  const renders = [];
  function RerenderProbe() {
    const [index, setIndex] = useState(0);
    // 在同一次 React 渲染中依序换入真实 props，保留被测组件的 Hook 状态。
    const output = MarkdownContent(inputs[index]);
    renders.push({ output, components: output.props.children[0].props.components });
    if (index < inputs.length - 1) setIndex(index + 1);
    return output;
  }
  renderToStaticMarkup(createElement(RerenderProbe));
  assert.equal(renders.length, inputs.length);
  assert.equal(renders[0].components, renders[1].components, "普通重渲染不能重建代码块");
  assert.equal(renders[1].components, renders[2].components, "修改正文应通过 props 更新既有组件");
  const html = renders.map(({ output }) => renderToStaticMarkup(output));
  assert.match(html[0], /const marker = 1;/);
  assert.match(html[2], /const marker = 2;/);
  assert.doesNotMatch(html[2], /const marker = 1;/);
  assert.match(html[2], /复制 JS/);
  assert.match(html[3], /Copy JS/);
  assert.match(html[3], /href="https:\/\/example\.test\/docs"/);
  assert.match(html[4], /href="https:\/\/proxy\.test\/https:\/\/example\.test\/docs"/);
  assert.match(html[4], /src="https:\/\/proxy\.test\/https:\/\/example\.test\/image\.png"/);
});

async function withClipboardEnvironment({ writeText, command = () => true, input = false, emptySelection = false }, run) {
  const state = { nodes: [], commands: [], focused: null, copiedValue: null };
  const originalRange = { text: "原有正文选区", cloneRange() { return { ...this }; } };
  const selection = {
    ranges: [originalRange],
    get rangeCount() { return this.ranges.length; },
    getRangeAt(index) { return this.ranges[index]; },
    removeAllRanges() { this.ranges = []; },
    addRange(range) { this.ranges.push(range); }
  };
  class Element {
    focus(options) { state.focused = this; this.focusOptions = options; }
  }
  class Input extends Element {
    selectionStart = 2;
    selectionEnd = 6;
    selectionDirection = "backward";
    setSelectionRange(start, end, direction) {
      this.selectionStart = start;
      this.selectionEnd = end;
      this.selectionDirection = direction;
    }
  }
  class Textarea extends Input {
    style = {};
    setAttribute() {}
    select() { selection.removeAllRanges(); }
    remove() { state.nodes = state.nodes.filter((node) => node !== this); }
  }
  state.activeElement = input ? new Input() : new Element();
  const browserGlobals = {
    navigator: { clipboard: writeText ? { writeText } : undefined },
    HTMLElement: Element,
    HTMLInputElement: Input,
    HTMLTextAreaElement: Textarea,
    document: {
      activeElement: emptySelection ? null : state.activeElement,
      getSelection: () => emptySelection ? null : selection,
      createElement: () => new Textarea(),
      body: { appendChild(node) { state.nodes.push(node); } },
      execCommand(name) {
        state.commands.push(name);
        state.copiedValue = state.nodes[0]?.value;
        if (input) state.activeElement.setSelectionRange(0, 0, "none");
        return command();
      }
    }
  };
  const previous = new Map(Object.keys(browserGlobals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(browserGlobals)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  try {
    await run(state, selection);
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test("代码复制仅在 Clipboard API 成功后完成，保留完整代码原文", async () => {
  const value = "const 示例 = '<tag>';\nconsole.log(示例);";
  const writes = [];
  await withClipboardEnvironment({ writeText: async (text) => { writes.push(text); } }, async (state) => {
    await copyTextToClipboard(value);
    assert.deepEqual(writes, [value]);
    assert.deepEqual(state.commands, []);
    assert.deepEqual(state.nodes, []);
  });
});

test("复制权限被拒时返回失败，不改用兼容接口误报成功", async () => {
  const denied = new Error("Permission denied");
  await withClipboardEnvironment({ writeText: async () => { throw denied; } }, async (state) => {
    await assert.rejects(copyTextToClipboard("code"), (error) => error === denied);
    assert.deepEqual(state.commands, []);
    assert.deepEqual(state.nodes, []);
  });
});

for (const [name, command, failure] of [
  ["成功", () => true, null],
  ["返回 false", () => false, /Copy failed/],
  ["抛出异常", () => { throw new Error("Copy unavailable"); }, /Copy unavailable/]
]) {
  test(`兼容复制${name}均清理临时节点并恢复原焦点和正文选区`, async () => {
    await withClipboardEnvironment({ command }, async (state, selection) => {
      if (failure) await assert.rejects(copyTextToClipboard("完整\n代码"), failure);
      else await copyTextToClipboard("完整\n代码");
      assert.equal(state.copiedValue, "完整\n代码");
      assert.deepEqual(state.commands, ["copy"]);
      assert.deepEqual(state.nodes, []);
      assert.equal(state.focused, state.activeElement);
      assert.deepEqual(state.activeElement.focusOptions, { preventScroll: true });
      assert.equal(selection.rangeCount, 1);
      assert.equal(selection.getRangeAt(0).text, "原有正文选区");
    });
  });
}

test("兼容复制失败仍恢复输入框原选区和选择方向", async () => {
  await withClipboardEnvironment({ command: () => false, input: true }, async (state) => {
    await assert.rejects(copyTextToClipboard("code"), /Copy failed/);
    assert.deepEqual([
      state.activeElement.selectionStart,
      state.activeElement.selectionEnd,
      state.activeElement.selectionDirection
    ], [2, 6, "backward"]);
    assert.deepEqual(state.nodes, []);
  });
});

test("兼容复制无原选区或焦点时仍可完成并清理", async () => {
  await withClipboardEnvironment({ emptySelection: true }, async (state) => {
    await copyTextToClipboard("code");
    assert.deepEqual(state.nodes, []);
  });
});

test("代码复制失败提示按显式语言使用中英文公共文案", () => {
  assert.equal(getMarkdownCodeBlockLabels("zh").copyFailed, "复制失败，请手动选择代码复制。");
  assert.equal(getMarkdownCodeBlockLabels("en").copyFailed, "Copy failed. Select the code and copy it manually.");
});

test("HTML 简介判重保留代码字面量和行内元素之间的词界", () => {
  for (const [summary, content] of [
    ["Use xy.", "<pre>Use x_y.</pre>"],
    ["Use xy.", "<div>Use x_y.</div>"],
    ["We are now here", "<p>We are now<strong>here</strong></p>"],
    ["We are nowhere", "We are now<br>here"]
  ]) {
    assert.equal(renderSummary(summary, content), `<p>${summary}</p>`);
  }
  assert.ok(render("<pre>Use x_y.</pre>").includes("Use x_y."));
  assert.equal(renderSummary("We are nowhere", "<p>We are now<strong>here</strong></p>"), "");
  assert.equal(renderSummary("Read docs.", "<p>Read <strong>docs</strong>.</p>"), "");
  assert.equal(renderSummary("Read docs.", "<div>Read</div><div>docs.</div>"), "");
});

test("简介只与净化后的可见正文比较，被删除的标签和脚本不算重复", () => {
  for (const [summary, content, visible] of [
    ["#topic", "#topic\n\nDifferent paragraph.", "Different paragraph."],
    ["Read docs.", "Read <script>docs</script>.", "Read ."],
    ["Read docs.", "Read <style>docs</style>.", "Read ."]
  ]) {
    assert.equal(renderSummary(summary, content), `<p>${summary}</p>`);
    const html = render(content);
    assert.ok(html.includes(visible));
    assert.doesNotMatch(html, /#topic|<script|<style/);
  }
  assert.equal(renderSummary("Different paragraph.", "#topic\n\nDifferent paragraph."), "");
  assert.equal(renderSummary("Read docs.", "<!-- comment -->\n\nRead docs."), "");
});

test("简介比较遵循链接卡片的实际显示顺序，原文卡片内容继续参与比较", () => {
  const links = "::links\n# Resources\n- [Docs](https://example.com/docs)\n::";
  assert.equal(renderSummary("Start here.", `${links}\n\nStart here.`), "");
  assert.equal(renderSummary("Resources Docs", links), "");
  assert.equal(renderSummary("Original Link Docs", "## Original Link\n[Docs](https://example.com/docs)"), "");
  assert.equal(renderSummary("Read docs.", "Read[^note] docs.\n\n[^note]: Other details."), "");
});

test("文章简介按英文词界比较，多余空白不影响去重", () => {
  for (const [summary, content] of [
    ["We need a part.", "We need apart."],
    ["We are now here.", "We are nowhere."],
    ["We need apart.", "We need a part."]
  ]) {
    assert.equal(renderSummary(summary, content), `<p>${summary}</p>`);
  }
  assert.equal(renderSummary("We need a part.", "We\nneed a   part.\n\nMore details."), "");
});

test("重复简介兼容无序、有序、嵌套与任务列表，正文列表保留", () => {
  for (const content of [
    "- Read docs.",
    "1. Read docs.",
    "- [x] Read docs.",
    "> - Read docs.",
    "- Read\n  - docs."
  ]) {
    assert.equal(renderSummary("Read docs.", content), "");
    assert.match(render(content), /<li[ >]/);
  }
  assert.equal(renderSummary("Read apart.", "- Read a\n- part."), "<p>Read apart.</p>");
});

test("重复简介识别完整、折叠和快捷引用，正文链接仍可访问", () => {
  for (const content of [
    "Read [docs][d].\n\n[d]: https://example.com/docs",
    'Read [docs][DOCS].\n\n[docs]: <https://example.com/docs> "说明"',
    "Read [docs][].\n\n[docs]: https://example.com/docs",
    "Read [docs].\n\n[docs]: https://example.com/docs"
  ]) {
    assert.equal(renderSummary("Read docs.", content), "");
    assert.match(render(content), /href="https:\/\/example\.com\/docs"/);
  }
});

test("未定义引用与代码里的Markdown、HTML及标识符不能误隐藏简介", () => {
  for (const [summary, content] of [
    ["Read docs.", "Read [docs][missing]."],
    ["Read docs.", "`Read [docs][d].`\n\n[d]: https://example.com/docs"],
    ["Read docs.", "```md\nRead [docs][d].\n```\n\n[d]: https://example.com/docs"],
    ["Read docs.", "`Read <tag>docs</tag>.`"],
    ["Use xy.", "`Use x_y.`"],
    ["First item.", "    - First item."],
    ["First item.", "```md\n* First item.\n```"],
    ["First item.", "\\* First item."]
  ]) {
    assert.equal(renderSummary(summary, content), `<p>${summary}</p>`);
  }
});

test("简介比较兼容中文实体、链接、引用和图片，正文保持完整", () => {
  const summary = "第一段 A & B 内容。第二段包含链接和引用。";
  const paragraphs = "第一段 A &amp; B 内容。\n\n> 第二段包含[链接](https://example.com)和引用。";
  for (const image of [
    "",
    "![图片说明](image.png)\n\n",
    "[![图片说明](image.png)](https://example.com/image)\n\n",
    "![图片说明][cover]\n\n[cover]: image.png\n\n"
  ]) {
    const content = image + paragraphs;
    assert.equal(renderSummary(summary, content), "");
    const html = render(content);
    assert.ok(html.includes("第一段 A &amp; B 内容。"));
    assert.match(html, /<blockquote>/);
    assert.match(html, /href="https:\/\/example\.com"/);
  }
});

test("独立简介、正文较短或仅在中间匹配时仍显示，空简介不占位置", () => {
  for (const [summary, content] of [
    ["Independent summary.", "Read docs."],
    ["Read docs and examples.", "Read docs."],
    ["Read docs.", "Start here.\n\nRead docs."]
  ]) {
    assert.equal(renderSummary(summary, content), `<p>${summary}</p>`);
  }
  assert.equal(renderSummary("", "Read docs."), "");
});

for (const fence of ["```", "~~~~"]) {
  test(`${fence} 围栏代码保留 script 与 style 原文并转义显示`, () => {
    const html = render(`${fence}html\n<script src="https://example.com/app.js"></script>\n<style>.demo { color: red; }</style>\n${fence}`);
    assert.ok(html.includes("https://example.com/app.js"));
    assert.ok(html.includes(".demo { color: red; }"));
    assert.ok(html.includes("&lt;script"));
    assert.ok(html.includes("&lt;style&gt;"));
    assert.doesNotMatch(html, /<script\b|<style\b|>undefined</i);
  });
}

test("行内和缩进代码中的 HTML 示例保留原文", () => {
  for (const content of [
    '`<script>window.example = 1;</script>`',
    '代码示例：\n\n    <script>window.example = 1;</script>',
    '`<style>.example { display: block; }</style>`'
  ]) {
    const html = render(content);
    assert.ok(html.includes("example"));
    assert.doesNotMatch(html, /<script\b|<style\b/i);
  }
});

test("正文中的危险 HTML 仍被清除，普通格式和链接继续保留", () => {
  const html = render([
    '<script>window.unsafeScript = true;</script>',
    '<style>.unsafeStyle { display: none; }</style>',
    '<p onclick="alert(1)">普通正文 <strong>强调</strong></p>',
    '<img src="https://example.com/image.png" onerror="alert(1)">',
    '<a href="javascript:alert(1)">危险链接</a>',
    '[安全链接](https://example.com/safe)'
  ].join("\n\n"));
  assert.doesNotMatch(html, /<script\b|<style\b|unsafeScript|unsafeStyle|onclick|onerror|javascript:/i);
  assert.ok(html.includes("普通正文"));
  assert.ok(html.includes("<strong>强调</strong>"));
  assert.ok(html.includes('href="https://example.com/safe"'));
});

for (const [name, wrap] of [
  ["反引号围栏", (code) => `\`\`\`text\n${code}\n\`\`\``],
  ["波浪线围栏", (code) => `~~~~text\n${code}\n~~~~`],
  ["嵌套反引号围栏", (code) => `\`\`\`\`markdown\n\`\`\`text\n${code}\n\`\`\`\n\`\`\`\``],
  ["未闭合围栏", (code) => `\`\`\`text\n${code}`],
  ["缩进代码", (code) => code.split("\n").map((line) => `    ${line}`).join("\n")],
  ["制表符缩进代码", (code) => code.split("\n").map((line) => `\t${line}`).join("\n")],
  ["引用中的围栏", (code) => `\`\`\`text\n${code}\n\`\`\``.split("\n").map((line) => `> ${line}`).join("\n")],
  ["列表中的围栏", (code) => `- 示例\n\n${`\`\`\`text\n${code}\n\`\`\``.split("\n").map((line) => `  ${line}`).join("\n")}`],
  ["引用与列表嵌套围栏", (code) => `> - 示例\n>\n${`\`\`\`text\n${code}\n\`\`\``.split("\n").map((line) => `>   ${line}`).join("\n")}`]
]) {
  test(`${name}完整保留指令、注释、锚点和链接卡片语法`, () => {
    const code = [
      "#if DEBUG",
      "#endif",
      "#comment",
      '<a class="headerlink" href="#demo"></a>',
      "[](#demo)",
      "[Tag](/search/result?word=demo)",
      "×",
      "::links",
      "# Demo",
      "- [Example](https://example.com)",
      "::"
    ].join("\n");
    const html = render(wrap(code));
    for (const fragment of ["#if DEBUG", "#endif", "#comment", "&lt;a class=&quot;headerlink&quot;", "[](#demo)", "[Tag](/search/result?word=demo)", "×", "::links"]) {
      assert.ok(html.includes(fragment), `缺少 ${fragment}`);
    }
    assert.doesNotMatch(html, /product-links-section|<a\b/);
  });
}

test("行内代码保留锚点、链接与多反引号内容，正文继续清理", () => {
  const html = render([
    '# 标题<a class="headerlink" href="#title"></a>',
    '语法 `[](#demo)` 与 ``[Tag](/search/result?word=demo) `x` ``。',
    'HTML：`<a class="headerlink" href="#demo"></a>`',
    "[](#remove)",
    "#tag #topic",
    "×",
    "[正文标签](/search/result?word=demo)"
  ].join("\n\n"));
  assert.ok(html.includes("[](#demo)"));
  assert.ok(html.includes("[Tag](/search/result?word=demo) `x`"));
  assert.ok(html.includes("&lt;a class=&quot;headerlink&quot;"));
  assert.ok(html.includes("正文标签"));
  assert.doesNotMatch(html, /#remove|#tag|#topic|×|<a\b/);
});

test("GFM 表格按单元格定位行内代码，不受其他单元格未配对反引号影响", () => {
  const html = render([
    "| `未配对 | 示例 |",
    "| --- | --- |",
    "| 标识符 | `[](#anchor)` |",
    "| 注释 | `#comment` |"
  ].join("\n"));
  assert.ok(html.includes("<table>"));
  assert.ok(html.includes("<code>[](#anchor)</code>"));
  assert.ok(html.includes("<code>#comment</code>"));
});

test("正文中的链接卡片与原文卡片继续提取，代码中的原文标题不提取", () => {
  const html = render([
    "```md",
    "## Original Link",
    "[Example](https://example.com/code)",
    "```",
    "",
    "::links",
    "# 项目 `名称`",
    "- [说明 `code`](https://example.com/docs)",
    "::",
    "",
    "## 原文链接",
    "[原文 `code`](https://example.com/article)"
  ].join("\n"));
  assert.equal((html.match(/product-links-section/g) ?? []).length, 2);
  assert.ok(html.includes("## Original Link"));
  assert.ok(html.includes("[Example](https://example.com/code)"));
  assert.ok(html.includes("项目 `名称`"));
  assert.ok(html.includes("说明 `code`"));
  assert.ok(html.includes("原文 `code`"));
  assert.doesNotMatch(html, /\uE000/);
});

test("旧版编号代码仍被修复，已有代码内的编号不被再次转换", () => {
  const numbered = `${Array.from({ length: 10 }, (_, index) => index + 1).join("\n")}\nconst demo = 1;`;
  const repaired = render(`示例\n${numbered}`);
  assert.ok(repaired.includes('class="markdown-code-block"'));
  assert.ok(repaired.includes("const demo = 1;"));
  const existingCode = render(`\`\`\`text\n${numbered}\n\`\`\``);
  assert.equal((existingCode.match(/class="markdown-code-line-content"/g) ?? []).length, 11);
  assert.doesNotMatch(existingCode, /```/);
});

test("旧版编号代码修复保留多行模板字符串及其内部缩进", () => {
  const lines = [
    ...Array.from({ length: 10 }, (_, index) => String(index + 1)),
    "function demo() {",
    "const text = `hello",
    "  world`;",
    "const next = `next",
    "value`;",
    "}"
  ];
  for (const newline of ["\n", "\r\n"]) {
    const html = render(lines.join(newline));
    const renderedLines = [...html.matchAll(/<span class="markdown-code-line-content">([\s\S]*?)<\/span>/g)]
      .map((match) => match[1]);
    assert.deepEqual(renderedLines, [
      "function demo() {",
      "  const text = `hello",
      "  world`;",
      "  const next = `next",
      "value`;",
      "}"
    ]);
    assert.doesNotMatch(html, /\uE000|\uE001/);
  }
});

test("保护标记与输入中已有私人字符互不冲突", () => {
  const html = render("已有字符 \uE0000\uE000，与 `[](#demo)` 共存。");
  assert.ok(html.includes("\uE0000\uE000"));
  assert.ok(html.includes("<code>[](#demo)</code>"));
});

test("不完整的锚点或链接清理不吞掉其中的行内代码", () => {
  for (const content of [
    '正文 <a class="headerlink" `[](#demo)`',
    '正文 <a class=`headerlink` href="#anchor"></a>',
    '正文 [](# `code`)',
    '正文 [label](/search/result `code`)'
  ]) {
    const html = render(content);
    assert.match(html, /<code>(?:\[\]\(#demo\)|headerlink|code)<\/code>/);
  }
});

test("代码保护不会把多行示例或无效链接目标误变成链接卡片", () => {
  for (const content of [
    "::links\n# Demo\n- [label `code\n#comment`](https://example.com)\n::",
    "::links\n# Demo\n- [label](`code with spaces`)\n::",
    "## Original Link\n[label](`code with spaces`)"
  ]) {
    const html = render(content);
    assert.ok(html.includes("<code>"));
    assert.doesNotMatch(html, /product-links-section|\uE000|\uE001/);
  }
});
