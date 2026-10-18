import { isChineseLocaleText } from "./article-helpers";
import { translations, type Locale, type Messages } from "./i18n";
import { getDefaultLegalMarkdown, type LegalPageKind } from "./legal-content";
import { SITE_LOGO_FALLBACK_DATA_URL } from "./site-logo-fallback";
import type {
  FooterLink,
  FooterLinkGroup,
  FooterSettings,
  HomeHeroContent,
  HomeHeroSettings,
  LocalizedLegalContent,
  LocalizedMarkdownContent,
  SiteSettings
} from "./types";

export const DEFAULT_SITE_ICON_URL = "/htools-logo.png";

const DEFAULT_FAVICON_LINKS: {
  key: string;
  href: string;
  sizes?: string;
  type?: string;
}[] = [
  {
    key: "ico",
    href: DEFAULT_SITE_ICON_URL,
    sizes: "512x512",
    type: "image/png"
  }
];

const SITE_ICON_UPLOAD_MAX_BYTES = 1024 * 1024;
const SITE_ICON_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon"
]);
const SITE_ICON_EXTENSION_TYPES: Record<string, string> = {
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};
const DEFAULT_ABOUT_CONTENT = `# 关于我

大家好，我是**周润发**（网名），也是 [blog.zrf.me](https://blog.zrf.me/) 的博主。

一直以来我就一个爱好：作为一枚小白，致力于折腾并 **收录各种开源、好用的互联网项目** 。分享实用资源嘛，好用就完事了！

但在写博客的过程中，我遇到个痛点：网上好玩的工具实在太多了，但并不是每个项目都适合正儿八经地水一篇长博文。有些小工具明明极其优秀，却因为体量小，找不到合适的渠道去展示和分享，最后只能默默躺在我的收藏夹里吃灰。

### 一直想做这样一个工具导航站，所以，**HTools** 诞生了。

把这些宝藏项目全收录进去。市面上类似的能使用 “赛博大善人” cloudflare 部署，且适合我用于收集的开源导航程序我翻了个底朝天，说实话，UI 外观没几个长在我的审美上的。

但我自己又没啥建站和前端技术，怎么办？**遇事不决，AI 解决！**

我直接“天才程序员上线”，至于 UI 嘛，全靠“抄”也确实是抄，然后加上我自己的想法构思。一通折腾下来，居然真的实现了！现在这个项目的基本使用体验，已经和我脑海中完美的工具站一模一样了。为了方便大家自己部署，我还给项目设置了非常多的自定义选项。

当然，毕竟代码是靠 AI 搓出来的，如果哪位开发大佬路过，愿意提交 PR 来帮我进一步完善优化这个项目，那就再好不过了（抱大腿）。

---

我希望 HTools 不是一个冷冰冰的链接列表，而是一个能持续沉淀好东西的小仓库。看到不错的项目，就顺手放进来；哪天真要用，也不用再翻聊天记录、收藏夹和浏览器历史。

这里更适合收录这些内容：

- **开源项目** - 有意思、能部署、值得研究的仓库
- **在线工具** - 打开就能用，解决一个具体问题
- **部署方案** - 适合 Cloudflare、轻量服务器、自建环境的实践
- **效率资源** - 能省时间、少踩坑、让工作流更顺手的小东西

当然，这些是我感兴趣的内容，如果你也发现了好用的工具和感兴趣的内容，欢迎通过网站提交给我。只要它确实有用、介绍清楚、链接可靠，我都会认真看看。这个项目本身也会继续更新，目标很简单：把零散的好项目收拾得更清楚，让需要的人更快找到。

**如果 HTools 对你有帮助，也欢迎给项目点个 Star：[shaoyouvip/htools](https://github.com/shaoyouvip/htools)**

慢慢收集，慢慢打磨。能帮到一个人，就不算白折腾。

::links
## 产品链接

- [作者](https://github.com/shaoyouvip/)
- [主页](https://zrf.me/)
- [博客](https://blog.zrf.me/)
- [Github](https://github.com/shaoyouvip/htools)
- [Telegram](https://d.zrf.me/tgq)
::`;
const DEFAULT_ABOUT_CONTENT_EN = `# About Me

Hi! I am an indie developer who built HTools after spending too much time looking for useful tools and projects.

You may have run into the same problem: a good idea is ready to go, but choosing frameworks, finding resources, and comparing services can take longer than expected. HTools keeps worthwhile projects in one place so they are easier to find again.

## What is HTools?

HTools is a practical toolbox and a growing directory of useful internet projects. It focuses on:

- **Open-source projects** - repositories worth deploying, studying, or extending
- **Online tools** - focused tools that solve a concrete problem
- **Deployment solutions** - practical options for Cloudflare, lightweight servers, and self-hosted environments
- **Productivity resources** - useful resources that save time and reduce repeated work

If you discover a useful project, you are welcome to submit it through the site. Clear descriptions and reliable links make review easier. HTools will continue to organize scattered projects so people can find what they need more quickly.

**If HTools helps you, you are welcome to star the project: [shaoyouvip/htools](https://github.com/shaoyouvip/htools)**

::links
## Product Links

- [Author](https://github.com/shaoyouvip/)
- [Homepage](https://zrf.me/)
- [Blog](https://blog.zrf.me/)
- [Github](https://github.com/shaoyouvip/htools)
- [Telegram](https://d.zrf.me/tgq)
::`;
const LEGACY_DEFAULT_FOOTER_DESCRIPTION =
  "\u63a2\u7d22\u7cbe\u9009\u5de5\u5177\u548c\u8d44\u6e90\uff0c\u52a0\u901f\u60a8\u7684\u72ec\u7acb\u5f00\u53d1\u4e4b\u65c5";
