import assert from "node:assert/strict";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const stub = (body) => `data:text/javascript,${encodeURIComponent(body)}`;
const i18nStub = stub(
  `export const translations = { zh: { __locale: "zh" }, en: { __locale: "en" } };`
);
const compiledArticleHelpers = await compileTypescriptModule(
  new URL("../../src/article-helpers.ts", import.meta.url),
  {
    importReplacements: {
      "lucide-react": stub(
        `export const BadgeCheck=1,BarChart3=1,Boxes=1,BrainCircuit=1,Code2=1,` +
          `Database=1,FileImage=1,FileText=1,Globe2=1,LayoutDashboard=1,Link2=1,` +
          `Mail=1,PackagePlus=1,Rss=1,Server=1,Sparkles=1,Star=1,Tags=1,Wrench=1;`
      ),
      "./admin-field-examples": stub(
        `export const ADMIN_RESOURCE_FIELD_EXAMPLES = { zh: {}, en: {} };`
      ),
      "./i18n": i18nStub,
      "./admin-helpers": stub(`export const ADMIN_FEATURED_CATEGORY = "Featured";`)
    }
  }
);
const articleHelpers = await import(
  `${compiledArticleHelpers.url.href}?article-text=1`
);
const { translations } = await import(i18nStub);
const clean = articleHelpers.cleanArticleDisplayText;

after(async () => {
  await compiledArticleHelpers.cleanup();
});

test("display text decodes the HTML entities feeds actually emit", () => {
  assert.equal(clean("a&nbsp;b"), "a b");
  assert.equal(clean("a&amp;b"), "a&b");
  assert.equal(clean("&quot;q&quot;"), '"q"');
  assert.equal(clean("it&#39;s"), "it's");
  assert.equal(clean("&#65;&#66;"), "AB");
  assert.equal(clean("&#x41;&#x42;"), "AB");
  assert.equal(clean("&AMP;"), "&");
});

test("out-of-range numeric entities are dropped instead of throwing", () => {
  assert.equal(clean("&#999999999;"), "");
  assert.equal(clean("&#x110000;"), "");
  assert.equal(clean("&nbsp"), "&nbsp");
  assert.equal(clean("&#;"), "&#;");
});

test("decoded entities are re-processed as markup, so &lt;div&gt; disappears", () => {
  assert.equal(clean("&lt;div&gt;"), "");
  assert.equal(clean("&lt;p&gt;文本&lt;/p&gt;"), "文本");
});

test("script and style blocks are removed with their contents", () => {
  assert.equal(clean("<script>alert(1)</script>a"), "a");
  assert.equal(clean("<SCRIPT>alert(1)</SCRIPT>a"), "a");
  assert.equal(clean("<style>.x{}</style>b"), "b");
  assert.equal(clean("<script>a</script>mid<script>b</script>end"), "mid end");
  assert.equal(clean("<script>x"), "x");
});

test("heading anchor links are removed in both closed and truncated forms", () => {
  assert.equal(clean('<a class="headerlink" href="#h"></a>标题'), "标题");
  assert.equal(clean('<a href="#top"></a>标题'), "标题");
  assert.equal(clean('标题<a class="headerlink" href="#h"'), "标题");
  assert.equal(clean("[](#anchor)标题"), "标题");
  assert.equal(
    clean('<h2 id="t">标题<a class="headerlink" href="#t" title="标题"></a></h2>'),
    "标题"
  );
});

test("markdown links and images collapse to their visible text", () => {
  assert.equal(clean("![alt](img.png)"), "alt");
  assert.equal(clean("![](img.png)"), "");
  assert.equal(clean("![a](u(1).png)"), "a");
  assert.equal(clean("[text](http://x.com)"), "text");
  assert.equal(clean("[text](http://x.com/a(1))"), "text");
  assert.equal(clean("[![alt](i.png)](http://x.com)"), "alt");
  assert.equal(clean("`code`"), "code");
  assert.equal(clean("`a` 和 `b`"), "a 和 b");
  assert.equal(clean("`abc"), "`abc");
});

