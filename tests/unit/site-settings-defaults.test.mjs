import assert from "node:assert/strict";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const stub = (body) => `data:text/javascript,${encodeURIComponent(body)}`;
const inlineLogoFallback = "data:image/png;base64,builtin-logo-fixture";
const i18nStub = stub(`
  const make = (p) => ({
    nav: { tools: p + "工具", articles: p + "文章" },
    actions: { submitTool: p + "提交" },
    admin: {
      turnstileRequired: p + "需要验证",
      turnstileServerFailed: p + "验证服务不可用"
    },
    errors: {
      requestFailed: p + "请求失败",
      networkError: p + "网络连接失败",
      unauthorized: p + "未授权",
      forbidden: p + "禁止访问",
      notFound: p + "未找到",
      conflict: p + "冲突",
      rateLimited: p + "请求过多",
      invalidRequest: p + "请求无效",
      serverError: p + "服务器错误"
    },
    home: {
      footerDescription: p + "页脚描述",
      footerProduct: p + "产品",
      footerSupport: p + "支持",
      footerOther: p + "其他",
      footerMore: p + "更多",
      email: p + "邮件",
      countdown: p + "主页",
      blog: p + "博客",
      about: p + "关于",
      privacy: p + "隐私",
      terms: p + "条款",
      titleTop: p + "上",
      titleBottom: p + "下",
      description: p + "描述"
    }
  });
  export const translations = { zh: make("ZH"), en: make("EN") };
`);
const compiledSiteHelpers = await compileTypescriptModule(
  new URL("../../src/site-helpers.ts", import.meta.url),
  {
    importReplacements: {
      "./article-helpers": stub(
        `export function isChineseLocaleText(t) { return t.nav.tools.startsWith("ZH"); }`
      ),
      "./i18n": i18nStub,
      "./legal-content": stub(
        `export function getDefaultLegalMarkdown(kind, locale, siteName) {` +
          ` return "# " + kind + "/" + locale + "/" + siteName; }`
      ),
      "./site-logo-fallback": stub(
        `export const SITE_LOGO_FALLBACK_DATA_URL = ${JSON.stringify(inlineLogoFallback)};`
      )
    }
  }
);
const siteHelpers = await import(`${compiledSiteHelpers.url.href}?site-settings=1`);
const { translations } = await import(i18nStub);
const DEFAULT_FOOTER = siteHelpers.DEFAULT_FOOTER_SETTINGS;
const emptySite = { name: "", subtitle: "", iconUrl: "" };

test("the built-in logo is a visual fallback and never replaces a custom icon", () => {
  assert.equal(siteHelpers.DEFAULT_SITE_SETTINGS.iconUrl, "");
  assert.equal(siteHelpers.DEFAULT_SITE_ICON_URL, "/htools-logo.png");
  assert.equal(
    siteHelpers.getEditableSiteSettings({
      ...emptySite,
      name: "Custom HTools",
      subtitle: "Custom subtitle",
      iconUrl: "https://example.com/custom-logo.png"
    }).iconUrl,
    "https://example.com/custom-logo.png"
  );
});

