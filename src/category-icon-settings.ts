import { normalizeCategorySvg } from "./category-svg";
export { MAX_CATEGORY_SVG_LENGTH } from "./category-svg";

export const CATEGORY_ICON_NAMES = [
  "tags", "folder", "code", "terminal", "server", "database", "globe", "cloud",
  "link", "book-open", "file-text", "newspaper", "rss", "mail", "message-circle", "send",
  "shield", "lock", "key", "search", "settings", "wrench", "cpu", "bot", "image", "camera",
  "video", "music", "palette", "layout-grid", "chart-no-axes-combined", "graduation-cap",
  "house", "star", "heart", "bookmark", "flag", "pin", "tag", "lightbulb", "plus", "minus", "check", "x",
  "refresh-cw", "download", "upload", "external-link", "braces", "brackets", "code-xml", "git-branch",
  "git-commit-horizontal", "git-pull-request", "bug", "workflow", "network", "wifi", "router", "cable",
  "hard-drive", "monitor", "smartphone", "tablet", "laptop", "keyboard", "mouse", "printer", "scan", "qr-code",
  "clipboard-list", "list-checks", "notebook-pen", "notebook-tabs", "files", "file-code", "file-json", "file-archive",
  "file-spreadsheet", "file-search", "folder-open", "github", "gitlab", "library", "square-pen", "languages",
  "user-round", "users", "audio-lines", "headphones", "mic", "film", "clapperboard", "radio", "podcast", "youtube",
  "calendar", "calendar-days", "clock", "timer", "alarm-clock", "bell", "bell-ring", "contact", "chart-bar",
  "chart-pie", "chart-line", "table", "circle-dollar-sign", "credit-card", "wallet", "shopping-cart", "briefcase",
  "building-2", "store", "map", "map-pin", "compass", "plane", "rocket", "sparkles", "zap", "brain-circuit",
  "flask-conical", "gamepad-2", "puzzle", "component", "package"
] as const;

export const CATEGORY_ICON_SCOPES = ["tools", "articles", "push", "content"] as const;
// ponytail: 与手工分类列表的 120 项上限一致；更大目录需要改为分页独立记录。
export const MAX_CATEGORY_ICONS_PER_SCOPE = 120;
// ponytail: 整组图标控制在 1 MiB，避免静态 SVG 超过 D1 单行容量；更多内容应拆成独立记录。
export const MAX_CATEGORY_ICON_SETTINGS_BYTES = 1024 * 1024;
export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];
export type CategoryIcon =
  | { type: "lucide"; value: CategoryIconName }
  | { type: "image"; value: string }
  | { type: "svg"; value: string };
export type CategoryIconSettings = Record<(typeof CATEGORY_ICON_SCOPES)[number], Record<string, CategoryIcon>>;

export function createEmptyCategoryIconSettings(): CategoryIconSettings {
  return { tools: {}, articles: {}, push: {}, content: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isEditableCategoryIconCategory(value: unknown): value is string {
  if (typeof value !== "string" || value !== value.trim() || !value || value.length > 48 || /[\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }
  return ![
    "all", "全部", "featured", "精选", "__admin_featured__",
    "__telegram_tool__", "__telegram_article__", "__telegram_content__",
    "__proto__", "constructor", "prototype"
  ].includes(value.toLowerCase());
}

export function normalizeCategoryIcon(value: unknown): CategoryIcon | null {
  if (!isRecord(value) || !Object.hasOwn(value, "type") || !Object.hasOwn(value, "value") || typeof value.value !== "string") {
    return null;
  }
  if (value.type === "lucide" && (CATEGORY_ICON_NAMES as readonly string[]).includes(value.value)) {
    return { type: "lucide", value: value.value as CategoryIconName };
  }
  if (value.type === "svg") {
    const svg = normalizeCategorySvg(value.value);
    return svg ? { type: "svg", value: svg } : null;
  }
  if (value.type !== "image") return null;
  const address = value.value.trim();
  if (!address || address.length > 2048 || /[\u0000-\u001f\u007f]/.test(address)) return null;
  try {
    const url = new URL(address);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href.length <= 2048 ? { type: "image", value: url.href } : null;
  } catch {
    return null;
  }
}

export function normalizeCategoryIconSettings(value: unknown): CategoryIconSettings {
  const result = createEmptyCategoryIconSettings();
  if (!isRecord(value)) return result;
  for (const scope of CATEGORY_ICON_SCOPES) {
    if (!Object.hasOwn(value, scope) || !isRecord(value[scope])) continue;
    let count = 0;
    for (const [category, rawIcon] of Object.entries(value[scope])) {
      if (!isEditableCategoryIconCategory(category)) continue;
      const icon = normalizeCategoryIcon(rawIcon);
      if (!icon) continue;
      result[scope][category] = icon;
      if (++count === MAX_CATEGORY_ICONS_PER_SCOPE) break;
    }
  }
  return result;
}