test("leading headings are stripped but mid-text hashes survive", () => {
  assert.equal(clean("## 标题"), "标题");
  assert.equal(clean("###### 六级"), "六级");
  assert.equal(clean("正文 ## 中间"), "正文 ## 中间");
});

test("emphasis marks are removed everywhere, including inside identifiers", () => {
  assert.equal(clean("**粗体**"), "粗体");
  assert.equal(clean("_斜体_"), "斜体");
  assert.equal(clean("~~删除~~"), "删除");
  assert.equal(clean("<b>*粗*</b>"), "粗");
  assert.equal(clean("snake_case_name"), "snakecasename");
  assert.equal(clean("MAX_SAFE_INTEGER"), "MAXSAFEINTEGER");
  assert.equal(clean("__dirname"), "dirname");
  assert.equal(clean("2 * 3 = 6"), "2 3 = 6");
});

test("remaining tags become spaces and decorative crosses are dropped", () => {
  assert.equal(clean("<div><p>文本</p></div>"), "文本");
  assert.equal(clean("<p>段落一</p>\n<p>段落二</p>"), "段落一 段落二");
  assert.equal(clean("a<br>b"), "a b");
  assert.equal(clean("<!-- c -->文本"), "文本");
  assert.equal(clean("文本 × 后"), "文本 后");
  assert.equal(clean("✕ 文本"), "文本");
  assert.equal(clean("文本 ✖"), "文本");
});

test("attribute values containing a bare > leak, so callers must pre-sanitize", () => {
  assert.equal(clean('<a title="a>b">x</a>'), 'b">x');
  assert.equal(clean('<div data-x="1>2">正文</div>'), '2">正文');
  assert.equal(clean('<a href="http://x.com" title="标题">文本</a>'), "文本");
});

test("fenced code blocks are not markup, so their fences partly remain", () => {
  assert.equal(clean("```js\ncode\n```"), "``js code ``");
  assert.equal(clean("````code````"), "```code```");
  assert.equal(clean("~~~\ncode\n~~~"), "code");
});

test("trailing channel hashtags are removed only when two or more appear", () => {
  assert.equal(clean("正文 #标签A #标签B"), "正文");
  assert.equal(clean("正文 #A #B #C"), "正文");
  assert.equal(clean("正文 #a_b #c_d"), "正文");
  assert.equal(clean("正文 #a-b #c-d"), "正文");
  assert.equal(clean("正文 #A#B"), "正文");
  assert.equal(clean("正文 #A #B 频道 | 聊天"), "正文");
  assert.equal(clean("正文 #A #B 频道｜聊天"), "正文");
  assert.equal(
    clean("内容内容\n\n#Cloudflare #Worker\n频道 | 聊天"),
    "内容内容"
  );
});

test("a single trailing hashtag, mid-text hashtags, and trailing punctuation stay", () => {
  assert.equal(clean("正文 #标签A"), "正文 #标签A");
  assert.equal(clean("#A #B 正文在后"), "#A #B 正文在后");
  assert.equal(clean("正文 #A #B。"), "正文 #A #B。");
  assert.equal(clean("#A #B"), "#A #B");
});

test("whitespace of every kind collapses to single spaces and trims", () => {
  assert.equal(clean("a    b"), "a b");
  assert.equal(clean("a\nb"), "a b");
  assert.equal(clean("a\tb"), "a b");
  assert.equal(clean("   a   "), "a");
  assert.equal(clean(""), "");
  assert.equal(clean("   "), "");
});

test("real feed payloads reduce to plain summary text", () => {
  assert.equal(
    clean("![](https://a.com/1.png)\n这是摘要正文。"),
    "这是摘要正文。"
  );
  assert.equal(
    clean("<p>介绍 <a href=\"http://x.com\">链接</a> 结尾</p>"),
    "介绍 链接 结尾"
  );
});

test("display titles prefer the title, then the summary, then a fallback", () => {
  const title = articleHelpers.getArticleDisplayTitle;

  assert.equal(title({ title: "我的标题", summary: "摘要", content: "正文" }), "我的标题");
  assert.equal(title({ title: "", summary: "摘要文本", content: "" }), "摘要文本");
  assert.equal(title({ title: "", summary: "", content: "" }), "Untitled");
  assert.equal(title({ title: "## 带井号", summary: "", content: "" }), "带井号");
});