const PREVIOUS_DEFAULT_FOOTER_DESCRIPTION =
  "\u6536\u5f55\u5404\u79cd\u5f00\u6e90\u3001\u597d\u7528\u7684\u4e92\u8054\u7f51\u9879\u76ee";
const TEMP_DEFAULT_FOOTER_DESCRIPTION =
  "\u6574\u7406\u5f00\u6e90\u9879\u76ee\u4e0e\u5b9e\u7528\u5de5\u5177";
const DEFAULT_FOOTER_DESCRIPTION =
  "\u81f4\u529b\u4e8e\u6536\u5f55\u5404\u79cd\u5f00\u6e90\u3001\u597d\u7528\u7684\u4e92\u8054\u7f51\u9879\u76ee";
const FOOTER_PROJECT_URL = "https://github.com/shaoyouvip/htools";
const LEGACY_DEFAULT_SPONSOR_URL = "https://www.buymeacoffee.com/";
const LEGACY_DEFAULT_AUTHOR_URL = "https://zrf.me/";
const LEGACY_DEFAULT_FOOTER_MORE_TITLE = "\u66f4\u591a\u7684";
const DEFAULT_SPONSOR_URL = "https://example.com";
export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  description: DEFAULT_FOOTER_DESCRIPTION,
  authorName: "HTools",
  authorUrl: FOOTER_PROJECT_URL,
  copyright: "\u00a9 2026 HTools \u7248\u6743\u6240\u6709\uff0c\u4fdd\u7559\u6240\u6709\u6743\u5229\u3002",
  sponsorLabel: "Buy me a coffee",
  sponsorUrl: DEFAULT_SPONSOR_URL,
  socialLinks: [
    { label: "GitHub", href: "https://github.com/shaoyouvip/htools" },
    { label: "Email", href: "mailto:admin@zrf.me" },
    { label: "Telegram", href: "https://d.zrf.me/tgq" }
  ],
  groups: [
    {
      title: "\u4ea7\u54c1",
      links: [
        { label: "\u5de5\u5177", href: "/tools" },
        { label: "\u6587\u7ae0", href: "/articles" },
        { label: "\u63d0\u4ea4\u5de5\u5177", href: "/submit" }
      ]
    },
    {
      title: "\u652f\u6301",
      links: [
        { label: "\u7535\u5b50\u90ae\u4ef6", href: "mailto:admin@zrf.me" },
        { label: "GitHub", href: "https://github.com/shaoyouvip/htools" },
        { label: "Telegram", href: "https://d.zrf.me/tgq" }
      ]
    },
    {
      title: "\u5176\u4ed6",
      links: [
        { label: "\u4e3b\u9875", href: "https://zrf.me/" },
        { label: "\u535a\u5ba2", href: "https://blog.zrf.me" }
      ]
    },
    {
      title: "\u66f4\u591a",
      links: [
        { label: "\u5173\u4e8e\u6211\u4eec", href: "/about" },
        { label: "\u9690\u79c1\u653f\u7b56", href: "/privacy" },
        { label: "\u670d\u52a1\u6761\u6b3e", href: "/terms" }
      ]
    }
  ]
};
const DEFAULT_FOOTER_GROUP_SIGNATURES = new Set(
  [
    DEFAULT_FOOTER_SETTINGS.groups,
    getLegacyDefaultFooterGroups(),
    getLocalizedDefaultFooterGroups(translations.zh),
    getLocalizedDefaultFooterGroups(translations.en)
  ].map(createFooterGroupSignature)
);
export const DEFAULT_HOME_HERO_SETTINGS: HomeHeroSettings = {
  zh: {
    titleTop: "",
    titleBottom: "",
    description: ""
  },
  en: {
    titleTop: "",
    titleBottom: "",
    description: ""
  }
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: "HTools",
  subtitle: "\u5de5\u5177\u5bfc\u822a\u7ad9",
  iconUrl: "",
  aboutContent: {
    zh: DEFAULT_ABOUT_CONTENT,
    en: DEFAULT_ABOUT_CONTENT_EN
  },
  privacyContent: {
    zh: getDefaultLegalMarkdown("privacy", "zh", "HTools"),
    en: getDefaultLegalMarkdown("privacy", "en", "HTools")
  },
  termsContent: {
    zh: getDefaultLegalMarkdown("terms", "zh", "HTools"),
    en: getDefaultLegalMarkdown("terms", "en", "HTools")
  },
  footer: DEFAULT_FOOTER_SETTINGS,
  homeHero: DEFAULT_HOME_HERO_SETTINGS
};
export function getSiteDisplayName(settings: SiteSettings) {
  return settings.name.trim() || DEFAULT_SITE_SETTINGS.name;
}