function createFaviconEnvironment(t) {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const previousImage = Object.getOwnPropertyDescriptor(globalThis, "Image");
  const links = [];
  const images = [];
  globalThis.document = {
    head: {
      querySelector: () => links[0] ?? null,
      appendChild: (link) => links.push(link)
    },
    createElement: () => ({
      dataset: {},
      attributes: new Map(),
      setAttribute(name, value) { this.attributes.set(name, value); },
      removeAttribute(name) { this.attributes.delete(name); delete this[name]; }
    })
  };
  globalThis.Image = class {
    onload = null;
    onerror = null;
    constructor() { images.push(this); }
  };
  t.after(() => {
    for (const [key, descriptor] of [["document", previousDocument], ["Image", previousImage]]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { links, images };
}

test("site icon retry parameters preserve existing query and hash and skip image data", () => {
  const dataUrl = "data:image/png;base64,invalid";
  assert.equal(siteHelpers.isSiteIconDataUrl(`  ${dataUrl}  `), true);
  assert.equal(siteHelpers.isSiteIconDataUrl("https://example.com/logo.png"), false);
  assert.equal(siteHelpers.addSiteIconRetryParam(dataUrl, 123), dataUrl);
  assert.equal(siteHelpers.addSiteIconRetryParam("/htools-logo.png", 123), "/htools-logo.png");
  assert.equal(siteHelpers.addSiteIconRetryParam("https://example.com/logo.png", 0), "https://example.com/logo.png");
  const retried = new URL(siteHelpers.addSiteIconRetryParam("https://example.com/logo.png?a=1#logo", 123));
  assert.equal(retried.searchParams.get("a"), "1");
  assert.equal(retried.searchParams.get("htools_icon_retry"), "123");
  assert.equal(retried.hash, "#logo");
});

test("empty favicon checks the round brand asset and keeps it when it loads", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon("  ");
  assert.equal(links[0].href, "/htools-logo.png");
  assert.equal(images.length, 1);
  assert.equal(images[0].src, "/htools-logo.png");
  images[0].onload();
  assert.equal(links[0].type, "image/png");
  assert.equal(links[0].attributes.get("sizes"), "512x512");
  assert.equal(images[0].onload, null);
  assert.equal(images[0].onerror, null);
  cleanup();
});

test("a successful custom favicon retry displays its actual loaded URL", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon("https://example.com/logo.png?a=1#logo");
  const oldLoad = images[0].onload;
  const oldError = images[0].onerror;
  oldError();
  assert.equal(images.length, 2);
  const retried = new URL(images[1].src);
  assert.equal(retried.searchParams.get("a"), "1");
  assert.ok(retried.searchParams.get("htools_icon_retry"));
  images[1].onload();
  assert.equal(links[0].href, images[1].src);
  oldLoad();
  oldError();
  assert.equal(links[0].href, images[1].src);
  assert.equal(images.length, 2);
  cleanup();
});

test("failed custom favicon retries once before the brand asset and a new icon still takes priority", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon(" https://example.com/broken.png ");
  assert.equal(links[0].href, "https://example.com/broken.png");
  assert.equal(images[0].src, "https://example.com/broken.png");
  images[0].onerror();
  assert.equal(new URL(images[1].src).pathname, "/broken.png");
  images[1].onerror();
  assert.equal(images[2].src, "/htools-logo.png");
  images[2].onload();
  assert.equal(links[0].href, "/htools-logo.png");
  assert.equal(links[0].type, "image/png");
  assert.equal(images.length, 3);
  cleanup();

  const nextCleanup = siteHelpers.syncSiteFavicon("https://example.com/new.png");
  assert.equal(links.length, 1);
  assert.equal(links[0].href, "https://example.com/new.png");
  assert.equal(links[0].type, undefined);
  assert.equal(links[0].attributes.has("sizes"), false);
  images[3].onload();
  assert.equal(links[0].href, "https://example.com/new.png");
  nextCleanup();
});

test("a failed default favicon stops at the embedded brand without looping", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon("");
  const oldError = images[0].onerror;
  const oldLoad = images[0].onload;
  oldError();
  assert.equal(links[0].href, inlineLogoFallback);
  assert.equal(images.length, 1);
  oldLoad();
  oldError();
  assert.equal(links[0].href, inlineLogoFallback);
  assert.equal(images.length, 1);
  cleanup();
});

test("invalid image data skips a retry and falls through the default to the embedded brand", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon("data:image/png;base64,invalid");
  images[0].onerror();
  assert.equal(images[1].src, "/htools-logo.png");
  images[1].onerror();
  assert.equal(links[0].href, inlineLogoFallback);
  assert.equal(images.length, 2);
  cleanup();
});

test("cleanup prevents old favicon load and error callbacks from replacing a newer icon", (t) => {
  const { links, images } = createFaviconEnvironment(t);
  const cleanup = siteHelpers.syncSiteFavicon("https://example.com/old.png");
  images[0].onerror();
  const oldError = images[1].onerror;
  const oldLoad = images[1].onload;
  cleanup();
  assert.equal(images[1].onerror, null);
  assert.equal(images[1].onload, null);
  const nextCleanup = siteHelpers.syncSiteFavicon("data:image/png;base64,new");
  images[2].onload();
  oldError();
  oldLoad();
  assert.equal(links[0].href, "data:image/png;base64,new");
  assert.equal(images.length, 3);
  nextCleanup();
});

