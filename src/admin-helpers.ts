import type { Messages } from "./i18n";
import type {
  AdminCategoryScope,
  AdminCategorySettings,
  Article,
  ArticleInput,
  ContentSource,
  ContentSourceInput,
  GitHubToolMetadata,
  LinkCheckResult,
  LinkCheckTarget,
  Tool,
  ToolInput
} from "./types";

export type ConvertPublishMode = "draft" | "published";

export type AppliedGitHubMetadata = {
  metadata: GitHubToolMetadata;
  url: string;
};

export type ToastInput = {
  message: string;
  tone: "success" | "error" | "info";
};

export type PendingAdminCategoryAction = {
  category: string;
  contentCount: number;
  // 订阅内容的弹窗要同时说"几个订阅"和"几条内容",所以这里存两个数。
  // 在打开弹窗那一刻算好存进来,不要等渲染时再算 —— 那时候列表可能已经变了。
  sourceCount: number;
  scope: AdminCategoryScope;
};

export type ThemeMode = "light" | "dark" | "system";
export type AdminView =
  | "tools"
  | "articles"
  | "push"
  | "content"
  | "import-export"
  | "link-check"
  | "system";

export type AdminSystemSettingsGroup = "site" | "services" | "management";

export const ADMIN_SYSTEM_SETTINGS_GROUPS: AdminSystemSettingsGroup[] = [
  "site",
  "services",
  "management"
];

export const ADMIN_SYSTEM_SETTINGS_GROUP_PATHS: Record<
  AdminSystemSettingsGroup,
  string
> = {
  site: "/admin/settings/site",
  services: "/admin/settings/services",
  management: "/admin/settings/management"
};

export const ADMIN_FEATURED_CATEGORY = "__admin_featured__";
const TELEGRAM_PUSH_TOOL_CATEGORY = "__telegram_tool__";
const TELEGRAM_PUSH_ARTICLE_CATEGORY = "__telegram_article__";
const TELEGRAM_PUSH_CONTENT_CATEGORY = "__telegram_content__";
export const ADMIN_ARTICLE_PAGE_SIZE = 50;
export const CONTENT_ITEM_PAGE_SIZE = 50;
export const DEFAULT_SOURCE_URL =
  "https://raw.githubusercontent.com/shaoyouvip/htools/refs/heads/main/public/htools.json";
export const SOURCE_PREVIEW_ERROR_LIMIT = 5;
export const SITE_ICON_UPLOAD_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.gif,.ico,image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon";
export const EDGEONE_PROXY_PROJECT_URL = "https://github.com/shaoyouvip/Edgeone-proxy";

export const initialForm: ToolInput = {
  name: "",
  description: "",
  url: "",
  demoUrl: "",
  image: "",
  category: "",
  tags: [],
  githubLanguage: "",
  githubLicense: "",
  featured: false
};

export const initialArticleForm: ArticleInput = {
  slug: "",
  title: "",
  summary: "",
  content: "",
  coverImage: "",
  category: "",
  tags: [],
  published: true,
  publishedAt: ""
};

export const initialContentSourceForm: ContentSourceInput = {
  title: "",
  url: "",
  category: "",
  tags: [],
  enabled: true
};

export const initialAdminCategorySettings: AdminCategorySettings = {
  tools: [],
  articles: [],
  push: [],
  content: []
};

const adminViewPaths: Record<AdminView, string> = {
  tools: "tools",
  articles: "articles",
  content: "content",
  push: "push",
  "import-export": "import-export",
  "link-check": "check",
  system: "settings/site"
};

export function getAdminPath(view: AdminView) {
  return `/admin/${adminViewPaths[view]}`;
}

function getAdminViewFromPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (
    normalizedPath === "/admin/settings" ||
    getAdminSystemSettingsGroupFromPath(normalizedPath)
  ) {
    return "system";
  }

  const segment = normalizedPath.match(/^\/admin(?:\/([^/?#]+))?$/)?.[1] ?? null;
  return (
    Object.entries(adminViewPaths).find(([, path]) => path === segment)?.[0] as
      | AdminView
      | undefined
  ) ?? null;
}

export function getInitialAdminView(): AdminView {
  if (typeof window === "undefined") return "tools";
  return getAdminViewFromPath(window.location.pathname) ?? "tools";
}

export function getAdminSystemSettingsGroupFromPath(
  pathname: string
): AdminSystemSettingsGroup | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  return (
    ADMIN_SYSTEM_SETTINGS_GROUPS.find(
      (group) => ADMIN_SYSTEM_SETTINGS_GROUP_PATHS[group] === normalizedPath
    ) ?? null
  );
}

export function normalizeForm(tool: Tool): ToolInput {
  return {
    name: tool.name,
    description: tool.description,
    url: tool.url,
    demoUrl: tool.demoUrl,
    image: tool.image,
    category: tool.category,
    tags: tool.tags,
    githubLanguage: tool.githubLanguage,
    githubLicense: tool.githubLicense,
    featured: tool.featured
  };
}

export function normalizeArticleForm(article: Article): ArticleInput {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    content: article.content,
    coverImage: article.coverImage,
    category: article.category,
    tags: article.tags,
    published: article.published,
    publishedAt: isoToDatetimeLocal(article.publishedAt ?? article.published_at)
  };
}

export function normalizeContentSourceForm(source: ContentSource): ContentSourceInput {
  return {
    title: source.title,
    url: source.url,
    category: source.category,
    tags: source.tags,
    enabled: source.enabled
  };
}

function isoToDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function datetimeLocalToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function getAdminCategoryDisplayLabel(label: string) {
  const chars = Array.from(label.trim());
  return chars.length <= 10 ? label : `${chars.slice(0, 9).join("")}…`;
}

export function getAdminCategoryLabelWidth(label: string) {
  return Math.min(10, Math.max(1, Array.from(label.trim()).length));
}

export function normalizeAdminCategoryValue(category: string) {
  const value = category.trim();
  const normalizedValue = value.toLowerCase();
  if (value === "全部" || normalizedValue === "all") return "All";
  if (value === "精选" || normalizedValue === "featured") return ADMIN_FEATURED_CATEGORY;
  return value;
}

export function isAllCategoryValue(category: string) {
  return normalizeAdminCategoryValue(category) === "All";
}

// 订阅内容的分类计数刻意分成两个函数,不许合并成一个和:
// 给人看的数字只能数内容条数 —— 把订阅源加进去就会把"30 条内容"说成"31 条内容";
// 而"要不要弹确认"必须把订阅源也算上 —— 删分类会连该分类下的订阅源一起删,
// 一个"有订阅、还没同步出内容"的分类如果只看内容条数就是 0,会被无确认直接删掉,
// 丢的是订阅源本身,不是可以再同步回来的内容。
export function countContentCategoryItems(
  categoryCounts: Record<string, number>,
  category: string
) {
  const normalized = normalizeAdminCategoryValue(category);

  if (isAllCategoryValue(normalized)) {
    return Object.values(categoryCounts).reduce((total, count) => total + count, 0);
  }

  return Object.entries(categoryCounts).reduce(
    (total, [name, count]) =>
      normalizeAdminCategoryValue(name) === normalized ? total + count : total,
    0
  );
}

export function countContentCategorySources(
  sources: readonly { category: string }[],
  category: string
) {
  const normalized = normalizeAdminCategoryValue(category);

  if (isAllCategoryValue(normalized)) {
    return sources.length;
  }

  return sources.filter(
    (source) => normalizeAdminCategoryValue(source.category) === normalized
  ).length;
}

// 删除前要不要弹确认:只要还有东西会被删掉就必须弹,订阅源和内容都算。
export function hasDeletableContentCategoryPayload(
  itemCount: number,
  sourceCount: number
) {
  return itemCount > 0 || sourceCount > 0;
}

export function isFeaturedCategoryValue(category: string) {
  return normalizeAdminCategoryValue(category) === ADMIN_FEATURED_CATEGORY;
}

export function isPersistableAdminCategory(category: string) {
  const normalized = normalizeAdminCategoryValue(category);
  return Boolean(
    normalized &&
    !isAllCategoryValue(normalized) &&
    !isFeaturedCategoryValue(normalized) &&
    normalized !== TELEGRAM_PUSH_TOOL_CATEGORY &&
    normalized !== TELEGRAM_PUSH_ARTICLE_CATEGORY &&
    normalized !== TELEGRAM_PUSH_CONTENT_CATEGORY
  );
}

function normalizeAdminCategoryList(categories: string[]) {
  return Array.from(new Set(categories.map(normalizeAdminCategoryValue).filter(isPersistableAdminCategory)));
}

export function sortCategoriesBySettings(
  categories: string[],
  preferredOrder: string[],
  t: Messages
) {
  const normalizedPreferredOrder = normalizeAdminCategoryList(preferredOrder);
  const orderMap = new Map(normalizedPreferredOrder.map((category, index) => [category, index]));
  return normalizeAdminCategoryList(categories).sort((left, right) => {
    const leftIndex = orderMap.get(left);
    const rightIndex = orderMap.get(right);
    if (leftIndex !== undefined || rightIndex !== undefined) {
      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      return leftIndex - rightIndex;
    }
    return (t.categories[left] ?? left).localeCompare(t.categories[right] ?? right);
  });
}

export function moveAdminCategoryInList(categories: string[], category: string) {
  const normalizedCategories = normalizeAdminCategoryList(categories);
  const normalizedCategory = normalizeAdminCategoryValue(category);
  const currentIndex = normalizedCategories.indexOf(normalizedCategory);
  if (currentIndex < 0) return normalizedCategories;
  const targetIndex = currentIndex === 0 ? normalizedCategories.length - 1 : currentIndex - 1;
  const nextCategories = [...normalizedCategories];
  const [movedCategory] = nextCategories.splice(currentIndex, 1);
  nextCategories.splice(targetIndex, 0, movedCategory);
  return nextCategories;
}

export function addAdminCategorySetting(
  settings: AdminCategorySettings,
  scope: AdminCategoryScope,
  category: string
) {
  const normalized = normalizeAdminCategoryValue(category);
  if (!isPersistableAdminCategory(normalized)) return settings;
  const categories = normalizeAdminCategoryList([...settings[scope], normalized]);
  if (
    categories.length === settings[scope].length &&
    categories.every((item, index) => item === settings[scope][index])
  ) return settings;
  return { ...settings, [scope]: categories };
}

export function formatAdminDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}

export function buildLinkCheckTargets(tools: Tool[]): LinkCheckTarget[] {
  return tools.flatMap((tool) => {
    const targets: LinkCheckTarget[] = [];
    const url = tool.url.trim();
    const demoUrl = tool.demoUrl.trim();
    if (url) targets.push({ id: tool.id, name: tool.name, kind: "url", url });
    if (demoUrl) targets.push({ id: tool.id, name: tool.name, kind: "demoUrl", url: demoUrl });
    return targets;
  });
}

export function normalizeSourceUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_SOURCE_URL;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

export function normalizeUrlForImport(value: string) {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

export function clampInteger(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

export function buildFailedLinkCheckResults(
  targets: LinkCheckTarget[],
  error: unknown,
  localizedMessage = getErrorMessage(error)
): LinkCheckResult[] {
  const checkedAt = new Date().toISOString();
  return targets.map((target) => ({
    ...target,
    status: 0,
    ok: false,
    duration: 0,
    checkedAt,
    error: localizedMessage
  }));
}
