import {
  BadgeCheck,
  BarChart3,
  Boxes,
  BrainCircuit,
  Code2,
  Database,
  FileImage,
  FileText,
  Globe2,
  LayoutDashboard,
  Link2,
  Mail,
  PackagePlus,
  Rss,
  Server,
  Sparkles,
  Star,
  Tags,
  Wrench
} from "lucide-react";
import { ADMIN_RESOURCE_FIELD_EXAMPLES } from "./admin-field-examples";
import { translations, type Locale, type Messages } from "./i18n";
import type { Article } from "./types";
import { ADMIN_FEATURED_CATEGORY } from "./admin-helpers";

const categoryIcons = {
  All: Boxes,
  [ADMIN_FEATURED_CATEGORY]: Star,
  __telegram_tool__: Wrench,
  __telegram_article__: FileText,
  __telegram_content__: Rss,
  Backend: Server,
  Database,
  "Web Framework": Code2,
  "UI Framework": LayoutDashboard,
  "API Tools": Globe2,
  Productivity: BadgeCheck,
  "Short Link": Link2,
  Analytics: BarChart3,
  Blog: FileText,
  "Image Hosting": FileImage,
  Email: Mail,
  "File Sharing": PackagePlus,
  Tunnel: Server,
  Acceleration: Sparkles,
  "Speed Test": BarChart3,
  Monitoring: LayoutDashboard,
  "Developer Tools": Code2,
  "AI Tools": BrainCircuit,
  "SEO Opt": Sparkles,
  "Other Tools": Tags
};