function errorWith(fields) {
  return Object.assign(new Error(fields.message ?? "unmapped"), fields);
}

after(async () => {
  await compiledSiteHelpers.cleanup();
});

test("author name, author URL, and copyright can never be overridden by settings", () => {
  const hostile = {
    footer: {
      authorName: "攻击者",
      authorUrl: "https://evil.example.com",
      copyright: "© 伪造版权"
    }
  };

  for (const resolved of [
    siteHelpers.getSiteFooterSettings(hostile),
    siteHelpers.getFooterFormValues(hostile),
    siteHelpers.getEditableSiteSettings({ ...emptySite, ...hostile }).footer
  ]) {
    assert.equal(resolved.authorName, DEFAULT_FOOTER.authorName);
    assert.equal(resolved.authorUrl, DEFAULT_FOOTER.authorUrl);
    assert.equal(resolved.copyright, DEFAULT_FOOTER.copyright);
  }
});

test("footer description falls back for blank and non-string values", () => {
  for (const description of ["", "   ", 123, null, undefined, {}, []]) {
    assert.equal(
      siteHelpers.getSiteFooterSettings({ footer: { description } }).description,
      DEFAULT_FOOTER.description
    );
  }

  assert.equal(
    siteHelpers.getSiteFooterSettings({ footer: { description: "  我的描述  " } })
      .description,
    "我的描述"
  );
});

test("the legacy sponsor URL is rewritten to the current default in any casing", () => {
  for (const sponsorUrl of [
    "",
    "   ",
    "https://www.buymeacoffee.com/",
    "https://www.buymeacoffee.com",
    "HTTPS://WWW.BUYMEACOFFEE.COM/"
  ]) {
    assert.equal(
      siteHelpers.getSiteFooterSettings({ footer: { sponsorUrl } }).sponsorUrl,
      DEFAULT_FOOTER.sponsorUrl
    );
  }

  assert.equal(
    siteHelpers.getSiteFooterSettings({ footer: { sponsorUrl: "https://mine.example.com/x" } })
      .sponsorUrl,
    "https://mine.example.com/x"
  );
});

test("blank sponsor labels, social links, and groups fall back to the defaults", () => {
  for (const sponsorLabel of ["", "   "]) {
    assert.equal(
      siteHelpers.getSiteFooterSettings({ footer: { sponsorLabel } }).sponsorLabel,
      DEFAULT_FOOTER.sponsorLabel
    );
  }
  assert.equal(
    siteHelpers.getSiteFooterSettings({ footer: { sponsorLabel: "赞助" } }).sponsorLabel,
    "赞助"
  );

  assert.equal(
    siteHelpers.getSiteFooterSettings({ footer: { socialLinks: [] } }).socialLinks.length,
    DEFAULT_FOOTER.socialLinks.length
  );
  assert.equal(
    siteHelpers.getSiteFooterSettings({ footer: { groups: [] } }).groups.length,
    DEFAULT_FOOTER.groups.length
  );
  assert.equal(
    siteHelpers.getSiteFooterSettings({}).socialLinks.length,
    DEFAULT_FOOTER.socialLinks.length
  );
  assert.deepEqual(
    siteHelpers.getSiteFooterSettings({
      footer: { socialLinks: [{ label: "X", href: "https://x.example.com" }] }
    }).socialLinks,
    [{ label: "X", href: "https://x.example.com" }]
  );
});

test("retired social link targets are migrated to their current addresses", () => {
  const migrated = siteHelpers.getSiteFooterSettings({
    footer: {
      socialLinks: [
        { label: "Email", href: "mailto:hello@zrf.me" },
        { label: "TG", href: "https://t.me" },
        { label: "TG2", href: "https://t.me/" },
        { label: "Keep", href: "https://keep.example.com" }
      ]
    }
  }).socialLinks;

  assert.equal(migrated[0].href, "mailto:admin@zrf.me");
  assert.equal(migrated[1].href, "https://d.zrf.me/tgq");
  assert.equal(migrated[2].href, "https://d.zrf.me/tgq");
  assert.equal(migrated[3].href, "https://keep.example.com");
});