test("an empty title is derived from the first meaningful content line", () => {
  const title = articleHelpers.getArticleDisplayTitle;

  assert.equal(
    title({ title: "", summary: "", content: "# 从正文提取\n后续" }),
    "从正文提取"
  );
  assert.equal(
    title({ title: "", summary: "", content: "**粗体标题**\n后续" }),
    "粗体标题"
  );
  assert.equal(
    title({ title: "", summary: "", content: "×\n真正标题" }),
    "真正标题"
  );
  assert.equal(
    title({ title: "", summary: "", content: "![](a.png)\n真正标题" }),
    "真正标题"
  );
  assert.equal(
    title({ title: "", summary: "", content: "[![](a.png)](http://x)\n真正标题" }),
    "真正标题"
  );
});

test("derived titles split on known field labels so metadata is not part of the title", () => {
  assert.equal(
    articleHelpers.getArticleDisplayTitle({
      title: "",
      summary: "",
      content: "节点名称 流量：100G"
    }),
    "节点名称"
  );
});

test("over-long titles are truncated with an ellipsis at 140 characters", () => {
  const derived = articleHelpers.getArticleDisplayTitle({
    title: "字".repeat(200),
    summary: "",
    content: ""
  });

  assert.equal(derived.length, 143);
  assert.ok(derived.endsWith("..."));
  assert.equal(derived.slice(0, 140), "字".repeat(140));
});

test("markdown image URLs shed their wrapping brackets and quotes", () => {
  const normalize = articleHelpers.normalizeMarkdownImageUrl;

  assert.equal(normalize("  a.png  "), "a.png");
  assert.equal(normalize("<a.png>"), "a.png");
  assert.equal(normalize("'a.png'"), "a.png");
  assert.equal(normalize('"a.png"'), "a.png");
  assert.equal(normalize("<'a.png'>"), "a.png");
  assert.equal(normalize("<>"), "");
  assert.equal(normalize(""), "");
});

test("正文只移除完全重复的开头标题与封面", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;

  assert.equal(strip("# 标题\n正文", "标题"), "正文");
  assert.equal(strip("![](c.png)\n\n正文", "T", "c.png"), "正文");
  assert.equal(strip("![](<c.png>)\n\n正文", "T", "c.png"), "正文");
  assert.equal(strip("×\n\n# 标题\n\n正文", "标题"), "正文");
  assert.equal(strip("正文开始", "标题"), "正文开始");
});

test("普通段落与引用即使和标题相同也完整保留", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;
  for (const content of [
    "标题文本内容够长\n\n后续正文",
    "标题文本内容够长\n后续正文",
    "> 标题文本内容够长\n> 引用续行包含 [链接](https://example.com)。\n\n后续正文"
  ]) {
    assert.equal(strip(content, "标题文本内容够长"), content);
  }
});

test("重复标题兼容合法 ATX 结尾井号和 Windows 换行", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;
  for (const [heading, title] of [
    ["# Article #", "Article"],
    ["## Read docs ##  ", "Read docs"],
    ["### Article\t###\t", "Article"],
    ["# C# #", "C#"],
    ["# C++ ##", "C++"]
  ]) {
    for (const newline of ["\n", "\r\n"]) {
      assert.equal(strip(`${heading}${newline}${newline}Body`, title), "Body");
    }
  }
});

test("不把标题中的字面井号或不同的代码符号当成结束标记", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;
  for (const [heading, title] of [
    ["# Article#", "Article"],
    ["# Article \\#", "Article"],
    ["# Article \\###", "Article"],
    ["# Article # text", "Article"],
    ["# C# #", "C"],
    ["# C++ ##", "C"]
  ]) {
    const content = `${heading}\n\nBody`;
    assert.equal(strip(content, title), content);
  }
});