export function getSiteSubtitle(settings: SiteSettings) {
  return settings.subtitle.trim() || DEFAULT_SITE_SETTINGS.subtitle;
}

export function getLegalContentSettings(
  settings: SiteSettings,
  kind: LegalPageKind
): LocalizedLegalContent {
  const configured = kind === "privacy"
    ? settings.privacyContent
    : settings.termsContent;
  const siteName = getSiteDisplayName(settings);

  return {
    zh: configured?.zh?.trim() || getDefaultLegalMarkdown(kind, "zh", siteName),
    en: configured?.en?.trim() || getDefaultLegalMarkdown(kind, "en", siteName)
  };
}

export function getAboutContentSettings(
  settings: SiteSettings
): LocalizedMarkdownContent {
  const configured = settings.aboutContent as LocalizedMarkdownContent | string | undefined;

  if (typeof configured === "string") {
    return {
      zh: configured.trim() || DEFAULT_ABOUT_CONTENT,
      en: DEFAULT_ABOUT_CONTENT_EN
    };
  }

  return {
    zh: configured?.zh?.trim() || DEFAULT_ABOUT_CONTENT,
    en: configured?.en?.trim() || DEFAULT_ABOUT_CONTENT_EN
  };
}

export function getSiteDocumentTitle(settings: SiteSettings) {
  const name = getSiteDisplayName(settings);
  const subtitle = getSiteSubtitle(settings);

  return subtitle ? `${name} - ${subtitle}` : name;
}

export type StructuredData = Record<string, unknown>;

export type DocumentMetadata = {
  title: string;
  description: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  robots?: string;
  structuredData?: StructuredData | null;
};

export function formatPublicDocumentTitle(
  pageTitle: string,
  settings: SiteSettings
) {
  const normalizedPageTitle = pageTitle.trim();

  return normalizedPageTitle
    ? `${normalizedPageTitle} · ${getSiteDisplayName(settings)}`
    : getSiteDocumentTitle(settings);
}

function syncMetadataTag(
  attribute: "name" | "property",
  key: string,
  content: string
) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function removeMetadataTag(attribute: "name" | "property", key: string) {
  const selector = `meta[${attribute}="${key}"]`;
  document.head
    .querySelectorAll<HTMLMetaElement>(selector)
    .forEach((element) => element.remove());
}

function getCanonicalDocumentUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.href;
}

function syncCanonicalLink(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = url;
}

function normalizeMetadataImageUrl(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function getStructuredDataLanguage(locale: Locale) {
  return locale === "zh" ? "zh-CN" : "en";
}

function normalizeStructuredDataDate(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)/,
    "$1T$2"
  );
  const hasTime = /^\d{4}-\d{2}-\d{2}T/.test(normalized);
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized);
  const date = new Date(
    hasTime && !hasTimezone ? `${normalized}Z` : normalized
  );
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function createWebsiteStructuredData({
  settings,
  locale,
  description
}: {
  settings: SiteSettings;
  locale: Locale;
  description: string;
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteDisplayName(settings),
    url: getCanonicalDocumentUrl(),
    description: description.trim(),
    inLanguage: getStructuredDataLanguage(locale)
  };
}

export function createArticleStructuredData({
  settings,
  locale,
  title,
  description,
  image = "",
  publishedAt,
  modifiedAt
}: {
  settings: SiteSettings;
  locale: Locale;
  title: string;
  description: string;
  image?: string;
  publishedAt?: string | null;
  modifiedAt?: string | null;
}): StructuredData {
  const canonicalUrl = getCanonicalDocumentUrl();
  const siteUrl = new URL("/", canonicalUrl).href;
  const normalizedImageUrl = normalizeMetadataImageUrl(image);
  const datePublished = normalizeStructuredDataDate(publishedAt);
  const dateModified = normalizeStructuredDataDate(modifiedAt);
  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title.trim(),
    description: description.trim(),
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    inLanguage: getStructuredDataLanguage(locale),
    publisher: {
      "@type": "Organization",
      name: getSiteDisplayName(settings),
      url: siteUrl
    }
  };

  if (normalizedImageUrl) {
    structuredData.image = normalizedImageUrl;
  }

  if (datePublished) {
    structuredData.datePublished = datePublished;
  }

  if (dateModified) {
    structuredData.dateModified = dateModified;
  }

  return structuredData;
}

export function syncStructuredData(structuredData: StructuredData | null) {
  const selector =
    'script[type="application/ld+json"][data-htools-structured-data="true"]';
  const existingScripts = Array.from(
    document.head.querySelectorAll<HTMLScriptElement>(selector)
  );

  if (!structuredData) {
    existingScripts.forEach((script) => script.remove());
    return;
  }

  let script = existingScripts.shift();
  existingScripts.forEach((duplicate) => duplicate.remove());

  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.htoolsStructuredData = "true";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(structuredData).replace(/</g, "\\u003c");
}

export function syncDocumentRobots(robots: string) {
  syncMetadataTag("name", "robots", robots);
}