test("the retired /category route is migrated and only its default label is renamed", () => {
  const links = siteHelpers.getSiteFooterSettings({
    footer: {
      groups: [
        {
          title: "T",
          links: [
            { label: "分类", href: "/category" },
            { label: "Category", href: "/category" },
            { label: "自定义名", href: "/category" }
          ]
        }
      ]
    }
  }).groups[0].links;

  assert.deepEqual(links, [
    { label: "工具", href: "/tools" },
    { label: "Tools", href: "/tools" },
    { label: "自定义名", href: "/tools" }
  ]);
});

test("legal links pointing at the author site become local routes", () => {
  const links = siteHelpers.getSiteFooterSettings({
    footer: {
      groups: [
        {
          title: "T",
          links: [
            { label: "隐私", href: "https://github.com/privacy" },
            { label: "条款", href: "https://github.com/terms/" },
            { label: "外站", href: "https://other.example.com/privacy" }
          ]
        }
      ]
    }
  }).groups[0].links;

  assert.equal(links[0].href, "/privacy");
  assert.equal(links[1].href, "/terms");
  assert.equal(links[2].href, "https://other.example.com/privacy");
});

test("default footer copy is swapped for the active locale, custom copy is not", () => {
  const zhFooter = siteHelpers.getLocalizedFooterSettings({}, translations.zh);
  const enFooter = siteHelpers.getLocalizedFooterSettings({}, translations.en);

  assert.equal(zhFooter.description, translations.zh.home.footerDescription);
  assert.equal(enFooter.description, translations.en.home.footerDescription);
  assert.equal(zhFooter.groups[0].title, translations.zh.home.footerProduct);
  assert.equal(enFooter.groups[0].title, translations.en.home.footerProduct);
  assert.deepEqual(zhFooter.groups[0].links[0], {
    label: translations.zh.nav.tools,
    href: "/tools"
  });

  const custom = siteHelpers.getLocalizedFooterSettings(
    {
      footer: {
        description: "我的描述",
        groups: [{ title: "我的分组", links: [{ label: "L", href: "/x" }] }]
      }
    },
    translations.zh
  );

  assert.equal(custom.description, "我的描述");
  assert.equal(custom.groups[0].title, "我的分组");
});

test("default group detection ignores casing but not ordering", () => {
  const upperCased = DEFAULT_FOOTER.groups.map((group) => ({
    title: group.title.toUpperCase(),
    links: group.links.map((link) => ({
      label: link.label.toUpperCase(),
      href: link.href.toUpperCase()
    }))
  }));
  const reordered = [...DEFAULT_FOOTER.groups].reverse();

  assert.equal(
    siteHelpers.getLocalizedFooterSettings({ footer: { groups: upperCased } }, translations.en)
      .groups[0].title,
    translations.en.home.footerProduct
  );
  assert.equal(
    siteHelpers.getLocalizedFooterSettings({ footer: { groups: reordered } }, translations.en)
      .groups[0].title,
    reordered[0].title
  );
});

test("site name and subtitle fall back when blank, and build the document title", () => {
  assert.equal(siteHelpers.getSiteDisplayName(emptySite), "HTools");
  assert.equal(siteHelpers.getSiteDisplayName({ ...emptySite, name: "   " }), "HTools");
  assert.equal(siteHelpers.getSiteDisplayName({ ...emptySite, name: " 我的站 " }), "我的站");
  assert.equal(siteHelpers.getSiteSubtitle(emptySite), "工具导航站");
  assert.equal(siteHelpers.getSiteSubtitle({ ...emptySite, subtitle: "副标题" }), "副标题");

  assert.equal(siteHelpers.getSiteDocumentTitle(emptySite), "HTools - 工具导航站");
  assert.equal(
    siteHelpers.getSiteDocumentTitle({ ...emptySite, name: "A", subtitle: "B" }),
    "A - B"
  );
  assert.equal(
    siteHelpers.formatPublicDocumentTitle("文章页", emptySite),
    "文章页 · HTools"
  );
  assert.equal(
    siteHelpers.formatPublicDocumentTitle("   ", emptySite),
    "HTools - 工具导航站"
  );
});