test("部分相似或符号不同的标题不会被误删", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;
  for (const [heading, title] of [
    ["这是一个足够长的文章标题以及补充说明", "这是一个足够长的文章标题"],
    ["C++", "C"],
    ["v1.0", "v10"]
  ]) {
    const content = `# ${heading}\n\n正文`;
    assert.equal(strip(content, title), content);
  }
});

test("non-cover leading images are preserved and split across lines are rejoined", () => {
  const strip = articleHelpers.stripLeadingArticleDuplicates;

  assert.equal(strip("![](x.png)\n\n正文", "T", "c.png"), "![](x.png)\n\n正文");
  assert.equal(strip("![](x.png)\n\n正文", "T"), "![](x.png)\n\n正文");
  assert.equal(
    strip("[\n![](a.png)\n](http://x)\n\n正文", "T"),
    "[![](a.png)](http://x)\n\n正文"
  );
});

test("正文摘录只隐藏简介，多段正文与长段末尾保持完整", () => {
  const paragraphs = [
    "之前一直在用 lemon-live，后来它不能用了，找了一圈也没找到特别顺手的替代品，索性就自己做了这个网页直播聚合站。",
    "客户端和 PC 端其实都有不少现成开源项目，也支持这些平台。但我不想为了看一个直播，把各种客户端、软件一个个装上去，只想用网页版，打开浏览器就能看，点开即用最省事。这也是我做这个网页版的主要原因。",
    "其实我要的很简单，就是安安静静看个直播，弹幕也不想发。".repeat(5)
  ];
  const longParagraph = "这是正文的一部分，需要完整保留，不能因为摘要重复就裁掉。".repeat(12) + "关键结尾必须保留";
  for (const content of [paragraphs.join("\n\n"), `${longParagraph}\n\n后续正文`]) {
    const summary = clean(content).slice(0, 260);
    const body = articleHelpers.stripLeadingArticleDuplicates(content, "文章标题");
    assert.equal(body, content);
    assert.equal(articleHelpers.getArticleDisplaySummary(summary, body), "");
  }
});

test("独立简介、正文不完整与仅在正文中间匹配时保留简介", () => {
  for (const [summary, content] of [
    ["这是一段独立简介", "正文讲述具体步骤"],
    ["共同开头，以及只有简介中才有的信息", "共同开头"],
    ["第二段相同内容", "第一段其他内容。\n\n第二段相同内容"],
    ["C 与 C++ 的区别", "C与C的区别及使用方法"],
    ["独立简介", ""]
  ]) {
    assert.equal(articleHelpers.getArticleDisplaySummary(summary, content), summary);
  }
  assert.equal(articleHelpers.getArticleDisplaySummary("", "正文"), "");
});

test("简介比较保留英文词间边界", () => {
  for (const [summary, content] of [
    ["We need a part.", "We need apart."],
    ["We are now here.", "We are nowhere."],
    ["We need apart.", "We need a part."],
    ["Version 1 2 is ready.", "Version 12 is ready."]
  ]) {
    assert.equal(articleHelpers.getArticleDisplaySummary(summary, content), summary);
  }
});

test("简介比较兼容排版空白但不清理正文代码字面量", () => {
  for (const [summary, content] of [
    ["We need a part.", "We\nneed\ta   part.\nMore details."],
    ["第一段。第二段介绍工具。", "第一段。\n\n第二段介绍\n工具。"]
  ]) {
    assert.equal(articleHelpers.getArticleDisplaySummary(summary, content), "");
  }
  for (const [summary, content] of [
    ["Read docs.", "Read [docs][d]."],
    ["Read docs.", "Read <tag>docs</tag>."],
    ["Use xy.", "Use x_y."],
    ["First item.", "* First item."]
  ]) {
    assert.equal(articleHelpers.getArticleDisplaySummary(summary, content), summary);
  }
});

test("Chinese locale detection compares object identity, not content", () => {
  assert.equal(articleHelpers.isChineseLocaleText(translations.zh), true);
  assert.equal(articleHelpers.isChineseLocaleText(translations.en), false);
  assert.equal(articleHelpers.isChineseLocaleText({ __locale: "zh" }), false);
});