export function syncDocumentMetadata({
  title,
  description,
  type = "website",
  image = "",
  imageAlt = "",
  robots = "index,follow",
  structuredData = null
}: DocumentMetadata) {
  const normalizedDescription = description.trim();
  const canonicalUrl = getCanonicalDocumentUrl();
  const normalizedImageUrl = normalizeMetadataImageUrl(image);
  const normalizedImageAlt = imageAlt.trim();

  document.title = title;
  syncCanonicalLink(canonicalUrl);
  syncDocumentRobots(robots);
  syncMetadataTag("name", "description", normalizedDescription);
  syncMetadataTag("property", "og:title", title);
  syncMetadataTag("property", "og:description", normalizedDescription);
  syncMetadataTag("property", "og:type", type);
  syncMetadataTag("property", "og:url", canonicalUrl);
  syncMetadataTag("name", "twitter:title", title);
  syncMetadataTag("name", "twitter:description", normalizedDescription);
  syncStructuredData(structuredData);
  syncMetadataTag(
    "name",
    "twitter:card",
    normalizedImageUrl ? "summary_large_image" : "summary"
  );

  if (normalizedImageUrl) {
    syncMetadataTag("property", "og:image", normalizedImageUrl);
    syncMetadataTag("name", "twitter:image", normalizedImageUrl);

    if (normalizedImageAlt) {
      syncMetadataTag("property", "og:image:alt", normalizedImageAlt);
      syncMetadataTag("name", "twitter:image:alt", normalizedImageAlt);
    } else {
      removeMetadataTag("property", "og:image:alt");
      removeMetadataTag("name", "twitter:image:alt");
    }
  } else {
    removeMetadataTag("property", "og:image");
    removeMetadataTag("property", "og:image:alt");
    removeMetadataTag("name", "twitter:image");
    removeMetadataTag("name", "twitter:image:alt");
  }
}

export function getSiteFooterSettings(settings: SiteSettings): FooterSettings {
  const footer: Partial<FooterSettings> = settings.footer ?? {};

  return {
    ...DEFAULT_FOOTER_SETTINGS,
    ...footer,
    description: normalizeFooterDescription(footer.description),
    authorName: DEFAULT_FOOTER_SETTINGS.authorName,
    authorUrl: DEFAULT_FOOTER_SETTINGS.authorUrl,
    copyright: DEFAULT_FOOTER_SETTINGS.copyright,
    sponsorLabel:
      footer.sponsorLabel?.trim() || DEFAULT_FOOTER_SETTINGS.sponsorLabel,
    sponsorUrl: normalizeFooterSponsorUrl(footer.sponsorUrl),
    socialLinks: footer.socialLinks?.length
      ? footer.socialLinks.map(normalizeLegacyDefaultFooterLink)
      : DEFAULT_FOOTER_SETTINGS.socialLinks,
    groups: footer.groups?.length
      ? normalizeFooterNavigationLabels(footer.groups)
      : DEFAULT_FOOTER_SETTINGS.groups
  };
}

export function getLocalizedFooterSettings(
  settings: SiteSettings,
  t: Messages
): FooterSettings {
  const footerSettings = getSiteFooterSettings(settings);
  const footer: Partial<FooterSettings> = settings.footer ?? {};

  return {
    ...footerSettings,
    description: isDefaultFooterDescription(footer.description)
      ? t.home.footerDescription
      : footerSettings.description,
    groups: isDefaultFooterGroups(footer.groups)
      ? getLocalizedDefaultFooterGroups(t)
      : footerSettings.groups
  };
}

function getHomeHeroContent(value: unknown): HomeHeroContent {
  const content =
    typeof value === "object" && value !== null
      ? (value as Partial<HomeHeroContent>)
      : {};

  return {
    titleTop: typeof content.titleTop === "string" ? content.titleTop : "",
    titleBottom:
      typeof content.titleBottom === "string" ? content.titleBottom : "",
    description:
      typeof content.description === "string" ? content.description : ""
  };
}

export function getHomeHeroSettings(settings: SiteSettings): HomeHeroSettings {
  return {
    zh: getHomeHeroContent(settings.homeHero?.zh),
    en: getHomeHeroContent(settings.homeHero?.en)
  };
}

export function getLocalizedHomeHeroContent(
  settings: SiteSettings,
  locale: Locale,
  t: Messages
): HomeHeroContent {
  const customContent = getHomeHeroSettings(settings)[locale];

  return {
    titleTop: customContent.titleTop.trim() || t.home.titleTop,
    titleBottom: customContent.titleBottom.trim() || t.home.titleBottom,
    description: customContent.description.trim() || t.home.description
  };
}

function getLocalizedDefaultFooterGroups(t: Messages): FooterLinkGroup[] {
  return [
    {
      title: t.home.footerProduct,
      links: [
        { label: t.nav.tools, href: "/tools" },
        { label: t.nav.articles, href: "/articles" },
        { label: t.actions.submitTool, href: "/submit" }
      ]
    },
    {
      title: t.home.footerSupport,
      links: [
        { label: t.home.email, href: "mailto:admin@zrf.me" },
        { label: "GitHub", href: FOOTER_PROJECT_URL },
        { label: "Telegram", href: "https://d.zrf.me/tgq" }
      ]
    },
    {
      title: t.home.footerOther,
      links: [
        { label: t.home.countdown, href: "https://zrf.me/" },
        { label: t.home.blog, href: "https://blog.zrf.me" }
      ]
    },
    {
      title: t.home.footerMore,
      links: [
        { label: t.home.about, href: "/about" },
        { label: t.home.privacy, href: "/privacy" },
        { label: t.home.terms, href: "/terms" }
      ]
    }
  ];
}