export function getArticleText(locale: Locale) {
  if (locale === "zh") {
    return {
      adminNav: "文章管理",
      adminTitle: "管理文章",
      adminDescription:
        "管理前台文章内容，可用于发布教程、公告、资源整理和更新记录。",
      addArticle: "添加文章",
      addArticleDescription: "填写文章标题、摘要和正文，可直接发布或存为草稿。",
      editArticle: "编辑文章",
      editArticleDescription: "修改文章信息、发布状态和正文，保存后将更新本站文章。",
      deleteArticle: "删除文章",
      editAction: "编辑",
      deleteAction: "删除",
      searchPlaceholder: "搜索文章",
      emptyTitle: "还没有文章",
      emptyDescription: "可以先添加一篇文章，用来发布教程、公告或资源整理。",
      noMatchTitle: "没有匹配的文章",
      noMatchDescription: "换个搜索词，或者清空筛选后再试。",
      loadMore: "加载更多",
      loadingMore: "加载中...",
      titleLabel: "标题",
      titlePlaceholder: "文章标题",
      slugLabel: "文章路径",
      slugPlaceholder: "用于文章访问地址，留空会自动生成",
      summaryLabel: "摘要",
      summaryPlaceholder: "用 1-2 句话说明这篇文章的内容",
      contentLabel: "正文 Markdown",
      contentPlaceholder: "支持常用 Markdown：标题、列表、引用、代码块和链接",
      coverImageLabel: "封面图 URL",
      coverImagePlaceholder: "https://example.com/preview.png",
      categoryLabel: "文章分类",
      categoryPlaceholder: "选择或新建文章分类",
      tagsLabel: "标签",
      tagsPlaceholder: ADMIN_RESOURCE_FIELD_EXAMPLES.zh.adminTags,
      publishedLabel: "发布文章",
      publishModeLabel: "发布方式",
      publishDirectLabel: "直接发布",
      publishTimeLabel: "发布时间",
      publishTimeAction: "选择时间",
      publishTimeHelp:
        "不填写则使用当前时间；填写后会按该时间显示和排序。",
      draftLabel: "存为草稿",
      statusPublished: "已发布",
      statusDraft: "草稿",
      saveArticle: "保存文章",
      created: "文章已创建。",
      updated: "文章已更新。",
      deleted: "文章已删除。",
      publishedDone: "文章已发布。",
      draftedDone: "文章已设为草稿。",
      publishDraftEnabled: "已切换为已发布，请保存。",
      publishDraftDisabled: "已切换为草稿，请保存。",
      deleteConfirmTitle: "确定要删除这篇文章吗？",
      deleteConfirmDescription:
        "此操作无法撤销。这将从服务器中永久删除这篇文章。",
      readMore: "阅读文章",
      backToArticles: "返回文章列表",
      publishedOn: (date: string) => `发布于 ${date}`,
      loading: "文章加载中...",
      notFoundTitle: "文章不存在",
      notFoundDescription: "这篇文章可能尚未发布，或已经被删除。",
      publicEmptyTitle: "当前还没有文章",
      publicEmptyDescription: "可在此处发布教程、公告和资源整理。",
      openArticle: "打开文章",
      browseArticle: "浏览文章"
    };
  }

  return {
    adminNav: "Articles",
    adminTitle: "Manage Articles",
    adminDescription:
      "Manage frontend articles for tutorials, announcements, resource roundups, and update notes.",
    addArticle: "Add Article",
    addArticleDescription:
      "Enter the article title, summary, and content, then publish it or save it as a draft.",
    editArticle: "Edit Article",
    editArticleDescription:
      "Edit the article information, publish status, and content, then save the changes to the site.",
    deleteArticle: "Delete Article",
    editAction: "Edit",
    deleteAction: "Delete",
    searchPlaceholder: "Search articles",
    emptyTitle: "No articles yet",
    emptyDescription:
      "Add your first article to publish tutorials, announcements, or resource roundups.",
    noMatchTitle: "No matching articles",
    noMatchDescription: "Try another search term or clear the filter.",
    loadMore: "Load more",
      loadingMore: "Loading...",
      titleLabel: "Title",
    titlePlaceholder: "Article title",
      slugLabel: "Article path",
    slugPlaceholder: "Used in the article URL. Leave empty to generate automatically",
    summaryLabel: "Summary",
    summaryPlaceholder: "Use 1-2 sentences to describe this article",
    contentLabel: "Markdown Content",
    contentPlaceholder:
      "Supports common Markdown: headings, lists, quotes, code blocks, and links",
    coverImageLabel: "Cover image URL",
    coverImagePlaceholder: "https://example.com/preview.png",
    categoryLabel: "Article category",
    categoryPlaceholder: "Select or create an article category",
    tagsLabel: "Tags",
    tagsPlaceholder: ADMIN_RESOURCE_FIELD_EXAMPLES.en.adminTags,
    publishedLabel: "Publish article",
    publishModeLabel: "Publish mode",
    publishDirectLabel: "Publish now",
    publishTimeLabel: "Publish time",
    publishTimeAction: "Pick Time",
    publishTimeHelp:
      "Leave blank to use the current time. Fill it to display and sort by that time.",
    draftLabel: "Save draft",
    statusPublished: "Published",
    statusDraft: "Draft",
    saveArticle: "Save Article",
    created: "Article created.",
    updated: "Article updated.",
    deleted: "Article deleted.",
    publishedDone: "Article published.",
    draftedDone: "Article moved to draft.",
    publishDraftEnabled:
      "Switched to published. Save to apply.",
    publishDraftDisabled:
      "Switched to draft. Save to apply.",
    deleteConfirmTitle: "Delete this article?",
    deleteConfirmDescription:
      "This action cannot be undone. This will permanently delete the article from the server.",
    readMore: "Read Article",
    backToArticles: "Back to Articles",
    publishedOn: (date: string) => `Published on ${date}`,
    loading: "Loading articles...",
    notFoundTitle: "Article not found",
    notFoundDescription: "This article may be unpublished or deleted.",
    publicEmptyTitle: "No articles yet",
    publicEmptyDescription:
      "Publish tutorials, announcements, and resource roundups here.",
    openArticle: "Open article",
    browseArticle: "View Article"
  };
}