test("legal pages fall back to templates that carry the current site name", () => {
  const named = { ...emptySite, name: "我的站" };

  assert.deepEqual(siteHelpers.getLegalContentSettings(named, "privacy"), {
    zh: "# privacy/zh/我的站",
    en: "# privacy/en/我的站"
  });
  assert.deepEqual(siteHelpers.getLegalContentSettings(named, "terms"), {
    zh: "# terms/zh/我的站",
    en: "# terms/en/我的站"
  });
  assert.deepEqual(
    siteHelpers.getLegalContentSettings(
      { ...named, privacyContent: { zh: "自定义隐私", en: "Custom" } },
      "privacy"
    ),
    { zh: "自定义隐私", en: "Custom" }
  );
  assert.deepEqual(
    siteHelpers.getLegalContentSettings(
      { ...named, privacyContent: { zh: "仅中文" } },
      "privacy"
    ),
    { zh: "仅中文", en: "# privacy/en/我的站" }
  );
  assert.deepEqual(
    siteHelpers.getLegalContentSettings(
      { ...named, privacyContent: { zh: "  ", en: "  " } },
      "privacy"
    ),
    { zh: "# privacy/zh/我的站", en: "# privacy/en/我的站" }
  );
});

test("about content still accepts the retired plain-string shape", () => {
  const fromString = siteHelpers.getAboutContentSettings({
    ...emptySite,
    aboutContent: "旧格式纯字符串"
  });

  assert.equal(fromString.zh, "旧格式纯字符串");
  assert.ok(fromString.en.length > 0);
  assert.notEqual(fromString.en, "旧格式纯字符串");

  assert.deepEqual(
    siteHelpers.getAboutContentSettings({
      ...emptySite,
      aboutContent: { zh: "新中文", en: "NewEN" }
    }),
    { zh: "新中文", en: "NewEN" }
  );

  const fromBlank = siteHelpers.getAboutContentSettings({ ...emptySite, aboutContent: "" });
  assert.ok(fromBlank.zh.length > 0);
  assert.ok(fromBlank.en.length > 0);
});

test("home hero copy falls back per field, and malformed shapes become empty strings", () => {
  assert.deepEqual(
    siteHelpers.getLocalizedHomeHeroContent(emptySite, "zh", translations.zh),
    {
      titleTop: translations.zh.home.titleTop,
      titleBottom: translations.zh.home.titleBottom,
      description: translations.zh.home.description
    }
  );
  assert.deepEqual(
    siteHelpers.getLocalizedHomeHeroContent(
      { ...emptySite, homeHero: { zh: { titleTop: "我的上" } } },
      "zh",
      translations.zh
    ),
    {
      titleTop: "我的上",
      titleBottom: translations.zh.home.titleBottom,
      description: translations.zh.home.description
    }
  );
  assert.equal(
    siteHelpers.getLocalizedHomeHeroContent(
      { ...emptySite, homeHero: { zh: { titleTop: "   " } } },
      "zh",
      translations.zh
    ).titleTop,
    translations.zh.home.titleTop
  );
  assert.deepEqual(
    siteHelpers.getHomeHeroSettings({ ...emptySite, homeHero: { zh: "字符串", en: null } }),
    {
      zh: { titleTop: "", titleBottom: "", description: "" },
      en: { titleTop: "", titleBottom: "", description: "" }
    }
  );
});

test("editable settings normalize every section in one pass", () => {
  const editable = siteHelpers.getEditableSiteSettings({
    name: "  ",
    subtitle: "  ",
    iconUrl: "icon.png",
    footer: { authorName: "坏", description: "" }
  });

  assert.equal(editable.name, "HTools");
  assert.equal(editable.subtitle, "工具导航站");
  assert.equal(editable.iconUrl, "icon.png");
  assert.equal(editable.footer.authorName, DEFAULT_FOOTER.authorName);
  assert.equal(editable.footer.description, DEFAULT_FOOTER.description);
  assert.ok(editable.aboutContent.zh && editable.aboutContent.en);
  assert.deepEqual(Object.keys(editable.homeHero), ["zh", "en"]);
});

test("footer JSON is pretty printed with two spaces for the settings editor", () => {
  assert.equal(siteHelpers.formatFooterJson({ a: 1 }), '{\n  "a": 1\n}');
});