function getLegacyDefaultFooterGroups(): FooterLinkGroup[] {
  return DEFAULT_FOOTER_SETTINGS.groups.map((group) =>
    group.title === translations.zh.home.footerMore
      ? { ...group, title: LEGACY_DEFAULT_FOOTER_MORE_TITLE }
      : group
  );
}

function isDefaultFooterDescription(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return true;
  }

  return [
    DEFAULT_FOOTER_DESCRIPTION,
    LEGACY_DEFAULT_FOOTER_DESCRIPTION,
    PREVIOUS_DEFAULT_FOOTER_DESCRIPTION,
    TEMP_DEFAULT_FOOTER_DESCRIPTION,
    translations.zh.home.footerDescription,
    translations.en.home.footerDescription
  ].includes(value.trim());
}

function isDefaultFooterGroups(groups: FooterLinkGroup[] | undefined) {
  if (!groups?.length) {
    return true;
  }

  return DEFAULT_FOOTER_GROUP_SIGNATURES.has(createFooterGroupSignature(groups));
}

function createFooterGroupSignature(groups: FooterLinkGroup[]) {
  return JSON.stringify(
    normalizeFooterNavigationLabels(groups).map((group) => ({
      title: group.title.trim().toLowerCase(),
      links: group.links.map((link) => ({
        label: link.label.trim().toLowerCase(),
        href: link.href.trim().replace(/\/$/, "").toLowerCase()
      }))
    }))
  );
}

function normalizeFooterSponsorUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_FOOTER_SETTINGS.sponsorUrl;
  }

  const sponsorUrl = value.trim();

  return sponsorUrl.replace(/\/$/, "").toLowerCase() ===
    LEGACY_DEFAULT_SPONSOR_URL.replace(/\/$/, "").toLowerCase()
    ? DEFAULT_FOOTER_SETTINGS.sponsorUrl
    : sponsorUrl;
}

function normalizeFooterDescription(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_FOOTER_SETTINGS.description;
  }

  const description = value.trim();

  return [
    LEGACY_DEFAULT_FOOTER_DESCRIPTION,
    PREVIOUS_DEFAULT_FOOTER_DESCRIPTION,
    TEMP_DEFAULT_FOOTER_DESCRIPTION
  ].includes(description)
    ? DEFAULT_FOOTER_SETTINGS.description
    : description;
}

function normalizeFooterNavigationLabels(groups: FooterLinkGroup[]) {
  return groups.map((group) => ({
    ...group,
    links: group.links.map(normalizeFooterNavigationLink)
  }));
}

function normalizeFooterNavigationLink(link: FooterLink): FooterLink {
  if (link.href === "/category") {
    return {
      ...link,
      href: "/tools",
      label:
        link.label === "\u5206\u7c7b" || link.label.toLowerCase() === "category"
          ? link.label === "\u5206\u7c7b"
            ? "\u5de5\u5177"
            : "Tools"
          : link.label
    };
  }

  const normalizedLegacyLink = normalizeLegacyDefaultFooterLink(link);

  if (normalizedLegacyLink !== link) {
    return normalizedLegacyLink;
  }

  if (isDefaultAuthorLegalHref(link.href, "/privacy")) {
    return {
      ...link,
      href: "/privacy"
    };
  }

  if (isDefaultAuthorLegalHref(link.href, "/terms")) {
    return {
      ...link,
      href: "/terms"
    };
  }

  return link;
}

function normalizeLegacyDefaultFooterLink(link: FooterLink): FooterLink {
  if (link.href.toLowerCase() === "mailto:hello@zrf.me") {
    return {
      ...link,
      href: "mailto:admin@zrf.me"
    };
  }

  if (/^https:\/\/t\.me\/?$/i.test(link.href)) {
    return {
      ...link,
      href: "https://d.zrf.me/tgq"
    };
  }

  return link;
}

function isDefaultAuthorLegalHref(href: string, pathname: "/privacy" | "/terms") {
  try {
    const url = new URL(href);
    const defaultAuthorUrls = [
      DEFAULT_FOOTER_SETTINGS.authorUrl,
      LEGACY_DEFAULT_AUTHOR_URL
    ].map((value) => new URL(value));

    return defaultAuthorUrls.some(
      (defaultAuthorUrl) =>
        url.hostname.toLowerCase() === defaultAuthorUrl.hostname.toLowerCase() &&
        url.pathname.replace(/\/$/, "") === pathname
    );
  } catch {
    return false;
  }
}

export function getFooterFormValues(settings: SiteSettings): FooterSettings {
  return {
    ...DEFAULT_FOOTER_SETTINGS,
    ...(settings.footer ?? {}),
    authorName: DEFAULT_FOOTER_SETTINGS.authorName,
    authorUrl: DEFAULT_FOOTER_SETTINGS.authorUrl,
    copyright: DEFAULT_FOOTER_SETTINGS.copyright,
    sponsorUrl: normalizeFooterSponsorUrl(settings.footer?.sponsorUrl)
  };
}