export function getCategoryIcon(category: string) {
  return Object.hasOwn(categoryIcons, category)
    ? categoryIcons[category as keyof typeof categoryIcons]
    : Tags;
}


function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => decodeEntityCode(code, 10))
    .replace(/&#x([a-f\d]+);/gi, (_, code: string) => decodeEntityCode(code, 16));
}

function decodeEntityCode(code: string, radix: 10 | 16) {
  const point = Number.parseInt(code, radix);

  if (!Number.isFinite(point) || point < 0 || point > 0x10ffff) {
    return "";
  }

  return String.fromCodePoint(point);
}

export function cleanArticleDisplayText(value: string) {
  return decodeBasicHtmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<a\b[^>]*(?:class=["'][^"']*\bheaderlink\b[^"']*["']|href=["']#[^"']*["'])[^>]*>\s*<\/a>/gi, " ")
    .replace(/<a\b[^>\n]*(?:class=["'][^"'\n]*\bheaderlink\b[^"'\n]*["']?|href=["']#[^"'\n]*["']?)[^>\n]*$/gi, " ")
    .replace(/\[\]\(#[^)]+\)/g, " ")
    .replace(/!\[([^\]]*)\]\((?:[^)(]|\([^)]*\))*\)/g, "$1")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/\[([^\]]+)\]\((?:[^)(]|\([^)]*\))*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/(?:^|\s)[×✕✖](?=\s|$)/g, " ")
    .replace(/\s+(?:#[\p{L}\p{N}_-]+\s*){2,}(?:频道\s*[|｜]\s*聊天)?\s*$/u, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getArticleDisplayTitle({
  content = "",
  summary,
  title
}: Pick<Article, "summary" | "title"> & Partial<Pick<Article, "content">>) {
  const cleanedTitle = cleanArticleDisplayText(title);
  const contentText = cleanArticleDisplayText(content);
  const summaryText = cleanArticleDisplayText(summary);

  if (shouldDeriveArticleDisplayTitle(cleanedTitle, contentText, summaryText)) {
    const derivedTitle =
      deriveArticleDisplayTitle(content) ||
      deriveArticleDisplayTitle(summary) ||
      deriveArticleDisplayTitle(contentText);

    if (derivedTitle) {
      return truncateArticleDisplayTitle(derivedTitle, 96);
    }
  }

  return truncateArticleDisplayTitle(cleanedTitle || summaryText || "Untitled");
}

function shouldDeriveArticleDisplayTitle(
  title: string,
  contentText: string,
  summaryText: string
) {
  if (!title) {
    return true;
  }

  if (title.length <= 88) {
    return false;
  }

  const comparableTitle = normalizeComparableArticleText(title);
  const titleHead = comparableTitle.slice(0, 42);

  if (!titleHead) {
    return false;
  }

  return (
    normalizeComparableArticleText(contentText).startsWith(titleHead) ||
    normalizeComparableArticleText(summaryText).startsWith(titleHead)
  );
}

function deriveArticleDisplayTitle(value: string) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || isDecorativeArticleLine(trimmed) || isMarkdownImageLine(trimmed)) {
      continue;
    }

    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    const strong =
      trimmed.match(/^\*\*(.+?)\*\*$/) ?? trimmed.match(/^\*\*(.+?)\*\*/);
    const candidate = cleanArticleTitleCandidate(
      heading?.[1] ?? strong?.[1] ?? trimmed
    );

    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function cleanArticleTitleCandidate(value: string) {
  const cleaned = cleanArticleDisplayText(value)
    .replace(/^[-*]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
  const sentence = cleaned.match(/^.{6,}?[。！？!?](?=\s|$)/)?.[0] ?? "";
  const split = (sentence || cleaned).split(
    /\s+(?=(?:流量|时间|注册方式|节点位置|开业|网页注册|注册链接|优惠券|五折活动|#)\s*[：:]?)/
  )[0];

  return truncateArticleDisplayTitle(split || cleaned, 96);
}

function truncateArticleDisplayTitle(value: string, maxLength = 140) {
  const cleaned = cleanArticleDisplayText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).replace(/[，,、:：；;\s]+$/g, "")}...`;
}

function isDecorativeArticleLine(value: string) {
  return /^(?:×|✕|✖)$/u.test(value.trim());
}

function isMarkdownImageLine(value: string) {
  return (
    /^!\[[^\]]*\]\([^)]+\)$/.test(value.trim()) ||
    /^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)$/.test(value.trim())
  );
}

function normalizeComparableArticleText(value: string) {
  return cleanArticleDisplayText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function normalizeArticleSummaryWhitespace(value: string) {
  return value
    .replace(/(?<=\p{Script=Han})\s+|\s+(?=\p{Script=Han})/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getArticleDisplaySummary(summary: string, contentText: string) {
  const displaySummary = cleanArticleDisplayText(summary);
  const comparableSummary = normalizeArticleSummaryWhitespace(displaySummary);
  // 正文已由 Markdown 解析器提取为文字，不能再次清理其中的代码字面量。
  const comparableContent = normalizeArticleSummaryWhitespace(contentText);

  return comparableSummary && comparableContent.startsWith(comparableSummary)
    ? ""
    : displaySummary;
}

export function normalizeMarkdownImageUrl(value: string) {
  return value
    .trim()
    .replace(/^<|>$/g, "")
    .replace(/^['"]|['"]$/g, "");
}

export function stripLeadingArticleDuplicates(
  content: string,
  title: string,
  coverImage = ""
) {
  let nextContent = content
    .replace(
      /\[\s*\n+\s*(!\[[^\]]*\]\([^)]+\))\s*\n+\s*\]\(([^)\s]+)\)/g,
      "[$1]($2)"
    )
    .replace(/^\s+/, "");
  const preservedBlocks: string[] = [];

  for (let index = 0; index < 8; index += 1) {
    const decorativeMatch = nextContent.match(/^(?:×|✕|✖)\s*(?:\n+|$)/u);

    if (decorativeMatch) {
      nextContent = nextContent.slice(decorativeMatch[0].length).replace(/^\s+/, "");
      continue;
    }

    const headingMatch = nextContent.match(/^#{1,6}[ \t]+(.+?)(?:\r?\n+|$)/);

    if (
      headingMatch &&
      cleanArticleDisplayText(headingMatch[1].replace(/[ \t]+#+[ \t]*$/, "")) === cleanArticleDisplayText(title)
    ) {
      nextContent = nextContent.slice(headingMatch[0].length).replace(/^\s+/, "");
      continue;
    }

    const imageMatch =
      nextContent.match(/^\[!\[[^\]]*\]\(([^)\s]+)\)\]\([^)]+\)\s*(?:\n+|$)/) ??
      nextContent.match(/^!\[[^\]]*\]\(([^)\s]+)\)\s*(?:\n+|$)/) ??
      nextContent.match(/^(?:\[)?!\[[^\n]*\]\(([^)\n]+)\)(?:\]\([^\n]+\))?\s*(?:\n+|$)/);

    if (
      imageMatch &&
      coverImage &&
      normalizeMarkdownImageUrl(imageMatch[1]) ===
        normalizeMarkdownImageUrl(coverImage)
    ) {
      nextContent = nextContent.slice(imageMatch[0].length).replace(/^\s+/, "");
      continue;
    }

    if (imageMatch) {
      preservedBlocks.push(imageMatch[0].trim());
      nextContent = nextContent.slice(imageMatch[0].length).replace(/^\s+/, "");
      continue;
    }

    break;
  }

  if (!preservedBlocks.length) {
    return nextContent;
  }

  return [preservedBlocks.join("\n\n"), nextContent].filter(Boolean).join("\n\n");
}


export function isChineseLocaleText(t: Messages) {
  return t === translations.zh;
}