test("raw error messages are only trusted from real Error objects", () => {
  assert.equal(siteHelpers.getErrorMessage(new Error("boom")), "boom");
  for (const value of ["plain", {}, null, undefined, 0]) {
    assert.equal(siteHelpers.getErrorMessage(value), "Request failed");
  }
});

test("known error codes map to localized copy and win over HTTP status", () => {
  const zh = translations.zh;

  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "UNAUTHORIZED" }), zh),
    zh.errors.unauthorized
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "VALIDATION_ERROR" }), zh),
    zh.errors.invalidRequest
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "SERVER_ERROR" }), zh),
    zh.errors.serverError
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "NOT_FOUND", status: 500 }), zh),
    zh.errors.notFound
  );
});

test("HTTP status codes provide the fallback mapping when no code is present", () => {
  const zh = translations.zh;

  for (const [status, expected] of [
    [400, zh.errors.invalidRequest],
    [422, zh.errors.invalidRequest],
    [401, zh.errors.unauthorized],
    [403, zh.errors.forbidden],
    [404, zh.errors.notFound],
    [409, zh.errors.conflict],
    [429, zh.errors.rateLimited],
    [500, zh.errors.serverError],
    [503, zh.errors.serverError],
    [418, zh.errors.requestFailed]
  ]) {
    assert.equal(
      siteHelpers.getLocalizedErrorMessage(errorWith({ status }), zh),
      expected
    );
  }
});

test("business error codes and mapped English messages differ per locale", () => {
  for (const [locale, expected] of [
    ["zh", "分类图标容量已满，请恢复部分图标为默认，或简化 SVG 代码。"],
    ["en", "Category icon capacity is full. Restore some icons to default or simplify the SVG code."]
  ]) {
    assert.equal(siteHelpers.getLocalizedErrorMessage(
      errorWith({ code: "CATEGORY_ICONS_CAPACITY", status: 400 }), translations[locale]
    ), expected);
  }
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "INVALID_PASSWORD" }), translations.zh),
    "密码不正确。"
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "INVALID_PASSWORD" }), translations.en),
    "Incorrect password."
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(errorWith({ code: "TURNSTILE_REQUIRED" }), translations.zh),
    translations.zh.admin.turnstileRequired
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(new Error("Unauthorized."), translations.zh),
    "登录已失效，请重新登录。"
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(new Error("Unauthorized."), translations.en),
    "Session expired. Sign in again."
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(
      new Error("GitHub API request failed with status 503"),
      translations.zh
    ),
    "GitHub API 请求失败：503"
  );
});

test("network failures use deployment-neutral public copy", () => {
  for (const message of [
    "Failed to fetch",
    "Network request failed.",
    "NetworkError when attempting to fetch resource.",
    "Load failed"
  ]) {
    assert.equal(
      siteHelpers.getLocalizedErrorMessage(new Error(message), translations.zh),
      translations.zh.errors.networkError
    );
    assert.equal(
      siteHelpers.getLocalizedErrorMessage(new Error(message), translations.en),
      translations.en.errors.networkError
    );
  }
  assert.doesNotMatch(
    siteHelpers.getLocalizedErrorMessage(new Error("Failed to fetch"), translations.zh),
    /本地预览|localhost|127\.0\.0\.1/
  );
});

test("invalid backup errors name the offending record when the API reports one", () => {
  assert.match(
    siteHelpers.getLocalizedErrorMessage(
      errorWith({ code: "BACKUP_DATA_INVALID", recordId: "r-1" }),
      translations.zh
    ),
    /记录 r-1/
  );
  assert.doesNotMatch(
    siteHelpers.getLocalizedErrorMessage(
      errorWith({ code: "BACKUP_DATA_INVALID" }),
      translations.zh
    ),
    /记录/
  );
});

test("unmapped errors use the locale fallback, or an explicit override", () => {
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(new Error("完全未知"), translations.zh),
    translations.zh.errors.requestFailed
  );
  assert.equal(
    siteHelpers.getLocalizedErrorMessage(new Error("完全未知"), translations.zh, "我的兜底"),
    "我的兜底"
  );
});