export function getEditableSiteSettings(settings: SiteSettings): SiteSettings {
  const footer = getSiteFooterSettings(settings);

  return {
    ...settings,
    name: settings.name.trim() || DEFAULT_SITE_SETTINGS.name,
    subtitle: settings.subtitle.trim() || DEFAULT_SITE_SETTINGS.subtitle,
    aboutContent: getAboutContentSettings(settings),
    privacyContent: getLegalContentSettings(settings, "privacy"),
    termsContent: getLegalContentSettings(settings, "terms"),
    footer,
    homeHero: getHomeHeroSettings(settings)
  };
}

export function formatFooterJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function isSiteIconDataUrl(value: string) {
  return /^data:image\/(?:png|jpe?g|webp|gif|x-icon|vnd\.microsoft\.icon);base64,/i.test(
    value.trim()
  );
}

export function addSiteIconRetryParam(value: string, retryToken: number) {
  if (!retryToken || isSiteIconDataUrl(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    url.searchParams.set("htools_icon_retry", String(retryToken));
    return url.toString();
  } catch {
    return value;
  }
}

function ensureFaviconLink(key: string) {
  const selector = `link[data-htools-favicon="${key}"]`;
  const existingLink = document.head.querySelector<HTMLLinkElement>(selector);

  if (existingLink) {
    return existingLink;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.dataset.htoolsFavicon = key;
  document.head.appendChild(link);

  return link;
}

function updateFaviconLinks(customIconUrl: string) {
  DEFAULT_FAVICON_LINKS.forEach((favicon) => {
    const link = ensureFaviconLink(favicon.key);
    link.rel = "icon";

    if (customIconUrl) {
      link.href = customIconUrl;
      link.removeAttribute("sizes");
      link.removeAttribute("type");
      return;
    }

    link.href = favicon.href;

    if (favicon.sizes) {
      link.setAttribute("sizes", favicon.sizes);
    } else {
      link.removeAttribute("sizes");
    }

    if (favicon.type) {
      link.type = favicon.type;
    } else {
      link.removeAttribute("type");
    }
  });
}

export function syncSiteFavicon(iconUrl: string) {
  const customIconUrl = iconUrl.trim();
  updateFaviconLinks(customIconUrl);
  const firstSource = customIconUrl || DEFAULT_SITE_ICON_URL;
  const retrySource = addSiteIconRetryParam(firstSource, Date.now());
  const sources = [...new Set([firstSource, retrySource, DEFAULT_SITE_ICON_URL])];
  let image: HTMLImageElement | undefined;
  let active = true;

  function loadSource(index: number) {
    const source = sources[index];
    if (!source) {
      updateFaviconLinks(SITE_LOGO_FALLBACK_DATA_URL);
      return;
    }

    const attempt = new Image();
    image = attempt;
    attempt.onload = () => {
      if (!active || image !== attempt) return;
      attempt.onload = attempt.onerror = null;
      image = undefined;
      updateFaviconLinks(source === DEFAULT_SITE_ICON_URL ? "" : source);
    };
    attempt.onerror = () => {
      if (!active || image !== attempt) return;
      attempt.onload = attempt.onerror = null;
      image = undefined;
      loadSource(index + 1);
    };
    attempt.src = source;
  }

  loadSource(0);

  return () => {
    active = false;
    if (image) image.onload = image.onerror = null;
  };
}

function getSiteIconFileType(file: File) {
  if (SITE_ICON_UPLOAD_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return SITE_ICON_EXTENSION_TYPES[extension] ?? "";
}

export async function readSiteIconFile(file: File) {
  const mediaType = getSiteIconFileType(file);

  if (!mediaType) {
    throw new Error("site icon file type is not supported.");
  }

  if (file.size > SITE_ICON_UPLOAD_MAX_BYTES) {
    throw new Error("site icon file is too large.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return `data:${mediaType};base64,${window.btoa(binary)}`;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

export function getLocalizedErrorMessage(
  error: unknown,
  t: Messages,
  fallback = t.errors.requestFailed
) {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();
  const isChinese = isChineseLocaleText(t);
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 0;
  const codeMessages: Record<string, string> = {
    UNAUTHORIZED: t.errors.unauthorized,
    FORBIDDEN: t.errors.forbidden,
    NOT_FOUND: t.errors.notFound,
    CONFLICT: t.errors.conflict,
    RATE_LIMITED: t.errors.rateLimited,
    INVALID_REQUEST: t.errors.invalidRequest,
    VALIDATION_ERROR: t.errors.invalidRequest,
    SERVER_ERROR: t.errors.serverError
  };

  if (codeMessages[errorCode]) return codeMessages[errorCode];

  if (errorCode === "BACKUP_DATA_INVALID") {
    const recordId =
      typeof error === "object" &&
      error !== null &&
      "recordId" in error &&
      typeof error.recordId === "string"
        ? error.recordId
        : "";
    return isChinese
      ? `备份数据存在关联问题${recordId ? `（记录 ${recordId}）` : ""}，请检查订阅内容与文章的关联后重试。`
      : `The backup data has a broken reference${recordId ? ` (record ${recordId})` : ""}. Check the links between content items and articles, then try again.`;
  }

  const businessCodeMessages: Record<string, string> = {
    CATEGORY_ICONS_CAPACITY: isChinese
      ? "分类图标容量已满，请恢复部分图标为默认，或简化 SVG 代码。"
      : "Category icon capacity is full. Restore some icons to default or simplify the SVG code.",
    INVALID_PASSWORD: isChinese ? "密码不正确。" : "Incorrect password.",
    TURNSTILE_CONFIG_ERROR: isChinese
      ? "Cloudflare Turnstile 配置不完整，请联系站点管理员。"
      : "Cloudflare Turnstile is not fully configured. Contact the site administrator.",
    TURNSTILE_FAILED: isChinese
      ? "人机验证失败，请重新验证。"
      : "Verification failed. Please try again.",
    TURNSTILE_REQUIRED: t.admin.turnstileRequired,
    TURNSTILE_UNAVAILABLE: t.admin.turnstileServerFailed,
    TELEGRAM_NOT_CONFIGURED: isChinese
      ? "请先配置 Telegram 机器人 Token 和接收目标。"
      : "Configure the Telegram bot token and recipient first.",
    TELEGRAM_DISABLED: isChinese
      ? "Telegram 推送尚未开启。"
      : "Telegram pushing is disabled.",
    TELEGRAM_TARGET_UNAVAILABLE: isChinese
      ? "机器人无法访问目标会话，请先将机器人加入该群组或频道后重试。"
      : "The bot cannot access the target chat. Add it to the group or channel, then try again.",
    TELEGRAM_PERMISSION_DENIED: isChinese
      ? "机器人没有向目标群组或频道发送消息的权限，请授予相应的发送或发布权限后重试。"
      : "The bot cannot send messages to the target group or channel. Grant the required posting permission, then try again.",
    TELEGRAM_MESSAGE_NOT_FOUND: isChinese
      ? "原 Telegram 消息已不存在，可清除旧消息记录后手动重新推送。"
      : "The original Telegram message no longer exists. Clear its old record and push it manually again.",
    TELEGRAM_MESSAGE_EXISTS: isChinese
      ? "此内容已经推送到当前 Telegram 会话。"
      : "This content has already been pushed to the current Telegram chat.",
    TELEGRAM_TARGET_CHANGED: isChinese
      ? "Telegram 发送目标已经改变，请重新建立推送后再发送。"
      : "The Telegram target has changed. Rebuild the push before sending it again.",
    TELEGRAM_MESSAGE_TOO_LONG: isChinese
      ? "完整消息超过 Telegram 的 4096 字符限制。"
      : "The complete message exceeds Telegram's 4096-character limit.",
    TELEGRAM_TEST_TIMEOUT: isChinese
      ? "Telegram 测试连接超时，请检查网络或稍后重试。"
      : "Telegram connection test timed out. Check your network or try again later.",
    TELEGRAM_PUSH_IN_PROGRESS: isChinese
      ? "当前消息正在处理中，请勿重复操作。"
      : "This message is already being processed. Avoid submitting it again.",
    TELEGRAM_PUSH_UNCERTAIN: isChinese
      ? "Telegram 推送结果暂时无法确认，请先检查目标会话；确认未收到后可以重新推送。"
      : "The Telegram push result is uncertain. Check the target chat and retry only after confirming it was not received.",
    GITHUB_METADATA_TIMEOUT: isChinese
      ? "GitHub 信息读取超时，请检查网络后重试。"
      : "GitHub metadata request timed out. Check your connection and try again.",
    IMAGE_BED_NOT_CONFIGURED: isChinese
      ? "请先配置 IMGBED_TOKEN，并在后台服务设置中填写图床地址。"
      : "Configure IMGBED_TOKEN and the image bed URL in Admin > Service Settings first.",
    IMAGE_BED_DISABLED: isChinese
      ? "图片上传尚未开启，请先在后台服务设置中开启。"
      : "Image upload is disabled. Enable it in Admin > Service Settings first.",
    IMAGE_BED_URL_INVALID: isChinese
      ? "请输入有效的 HTTP 或 HTTPS 图床服务地址。"
      : "Enter a valid HTTP or HTTPS image bed service URL.",
    IMAGE_FILE_INVALID: isChinese
      ? "请选择 PNG、JPEG、WebP、GIF 或 AVIF 图片。"
      : "Choose a PNG, JPEG, WebP, GIF, or AVIF image.",
    IMAGE_FILE_TOO_LARGE: isChinese
      ? "图片大小不能超过 10MB。"
      : "The image must be no larger than 10 MB.",
    IMAGE_UPLOAD_TIMEOUT: isChinese
      ? "图片上传超时，请检查图床服务后重试。"
      : "Image upload timed out. Check the image bed service and try again.",
    IMAGE_UPLOAD_FAILED: isChinese
      ? "图片上传失败，请检查图床地址、Token 权限或上传渠道。"
      : "Image upload failed. Check the service URL, token permission, and upload channel.",
    IMAGE_UPLOAD_RESPONSE_INVALID: isChinese
      ? "图床返回的数据中没有可用的图片地址。"
      : "The image bed response did not contain a usable image URL.",
    TELEGRAM_UNAVAILABLE: isChinese
      ? "Telegram 服务请求失败，请检查机器人配置或稍后重试。"
      : "The Telegram request failed. Check the bot configuration or try again later.",
    AI_NOT_CONFIGURED: isChinese
      ? "Workers AI 未配置，请先在 Cloudflare Pages 中添加 AI 绑定。"
      : "Workers AI is not configured. Add the AI binding to the Cloudflare Pages project first.",
    AI_DISABLED: isChinese
      ? "Workers AI 尚未开启，请先在系统设置中开启。"
      : "Workers AI is disabled. Enable it in system settings first.",
    AI_TIMEOUT: isChinese
      ? "Workers AI 处理超时，请稍后重试。"
      : "Workers AI processing timed out. Try again shortly.",
    AI_RESPONSE_INVALID: isChinese
      ? "Workers AI 返回的格式无法识别，请重试。"
      : "Workers AI returned an unreadable result. Try again.",
    AI_REQUEST_FAILED: isChinese
      ? "Workers AI 请求失败，请稍后重试。"
      : "Workers AI request failed. Try again shortly.",
    AI_DOCUMENT_UNSUPPORTED: isChinese
      ? "请选择支持的文档或图片格式。"
      : "Choose a supported document or image format.",
    AI_DOCUMENT_TOO_LARGE: isChinese
      ? "文档不能为空，且请控制在 10MB 以内。"
      : "The document cannot be empty and must be no larger than 10 MB.",
    AI_DOCUMENT_CONVERSION_FAILED: isChinese
      ? "文档转换失败，请检查文件后重试。"
      : "Document conversion failed. Check the file and try again.",
  };

  if (businessCodeMessages[errorCode]) return businessCodeMessages[errorCode];

  if (errorCode === "REQUEST_TIMEOUT" || message === "Request timed out.") {
    return isChinese
      ? "请求超时，请稍后重试。"
      : "Request timed out. Try again shortly.";
  }

  if (
    message.includes("D1 \u6570\u636e\u5e93\u672a\u7ed1\u5b9a") ||
    message.includes("\u8bf7\u68c0\u67e5\u60a8\u7684\u9879\u76ee\u662f\u5426\u5df2\u6b63\u786e\u7ed1\u5b9a\u6570\u636e\u5e93\u3002") ||
    normalized.includes("cannot read properties of undefined") ||
    normalized.includes("reading 'prepare'") ||
    normalized.includes("no such table")
  ) {
    return t.empty.connectionDescription;
  }

  if (
    message === "Failed to fetch" ||
    message === "Network request failed." ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed")
  ) {
    return t.errors.networkError;
  }

  if (message === "Request failed") {
    return fallback;
  }

  if (message === "Invalid password.") {
    return t.status.loginFailed;
  }

  if (
    message ===
    "owner and repo are required when GitHub submissions are enabled."
  ) {
    return getGitHubSettingsRequiredMessage(t);
  }

  if (message === "GitHub submissions are not configured.") {
    return isChinese
      ? "GitHub 提交尚未配置。"
      : "GitHub submissions are not configured.";
  }

  if (message === "URL must be a GitHub repository.") {
    return isChinese
      ? "请输入有效的 GitHub 仓库地址。"
      : "Enter a valid GitHub repository URL.";
  }

  if (message === "GitHub repository not found.") {
    return isChinese ? "未找到 GitHub 仓库。" : "GitHub repository not found.";
  }

  if (message === "GitHub API rate limit reached. Try again later.") {
    return isChinese
      ? "GitHub API 请求次数已达上限，请稍后再试。"
      : message;
  }

  if (message.startsWith("GitHub API request failed with status ")) {
    const status = message.match(/\d+/)?.[0] ?? "";
    return isChinese
      ? `GitHub API 请求失败${status ? `：${status}` : "。"}`
      : message;
  }

  if (message === "Unable to load GitHub metadata.") {
    return isChinese ? "GitHub 仓库信息读取失败。" : message;
  }

  if (
    message ===
    "GitHub rejected this submission. Check repository issue permissions."
  ) {
    return isChinese
      ? "GitHub 拒绝了这次提交，请检查目标仓库的 Issue 权限。"
      : message;
  }

  if (message === "Unauthorized.") {
    return isChinese ? "登录已失效，请重新登录。" : "Session expired. Sign in again.";
  }

  if (status === 400 || status === 422) return t.errors.invalidRequest;
  if (status === 401) return t.errors.unauthorized;
  if (status === 403) return t.errors.forbidden;
  if (status === 404) return t.errors.notFound;
  if (status === 409) return t.errors.conflict;
  if (status === 429) return t.errors.rateLimited;
  if (status >= 500) return t.errors.serverError;

  return fallback;
}

function getGitHubSettingsRequiredMessage(t: Messages) {
  return isChineseLocaleText(t)
    ? "启用 GitHub 提交时，请填写仓库 Owner 和仓库名称。"
    : "Repository owner and repository name are required when GitHub submissions are enabled.";
}

export function getSourceErrorMessage(
  error: unknown,
  text: { sourceOperationFailed: string },
  t: Messages
) {
  const rawMessage = getErrorMessage(error);

  if (rawMessage === "Request failed") {
    return text.sourceOperationFailed;
  }

  return getLocalizedErrorMessage(error, t);
}
