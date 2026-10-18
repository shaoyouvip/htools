import assert from "node:assert/strict";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";
import { ESCAPED_ICONFONT_ARROW_SVG, ICONFONT_ARROW_SVG, UNSAFE_CATEGORY_SVGS } from "../fixtures/category-svg.mjs";

const compiled = await compileTypescriptModule(new URL("../../src/category-icon-settings.ts", import.meta.url));
const icons = await import(compiled.url.href);
after(() => compiled.cleanup());

test("分类图标允许列表唯一且全部可归一化，未知图标恢复默认", () => {
  assert.equal(icons.CATEGORY_ICON_NAMES.length, 128);
  assert.equal(new Set(icons.CATEGORY_ICON_NAMES).size, 128);
  for (const value of icons.CATEGORY_ICON_NAMES) {
    assert.deepEqual(icons.normalizeCategoryIcon({ type: "lucide", value }), { type: "lucide", value });
  }
  for (const value of [null, [], "tags", {}, { type: "lucide", value: "unknown" }, { type: "other", value: "tags" }]) {
    assert.equal(icons.normalizeCategoryIcon(value), null);
  }
});

const normalizeSvg = (value) => icons.normalizeCategoryIcon({ type: "svg", value })?.value ?? null;

test("用户原始、转义和代码围栏 SVG 保留两条路径和显式颜色，结果可重复归一化", () => {
  const expected = normalizeSvg(ICONFONT_ARROW_SVG);
  assert.ok(expected);
  for (const source of [ICONFONT_ARROW_SVG, ESCAPED_ICONFONT_ARROW_SVG, `\`\`\`svg\n${ICONFONT_ARROW_SVG}\n\`\`\``, `\`\`\`xml\n${ESCAPED_ICONFONT_ARROW_SVG}\n\`\`\``]) {
    assert.equal(normalizeSvg(source), expected);
  }
  assert.equal(normalizeSvg(expected), expected);
  assert.deepEqual([...expected.matchAll(/ d="([^"]*)"/g)].map((match) => match[1]), [...ICONFONT_ARROW_SVG.matchAll(/ d="([^"]*)"/g)].map((match) => match[1]));
  assert.equal([...expected.matchAll(/fill="#333333"/g)].length, 2);
  assert.match(expected, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(expected, /(?:class|p-id| t)=/);
  assert.doesNotThrow(() => encodeURIComponent(expected));
});

test("静态形状、显式颜色、局部渐变和裁剪保留，绘图 style 转成属性", () => {
  const result = normalizeSvg(`<svg viewBox="0 0 24 24" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>图标 &amp; &#x1f680;</title><desc>&lt;静态&gt;</desc>
    <defs><linearGradient id="paint"><stop offset="0" stop-color="#ff0000"/><stop offset="100%" style="stop-color:rgb(0, 0, 255);stop-opacity:0.5"/></linearGradient>
    <linearGradient id="second" xlink:href="#paint"/><clipPath id="clip"><rect width="24" height="24" rx="2"/></clipPath></defs>
    <g transform="translate(1 1) scale(0.9)" clip-path="url(#clip)"><path fill="none" style="fill:#ff0000;stroke:currentColor;stroke-width:2 !important" d="M0 0 L24 24"/>
    <circle cx="12" cy="12" r="4" fill="url('#paint')"/><ellipse cx="4" cy="4" rx="2" ry="1"/><line x1="0" y1="0" x2="24" y2="24"/>
    <polyline points="0 0,12 12,24 0"/><polygon points="0 0,12 12,24 0"/></g></svg>`);
  assert.ok(result);
  for (const attribute of ['fill="#ff0000"', 'stroke="currentColor"', 'stroke-width="2"']) assert.ok(result.includes(attribute));
  assert.match(result, /href="#paint"/);
  assert.match(result, /clip-path="url\(#clip\)"/);
  assert.match(result, /<title>图标 &amp; 🚀<\/title>/);
  assert.doesNotMatch(result, /style=|xmlns:xlink|xlink:href/);
  assert.equal(normalizeSvg(result), result);
});

test("活动内容、外部资源、实体混淆、非法 XML 和重复属性均拒绝", () => {
  const invalid = [
    ...UNSAFE_CATEGORY_SVGS, '<svg><path fill="url(&#104;ttps://example.com/x)"/></svg>',
    '<svg><defs><linearGradient href="&#106;avascript:alert(1)"/></defs></svg>',
    '<svg style="background:url(https://example.com/x)"/>', '<svg><text>内容</text></svg>',
    '<svg><path d="M0 0" d="M1 1"/></svg>', '<svg><path d="M0 0"d="M1 1"/></svg>',
    '<svg><path d=M0/></svg>', '<svg><path></svg>', '<svg>', '<svg/><svg/>', '<svg><svg/></svg>',
    '<svg><title><path/></title></svg>', '<svg><title>&unknown;</title></svg>', '<svg><title>&#0;</title></svg>',
    '<svg><title>&#xD800;</title></svg>', '<svg><title>&#x110000;</title></svg>', '<svg><title>&#xFFFF;</title></svg>',
    '<?xml-stylesheet href="https://example.com/x"?><svg/>', '<svg><!-- bad -- comment --></svg>',
    '<svg xmlns="https://example.com/other"/>', '<svg><path href="#local"/></svg>',
    '<svg><defs><linearGradient href="#x" xlink:href="#y"/></defs></svg>',
    '<svg><path style="fill:expression(alert(1))"/></svg>', '<svg><title>\uD800</title></svg>', '<svg><desc>\uDC00</desc></svg>'
  ];
  for (const source of invalid) assert.equal(normalizeSvg(source), null, source.slice(0, 160));
});

test("SVG 限制节点数、嵌套层数和 UTF-8 字节，边界内输出可编码", () => {
  assert.ok(normalizeSvg(`<svg>${"<g>".repeat(15)}${"</g>".repeat(15)}</svg>`));
  assert.equal(normalizeSvg(`<svg>${"<g>".repeat(16)}${"</g>".repeat(16)}</svg>`), null);
  assert.ok(normalizeSvg(`<svg>${"<path/>".repeat(255)}</svg>`));
  assert.equal(normalizeSvg(`<svg>${"<path/>".repeat(256)}</svg>`), null);
  const prefix = '<svg xmlns="http://www.w3.org/2000/svg"><title>';
  const suffix = '</title></svg>';
  const budget = icons.MAX_CATEGORY_SVG_LENGTH - Buffer.byteLength(prefix + suffix);
  const exact = prefix + "图".repeat(Math.floor(budget / 3)) + "a".repeat(budget % 3) + suffix;
  assert.equal(Buffer.byteLength(exact), icons.MAX_CATEGORY_SVG_LENGTH);
  assert.equal(normalizeSvg(exact), exact);
  assert.equal(normalizeSvg(exact.replace('</title>', 'a</title>')), null);
  assert.equal(normalizeSvg(`<svg><title>${"图".repeat(12000)}</title></svg>`), null);
  assert.equal(normalizeSvg(`<svg><title>${"a".repeat(icons.MAX_CATEGORY_SVG_LENGTH - 27)}</title></svg>`), null);
  assert.ok(normalizeSvg('<svg><title>🚀</title></svg>'));
});

test("图片图标只接受无凭据的 HTTP(S) 地址，并限制长度和控制字符", () => {
  for (const value of [" https://example.com/icon.png ", "http://example.com/a b.png"]) {
    assert.deepEqual(icons.normalizeCategoryIcon({ type: "image", value }), { type: "image", value: new URL(value.trim()).href });
  }
  for (const value of ["javascript:alert(1)", "data:image/svg+xml,<svg/>", "file:///a", "//example.com/a", "/icon.svg", "https://user:secret@example.com/a", "https://example.com/a\nb", `https://example.com/${"a".repeat(2048)}`]) {
    assert.equal(icons.normalizeCategoryIcon({ type: "image", value }), null, value);
  }
});

test("默认分类、危险键与继承属性不进入图标设置", () => {
  for (const value of ["All", "ALL", "全部", "Featured", "精选", "__admin_featured__", "__telegram_tool__", "__telegram_article__", "__telegram_content__", "__proto__", "constructor", "prototype", "", "A\u0000B", "  A ", "a".repeat(49)]) {
    assert.equal(icons.isEditableCategoryIconCategory(value), false, value);
  }
  const injected = JSON.parse('{"tools":{"__proto__":{"type":"lucide","value":"tags"},"constructor":{"type":"lucide","value":"folder"},"正常":{"type":"lucide","value":"code"}},"__proto__":{"polluted":true}}');
  assert.deepEqual(icons.normalizeCategoryIconSettings(injected), { tools: { 正常: { type: "lucide", value: "code" } }, articles: {}, push: {}, content: {} });
  assert.equal({}.polluted, undefined);
  assert.deepEqual(icons.normalizeCategoryIconSettings(Object.create({ tools: { inherited: { type: "lucide", value: "tags" } } })), icons.createEmptyCategoryIconSettings());
  assert.equal(icons.normalizeCategoryIcon(Object.create({ type: "lucide", value: "tags" })), null);
});

test("每个分区独立保留有效图标，未知分区和无效条目丢弃", () => {
  const settings = icons.normalizeCategoryIconSettings({
    tools: Object.fromEntries(Array.from({ length: 125 }, (_, index) => [`分类${index}`, { type: "lucide", value: "tags" }])),
    articles: { 文章: { type: "image", value: "https://example.com/icon.svg" }, 坏图: { type: "image", value: "data:x" } },
    push: [], content: null, unknown: { 无效: { type: "lucide", value: "rss" } }
  });
  assert.equal(Object.keys(settings.tools).length, icons.MAX_CATEGORY_ICONS_PER_SCOPE);
  assert.deepEqual(settings.articles, { 文章: { type: "image", value: "https://example.com/icon.svg" } });
  assert.deepEqual(settings.push, {});
  assert.deepEqual(settings.content, {});
  assert.equal(Object.hasOwn(settings, "unknown"), false);
  const first = icons.createEmptyCategoryIconSettings();
  first.tools.test = { type: "lucide", value: "tags" };
  assert.deepEqual(icons.createEmptyCategoryIconSettings().tools, {});
});
