import { ArrowDownUp, ArrowRightLeft, ArrowUp, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Eraser, FileText, LogOut, PanelLeft, Plus, RefreshCw, Rss, Search, Send, Settings, ShieldCheck, Star, SquarePen, Trash2, Upload, Wrench, X } from "lucide-react";
import { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { applyAdminCategoryAction, checkLinks, createArticle, createContentSource, createTool, deleteArticle, deleteContentSource, deleteTelegramPush, deleteTool, exportBackupData, exportToolSourceData, importTools, loadAdminAiSettings, loadAdminArticle, loadAdminArticles, loadAdminAuthConfig, loadAdminCategoryConfiguration, loadAdminTools, loadContentItemArticlePreview, loadContentItems, loadContentSources, loadProxySettings, loadSiteConfiguration, loadSiteSettings, loadSourceSettings, loadTelegramMessage, loadTelegramPushRecords, loadTelegramSettings, loadTelegramSource, login, patchSiteSettings, resetFactorySettings, restoreBackupData, saveAdminAiSettings, saveAdminCategoryIcon, saveAdminCategorySettings, saveProxySettings, saveSourceSettings, saveTelegramMessage, sendTelegramMessage, syncContentSource, updateArticle, updateArticlePublished, updateContentSource, convertContentItemToArticle, previewContentSource, updateTelegramMessage, updateTool, type AdminAuthConfig } from "./admin-api";
import { createEmptyCategoryIconSettings, isEditableCategoryIconCategory, type CategoryIcon as CategoryIconValue, type CategoryIconSettings } from "./category-icon-settings";
import { CategoryIcon } from "./components/CategoryIcon";
import { AdminCategoryIconDialog } from "./components/AdminCategoryIconDialog";
import { translations, type Locale, type Messages } from "./i18n";
import { normalizeProxyBaseUrl, normalizeProxyMode, normalizeProxyScope, proxifyUrl } from "./proxy";
import { ADMIN_AI_MODELS, type AdminAiSettings, type AdminCategoryAction, type AdminCategoryScope, type AdminCategorySettings, type Article, type ArticleInput, type ArticleSummary, type ContentItemSummary, type ContentSource, type ContentSourceInput, type ContentSyncResponse, type FeedPreview, type FooterSettings, type HomeHeroContent, type LinkCheckResult, type ProxySettings, type HtoolsBackup, type SiteSettings, type SourceSettings, type TelegramMessage, type TelegramPushRecord, type TelegramResourceType, type TelegramSettings, type Tool, type ToolImportMode, type ToolInput, type UmamiSettings } from "./types";
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_HOME_HERO_SETTINGS, DEFAULT_SITE_SETTINGS, formatFooterJson, getEditableSiteSettings, getFooterFormValues, getHomeHeroSettings, getLocalizedErrorMessage, getSiteDisplayName, getSiteFooterSettings, getSourceErrorMessage, isSiteIconDataUrl, readSiteIconFile } from "./site-helpers";
import {
  cleanArticleDisplayText,
  getArticleDisplayTitle,
  getArticleText
} from "./article-helpers";
import {
  applyGitHubMetadataToForm,
  applyGitHubMetadataToFields,
  getGitHubMetadataDetailText,
  normalizeSlugInput
} from "./admin-display";
import {
  createImageFromUrl,
  formatTagInputText,
  getCategoryLabel,
  isGitHubRepoUrl,
  isValidHttpUrl,
  normalizeHttpUrlInput,
  normalizeTagInputText,
  parseArticleTagsInput
} from "./tool-helpers";
import {
  SiteBrandIdentity,
  SiteBrandMark,
  SkeletonVisibility
} from "./shared-ui";
import { useLoadingSkeleton } from "./useLoadingSkeleton";
import { useOverlayFocusManagement } from "./useOverlayFocusManagement";
import { useUtilityMenuKeyboard } from "./useUtilityMenuKeyboard";
import { ADMIN_RESOURCE_FIELD_EXAMPLES } from "./admin-field-examples";
import {
  isEventInsideElement,
  useOutsideInteractionDismiss
} from "./useOutsideInteractionDismiss";
import {
  usePointerFocusRelease
} from "./usePointerFocusRelease";
import { normalizeRssHubRouteUrl } from "../shared/rsshub";
import { useAdminGitHubMetadata } from "./useAdminGitHubMetadata";
import { buildTelegramPreviewMarkdown, countTelegramMessageCharacters, createDefaultTelegramBody, createTelegramArticleResource, createTelegramContentResource, createTelegramCustomBodyExample, createTelegramResourceMediaUrl, createTelegramToolResource, getTelegramText, readTelegramBodyFields, syncTelegramBodyField, TELEGRAM_MESSAGE_LIMIT, TELEGRAM_PHOTO_CAPTION_LIMIT, type TelegramPushResource } from "./telegram";
import {
  getAdminMaintenanceText,
  getAdminWorkspaceText,
  getContentCategoryActionDescription,
  getContentFlowText
} from "./admin-text";
import AdminMarkdownEditor from "./components/AdminMarkdownEditor";
import AdminAiAction from "./components/AdminAiAction";
import AdminAiDocumentImport from "./components/AdminAiDocumentImport";
import AdminDetailPlaceholder from "./components/AdminDetailPlaceholder";
import AdminFieldAssistButton from "./components/AdminFieldAssistButton";
import AdminImageUploadButton from "./components/AdminImageUploadButton";
import AdminSiteIcon from "./components/AdminSiteIcon";
import {
  AdminConfirmDialog,
  AdminDialogActions,
  Dialog,
  getDialogReturnFocusTarget,
  rememberNextDialogReturnFocus
} from "./components/AdminDialog";
import { AdminEmptyState, AdminInitialLoadError, AdminSettingsLoadError } from "./components/AdminPanelStates";
import { AdminArticleCard, AdminToolCard } from "./components/admin-cards";
import { AdminTelegramPushButton } from "./components/AdminTelegramPushButton";
import { AdminCardActionMenu } from "./components/AdminCardActionMenu";
import {
  AdminTelegramPushPanel,
  TelegramMessagePreview
} from "./components/AdminTelegramPush";
import { useAdminCardActionMenu } from "./useAdminCardActionMenu";
import {
  AdminResourceCardSkeletonGrid,
  AdminSkeletonLines,
  ContentFlowSkeleton,
  getAdminLoadingProps
} from "./components/admin-skeletons";
import {
  GitHubSettingsForm,
  ImageBedSettingsCard,
  LegalSettingsCard,
  RssHubSettingsCard,
  SecuritySettingsCard,
  SettingsStatusBadge,
  TelegramSettingsCard,
  TurnstileSettingsCard,
  UmamiSettingsCard
} from "./components/admin-settings";
import ArticleDetailContent, {
  ArticleBodySkeleton,
  ArticleDetailContentSkeleton
} from "./components/ArticleDetailContent";
import {
  AdminGitHubMetadataButton,
  AdminGitHubMetadataCard
} from "./components/AdminGitHubMetadata";
import { AdminTagsField, AdminTextField, AdminTextareaField, AdminUrlField } from "./components/AdminResourceFields";
import UtilityMenuControls from "./components/UtilityMenuControls";
import { TELEGRAM_MARKDOWN_EDITOR_ACTIONS, type MarkdownEditorMode } from "./markdown-editor";
import TurnstileWidget from "./components/TurnstileWidget";
import {
  createCsv,
  createDatedExportFilename,
  createSourcePreview,
  downloadTextFile,
  fetchToolSource,
  readBackupPayload,
  readToolSourceFile,
  validateBackupFileSize
} from "./admin-maintenance";
import {
  ADMIN_ARTICLE_PAGE_SIZE,
  ADMIN_FEATURED_CATEGORY,
  ADMIN_SYSTEM_SETTINGS_GROUP_PATHS,
  ADMIN_SYSTEM_SETTINGS_GROUPS,
  CONTENT_ITEM_PAGE_SIZE,
  DEFAULT_SOURCE_URL,
  EDGEONE_PROXY_PROJECT_URL,
  SITE_ICON_UPLOAD_ACCEPT,
  SOURCE_PREVIEW_ERROR_LIMIT,
  addAdminCategorySetting,
  buildFailedLinkCheckResults,
  buildLinkCheckTargets,
  clampInteger,
  countContentCategoryItems,
  countContentCategorySources,
  datetimeLocalToIso,
  formatAdminDate,
  getAdminCategoryDisplayLabel,
  getAdminCategoryLabelWidth,
  getAdminPath,
  getAdminSystemSettingsGroupFromPath,
  getErrorMessage,
  getInitialAdminView,
  hasDeletableContentCategoryPayload,
  initialAdminCategorySettings,
  initialArticleForm,
  initialContentSourceForm,
  initialForm,
  isAllCategoryValue,
  isFeaturedCategoryValue,
  isPersistableAdminCategory,
  moveAdminCategoryInList,
  normalizeAdminCategoryValue,
  normalizeArticleForm,
  normalizeContentSourceForm,
  normalizeForm,
  normalizeSourceUrl,
  normalizeUrlForImport,
  sortCategoriesBySettings,
  type AdminView,
  type AdminSystemSettingsGroup,
  type ConvertPublishMode,
  type PendingAdminCategoryAction,
  type ThemeMode,
  type ToastInput
} from "./admin-helpers";

const MarkdownContent = lazy(() => import("./components/MarkdownContent"));

function getContentFeedErrorMessage(
  error: unknown,
  contentText: ReturnType<typeof getContentFlowText>,
  t: Messages,
  fallback: string
) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Feed URL is not allowed." || message.includes("url must be a valid URL")) {
    return contentText.feedUrlNotAllowed;
  }
  if (message === "Feed redirect URL is not allowed.") {
    return contentText.feedRedirectNotAllowed;
  }
  if (message === "Feed request timed out.") return contentText.feedTimeout;
  if (message === "Feed response is too large.") return contentText.feedTooLarge;
  if (message === "Feed redirected too many times.") {
    return contentText.feedTooManyRedirects;
  }
  if (message === "Feed response type is not supported.") {
    return contentText.feedTypeUnsupported;
  }
  if (message === "Feed response body is empty.") return contentText.feedEmpty;
  if (message === "No feed items found.") return contentText.feedNoItems;
  if (message === "RSSHub service is disabled.") {
    return contentText.rssHubNotConfigured;
  }
  if (message === "Content source URL already exists.") {
    return contentText.sourceAlreadyExists;
  }
  const status = message.match(/^Feed request failed with status (\d+)\.$/)?.[1];
  if (status) return contentText.feedRequestFailed(status);
  return getLocalizedErrorMessage(error, t, fallback);
}

function formatAdminDocumentTitle(
  pageTitle: string,
  siteName: string,
  adminLabel: string
) {
  return `${pageTitle} · ${siteName} ${adminLabel}`;
}

type AdminSortMode = "latest" | "oldest";
type AdminWriteEntityScope =
  | "tool"
  | "article"
  | "custom"
  | "content-source"
  | "content-item";
const TELEGRAM_PUSH_PAGE_SIZE = 30;
const TELEGRAM_PUSH_TOOL_FILTER = "__telegram_tool__";
const TELEGRAM_PUSH_ARTICLE_FILTER = "__telegram_article__";
const TELEGRAM_PUSH_CONTENT_FILTER = "__telegram_content__";
const TELEGRAM_PUSH_FIXED_FILTERS = [
  "All",
  TELEGRAM_PUSH_TOOL_FILTER,
  TELEGRAM_PUSH_ARTICLE_FILTER,
  TELEGRAM_PUSH_CONTENT_FILTER
];

function isTelegramPushSourceFilter(value: string) {
  return value === TELEGRAM_PUSH_TOOL_FILTER ||
    value === TELEGRAM_PUSH_ARTICLE_FILTER ||
    value === TELEGRAM_PUSH_CONTENT_FILTER;
}

function getTelegramPushFilterResourceType(value: string): TelegramResourceType | undefined {
  if (value === TELEGRAM_PUSH_TOOL_FILTER) return "tool";
  if (value === TELEGRAM_PUSH_ARTICLE_FILTER) return "article";
  if (value === TELEGRAM_PUSH_CONTENT_FILTER) return "content";
  return undefined;
}

function getTelegramWriteEntityScope(
  resourceType: TelegramResourceType
): AdminWriteEntityScope {
  return resourceType === "content" ? "content-item" : resourceType;
}

function getTelegramStoredCategory(value: string) {
  const normalized = normalizeAdminCategoryValue(value);
  // ponytail: source sentinels like __telegram_tool__ used to double as the default
  // push category. They no longer do, so any that survive in legacy records must read
  // back as "no category" instead of being treated as a real one.
  return isAllCategoryValue(normalized) || isTelegramPushSourceFilter(normalized)
    ? ""
    : normalized;
}

function getTelegramDefaultCategoryLabel(
  resourceType: TelegramResourceType,
  telegramText: ReturnType<typeof getTelegramText>
) {
  const sourceLabel = {
    tool: telegramText.management.typeTool,
    article: telegramText.management.typeArticle,
    content: telegramText.management.typeContent,
    custom: ""
  }[resourceType];
  return sourceLabel ? telegramText.defaultCategoryLabel(sourceLabel) : undefined;
}

function createOptimisticTelegramMessage(
  resource: TelegramPushResource,
  footerMarkdown: string,
  locale: Locale
): TelegramMessage {
  const bodyMarkdown = buildTelegramPreviewMarkdown(
    resource,
    createDefaultTelegramBody(resource),
    footerMarkdown,
    locale
  );
  const mediaUrl = createTelegramResourceMediaUrl(resource);

  return {
    exists: false,
    targetChanged: false,
    deliveryUncertain: false,
    syncStatus: "not_pushed",
    bodyMarkdown,
    mediaEnabled: false,
    mediaUrl,
    defaultBodyMarkdown: bodyMarkdown,
    defaultMediaUrl: mediaUrl,
    resource,
    resourceExists: true
  };
}

function getTelegramPushCategoryLabel(
  category: string,
  telegramText: ReturnType<typeof getTelegramText>,
  t: Messages
) {
  if (category === TELEGRAM_PUSH_TOOL_FILTER) {
    return telegramText.management.typeTool;
  }
  if (category === TELEGRAM_PUSH_ARTICLE_FILTER) {
    return telegramText.management.typeArticle;
  }
  if (category === TELEGRAM_PUSH_CONTENT_FILTER) {
    return telegramText.management.typeContent;
  }
  return getCategoryLabel(category, t);
}

function uniqueAdminCategories(categories: string[]) {
  return Array.from(
    new Map(
      categories
        .map(normalizeAdminCategoryValue)
        .filter(Boolean)
        .map((category) => [category.toLocaleLowerCase(), category] as const)
    ).values()
  );
}

type AdminRefreshResult = "success" | "failed" | "superseded";
type AdminRefreshOptions = { reportError?: boolean };

function combineAdminRefreshResults(results: AdminRefreshResult[]): AdminRefreshResult {
  if (results.includes("failed")) return "failed";
  return results.includes("superseded") ? "superseded" : "success";
}

type TelegramUncertainRetry = {
  context: "record" | "quick" | "editor";
  retried: boolean;
};

function isTelegramPushUncertainError(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "TELEGRAM_PUSH_UNCERTAIN";
}

function getAdminWriteEntityKey(scope: AdminWriteEntityScope, id?: string | null) {
  return `${scope}:${id || "new"}`;
}

const ADMIN_VIEW_STATE_STORAGE_KEYS = {
  tools: {
    category: "htools_admin_tool_category",
    search: "htools_admin_tool_search",
    sort: "htools_admin_tool_sort"
  },
  articles: {
    category: "htools_admin_article_category",
    search: "htools_admin_article_search",
    sort: "htools_admin_article_sort"
  },
  content: {
    category: "htools_admin_content_category",
    search: "htools_admin_content_search",
    sort: "htools_admin_content_sort",
    source: "htools_admin_content_source"
  },
  telegram: {
    sort: "htools_admin_telegram_push_sort"
  }
} as const;

function getStoredAdminSortMode(key: string): AdminSortMode {
  return localStorage.getItem(key) === "oldest" ? "oldest" : "latest";
}

function getStoredAdminFilter(key: string, fallback: string) {
  return localStorage.getItem(key) ?? fallback;
}

function AdminSortButton({
  mode,
  onChange,
  t
}: {
  mode: AdminSortMode;
  onChange: (mode: AdminSortMode) => void;
  t: Messages;
}) {
  const label = mode === "latest" ? t.admin.sortLatest : t.admin.sortOldest;
  const shortLabel =
    mode === "latest" ? t.admin.sortLatestShort : t.admin.sortOldestShort;

  return (
    <button className="ghost-button admin-sort-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onChange(mode === "latest" ? "oldest" : "latest")}
    >
      <ArrowDownUp size={16} />
      <span className="admin-sort-label admin-sort-label-full">{label}</span>
      <span className="admin-sort-label admin-sort-label-compact" aria-hidden="true">
        {shortLabel}
      </span>
    </button>
  );
}

function AdminFilterBar({
  categoryControl,
  clearLabel,
  hasActiveFilter,
  onClear,
  onSearchChange,
  searchPlaceholder,
  searchValue
}: {
  categoryControl: ReactNode;
  clearLabel: string;
  hasActiveFilter: boolean;
  onClear: () => void;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchValue: string;
}) {
  const searchFieldRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    function releaseSearchFocus(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      const searchField = searchFieldRef.current;
      const input = searchField?.querySelector<HTMLInputElement>("input");
      if (
        input &&
        document.activeElement === input &&
        !searchField?.contains(event.target as Node)
      ) {
        input.blur();
      }
    }

    document.addEventListener("pointerdown", releaseSearchFocus, true);
    return () => document.removeEventListener("pointerdown", releaseSearchFocus, true);
  }, []);

  return (
    <div className="admin-filter-row">
      {categoryControl}
      <div className="admin-search-row">
        <label className="admin-search-field" ref={searchFieldRef}>
          <Search size={16} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        <button className="ghost-button admin-clear-filter"
          disabled={!hasActiveFilter}
          type="button"
          onClick={onClear}
        >
          <Eraser size={16} />
          <span>{clearLabel}</span>
        </button>
      </div>
    </div>
  );
}

function EditorTopActions({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`tool-editor-top-actions ${className}`.trim()}>{children}</div>
  );
}

function PublishModeField({
  disabled = false,
  draftLabel,
  label,
  onChange,
  publishedLabel,
  value
}: {
  disabled?: boolean;
  draftLabel: string;
  label: string;
  onChange: (value: ConvertPublishMode) => void;
  publishedLabel: string;
  value: ConvertPublishMode;
}) {
  return (
    <div className="tool-form-field article-publish-mode-field">
      <span className="tool-form-label">{label}</span>
      <div
        className="admin-segmented-toggle"
        role="group"
      >
        {(["published", "draft"] as const).map((mode) => {
          const selected = value === mode;
          return (
            <button aria-pressed={selected}
              className={`admin-segmented-toggle-option ${
                selected ? "is-active" : ""
              }`}
              disabled={disabled}
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
            >
              <span>{mode === "published" ? publishedLabel : draftLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BooleanSegmentedToggle({
  className = "",
  disabled = false,
  disabledIcon,
  disabledLabel,
  enabledIcon,
  enabledLabel,
  mobileDisabledLabel,
  mobileEnabledLabel,
  singleOption = false,
  onChange,
  value
}: {
  className?: string;
  disabled?: boolean;
  disabledIcon?: ReactNode;
  disabledLabel: string;
  enabledIcon?: ReactNode;
  enabledLabel: string;
  mobileDisabledLabel?: string;
  mobileEnabledLabel?: string;
  onChange: (value: boolean) => void;
  singleOption?: boolean;
  value: boolean;
}) {
  return (
    <div
      className={`admin-segmented-toggle ${singleOption ? "is-single" : ""} ${className}`.trim()}
      role="group"
    >
      {(singleOption ? ([true] as const) : ([true, false] as const)).map((enabled) => {
        const selected = value === enabled;
        const optionIcon = enabled ? enabledIcon : disabledIcon;
        const mobileOptionLabel = enabled ? mobileEnabledLabel : mobileDisabledLabel;
        return (
          <button aria-pressed={selected}
            className={`admin-segmented-toggle-option ${
              optionIcon ? "has-icon" : ""
            } ${mobileOptionLabel ? "has-mobile-label" : ""} ${selected ? "is-active" : ""}`.trim()}
            disabled={disabled}
            key={String(enabled)}
            type="button"
            onClick={() => onChange(singleOption ? !value : enabled)}
          >
            {optionIcon ? <span className="field-assist-button-icon">{optionIcon}</span> : null}
            <span className="field-assist-button-label">
              {enabled ? enabledLabel : disabledLabel}
            </span>
            {mobileOptionLabel ? (
              <span className="field-assist-button-mobile-label">{mobileOptionLabel}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminApp({
  locale,
  onBackHome,
  onLocaleChange,
  onNotify,
  onProxySettingsChange,
  onSiteSettingsChange,
  onUmamiSettingsChange,
  onThemeChange,
  proxySettings,
  proxySettingsLoadError,
  proxySettingsReady,
  siteSettings,
  siteSettingsLoadError,
  siteSettingsReady,
  t,
  themeMode
}: {
  locale: Locale;
  onBackHome: () => void;
  onLocaleChange: (locale: Locale) => void;
  onNotify: (toast: ToastInput) => void;
  onProxySettingsChange: (settings: ProxySettings) => void;
  onSiteSettingsChange: (settings: SiteSettings) => void;
  onUmamiSettingsChange: (settings: UmamiSettings) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  proxySettings: ProxySettings;
  proxySettingsLoadError: unknown;
  proxySettingsReady: boolean;
  siteSettings: SiteSettings;
  siteSettingsLoadError: unknown;
  siteSettingsReady: boolean;
  t: Messages;
  themeMode: ThemeMode;
}) {
  usePointerFocusRelease();
  const {
    closeMenu: closeAdminMenu,
    getMenuId: getAdminMenuId,
    handleMenuKeyDown: handleAdminMenuKeyDown,
    handleTriggerKeyDown: handleAdminMenuTriggerKeyDown,
    openMenu: openAdminMenu,
    setOpenMenu: setOpenAdminMenu,
    toggleMenu: toggleAdminMenu
  } = useUtilityMenuKeyboard<"locale" | "theme">("admin");
  const adminUtilityMenuController = {
    closeMenu: closeAdminMenu,
    getMenuId: getAdminMenuId,
    handleMenuKeyDown: handleAdminMenuKeyDown,
    handleTriggerKeyDown: handleAdminMenuTriggerKeyDown,
    openMenu: openAdminMenu,
    toggleMenu: toggleAdminMenu
  };
  const [token, setToken] = useState(() => localStorage.getItem("htools_token") ?? "");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authConfig, setAuthConfig] = useState<AdminAuthConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [adminArticles, setAdminArticles] = useState<ArticleSummary[]>([]);
  const [adminArticlesHasMore, setAdminArticlesHasMore] = useState(false);
  const [adminArticlesTotal, setAdminArticlesTotal] = useState(0);
  const [adminArticleCategoryCounts, setAdminArticleCategoryCounts] =
    useState<Record<string, number>>({});
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [contentItems, setContentItems] = useState<ContentItemSummary[]>([]);
  const [contentItemsHasMore, setContentItemsHasMore] = useState(false);
  const [contentItemsTotal, setContentItemsTotal] = useState(0);
  const [contentSourceCounts, setContentSourceCounts] = useState<Record<string, number>>({});
  const [contentCategoryCounts, setContentCategoryCounts] =
    useState<Record<string, number>>({});
  const [adminCategorySettings, setAdminCategorySettings] =
    useState<AdminCategorySettings>(initialAdminCategorySettings);
  const [adminCategoryIcons, setAdminCategoryIcons] =
    useState<CategoryIconSettings>(createEmptyCategoryIconSettings);
  const [adminCategoryIconsReady, setAdminCategoryIconsReady] = useState(false);
  const [editingCategoryIcon, setEditingCategoryIcon] = useState<{
    scope: AdminCategoryScope;
    category: string;
  } | null>(null);
  const [categoryIconSaving, setCategoryIconSaving] = useState(false);
  const [categoryIconError, setCategoryIconError] = useState("");
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    available: false,
    enabled: false,
    target: "",
    footerMarkdown: ""
  });
  const [adminAiSettings, setAdminAiSettings] = useState<AdminAiSettings>({
    available: false,
    enabled: false,
    model: ADMIN_AI_MODELS[0]
  });
  const [adminAiSettingsLoading, setAdminAiSettingsLoading] = useState(
    Boolean(token)
  );
  const [adminAiSettingsLoadError, setAdminAiSettingsLoadError] =
    useState<unknown>(null);
  const [telegramSettingsLoading, setTelegramSettingsLoading] = useState(
    Boolean(token)
  );
  const [telegramSettingsLoadError, setTelegramSettingsLoadError] =
    useState<unknown>(null);
  const [telegramPushRecords, setTelegramPushRecords] = useState<TelegramPushRecord[]>([]);
  const [telegramPushCategoryOptions, setTelegramPushCategoryOptions] = useState<string[]>([]);
  const [telegramPushCategory, setTelegramPushCategory] = useState("All");
  const [telegramPushSearch, setTelegramPushSearch] = useState("");
  const [telegramPushSortMode, setTelegramPushSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.telegram.sort)
  );
  const [debouncedTelegramPushSearch, setDebouncedTelegramPushSearch] = useState("");
  const [telegramPushHasMore, setTelegramPushHasMore] = useState(false);
  const [isLoadingTelegramPushes, setIsLoadingTelegramPushes] = useState(false);
  const [isLoadingMoreTelegramPushes, setIsLoadingMoreTelegramPushes] = useState(false);
  const [hasLoadedTelegramPushes, setHasLoadedTelegramPushes] = useState(false);
  const [telegramPushLoadError, setTelegramPushLoadError] = useState<string | null>(null);
  const [viewingTelegramPush, setViewingTelegramPush] =
    useState<TelegramPushRecord | null>(null);
  const [browsingArticle, setBrowsingArticle] = useState<ArticleSummary | null>(
    null
  );
  const [browsingArticleDetail, setBrowsingArticleDetail] =
    useState<Article | null>(null);
  const [browsingArticleError, setBrowsingArticleError] = useState("");
  const [browsingArticleLoading, setBrowsingArticleLoading] = useState(false);
  const browsingArticleRequestRef = useRef(0);
  const [pendingDeleteTelegramPush, setPendingDeleteTelegramPush] =
    useState<TelegramPushRecord | null>(null);
  const [isDeletingTelegramPush, setIsDeletingTelegramPush] = useState(false);
  const [pendingPushTelegramRecord, setPendingPushTelegramRecord] =
    useState<TelegramPushRecord | null>(null);
  const [isPushingTelegramRecord, setIsPushingTelegramRecord] = useState(false);
  const [pendingTelegramUncertainRetry, setPendingTelegramUncertainRetry] =
    useState<TelegramUncertainRetry | null>(null);
  const [pendingTelegramResend, setPendingTelegramResend] =
    useState<"deleted" | "target-changed" | null>(null);
  const [pendingTelegramSourceSync, setPendingTelegramSourceSync] = useState(false);
  const [telegramResource, setTelegramResource] = useState<TelegramPushResource | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<TelegramMessage | null>(null);
  const [isCreatingTelegramPush, setIsCreatingTelegramPush] = useState(false);
  const [telegramQuickResource, setTelegramQuickResource] =
    useState<TelegramPushResource | null>(null);
  const [telegramQuickMessage, setTelegramQuickMessage] =
    useState<TelegramMessage | null>(null);
  const [telegramQuickMode, setTelegramQuickMode] =
    useState<ConvertPublishMode>("published");
  const [telegramQuickCategory, setTelegramQuickCategory] = useState("");
  const [telegramQuickLoading, setTelegramQuickLoading] = useState(false);
  const [telegramQuickSaving, setTelegramQuickSaving] = useState(false);
  const [telegramCustomTitle, setTelegramCustomTitle] = useState("");
  const [telegramDescription, setTelegramDescription] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [telegramDemoUrl, setTelegramDemoUrl] = useState("");
  const [telegramImage, setTelegramImage] = useState("");
  const [telegramCategory, setTelegramCategory] = useState("");
  const [telegramTagText, setTelegramTagText] = useState("");
  const [telegramSourceLoading, setTelegramSourceLoading] = useState(false);
  const [telegramBodyMarkdown, setTelegramBodyMarkdown] = useState("");
  const [telegramMediaEnabled, setTelegramMediaEnabled] = useState(false);
  const [telegramMediaUrl, setTelegramMediaUrl] = useState("");
  const [telegramMarkdownEditorMode, setTelegramMarkdownEditorMode] =
    useState<MarkdownEditorMode>();
  const [telegramMessageLoading, setTelegramMessageLoading] = useState(false);
  const [telegramMessageSaving, setTelegramMessageSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingContentSource, setEditingContentSource] =
    useState<ContentSource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [articleFormOpen, setArticleFormOpen] = useState(false);
  const [contentSourceFormOpen, setContentSourceFormOpen] = useState(false);
  const toolEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const articleEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const contentSourceEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const contentConvertCloseRequestRef = useRef<(() => void) | null>(null);
  const articlePublishTimeRef = useRef<HTMLInputElement>(null);
  const [adminView, setAdminView] = useState<AdminView>(() => getInitialAdminView());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("htools_admin_sidebar") === "collapsed"
  );
  const [isMobileSidebarViewport, setIsMobileSidebarViewport] = useState(() =>
    window.matchMedia("(max-width: 920px)").matches
  );
  const [isContentReaderViewport, setIsContentReaderViewport] = useState(() =>
    window.matchMedia("(min-width: 1201px)").matches
  );
  const [adminSearch, setAdminSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.search, "")
  );
  const [articleSearch, setArticleSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, "")
  );
  const [debouncedArticleSearch, setDebouncedArticleSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, "").trim()
  );
  const [articleCategoryFilter, setArticleCategoryFilter] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.category, "All")
    )
  );
  const [contentSearch, setContentSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, "")
  );
  const [debouncedContentSearch, setDebouncedContentSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, "").trim()
  );
  const [contentCategoryFilter, setContentCategoryFilter] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.category, "All")
    )
  );
  const [contentSourceFilter, setContentSourceFilter] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.source, "all")
  );
  const [contentRailCategory, setContentRailCategory] = useState<string | null>(
    null
  );
  const [adminCategory, setAdminCategory] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.category, "All")
    )
  );
  const [toolSortMode, setToolSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.sort)
  );
  const [articleSortMode, setArticleSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.sort)
  );
  const [contentSortMode, setContentSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.content.sort)
  );
  const [form, setForm] = useState<ToolInput>(initialForm);
  const [toolTagText, setToolTagText] = useState(() =>
    formatTagInputText(initialForm.tags)
  );
  const [articleForm, setArticleForm] = useState<ArticleInput>(initialArticleForm);
  const [pendingAiDocumentImport, setPendingAiDocumentImport] = useState<string | null>(null);
  const [articleTagText, setArticleTagText] = useState(() =>
    formatTagInputText(initialArticleForm.tags)
  );
  const [contentSourceForm, setContentSourceForm] = useState<ContentSourceInput>(
    initialContentSourceForm
  );
  const [contentSourceTagText, setContentSourceTagText] = useState(() =>
    formatTagInputText(initialContentSourceForm.tags)
  );
  const [contentPreview, setContentPreview] = useState<FeedPreview | null>(null);
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  const contentPreviewAbortRef = useRef<AbortController | null>(null);
  const contentPreviewRequestRef = useRef(0);
  const contentPreviewAppliedTitleRef = useRef("");
  const adminContentScrollRef = useRef<HTMLDivElement>(null);
  const [authStatus, setAuthStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isArticleSaving, setIsArticleSaving] = useState(false);
  const [isContentSourceSaving, setIsContentSourceSaving] = useState(false);
  const [isContentPreviewing, setIsContentPreviewing] = useState(false);
  const [pendingDeleteTool, setPendingDeleteTool] = useState<Tool | null>(null);
  const [pendingDeleteArticle, setPendingDeleteArticle] =
    useState<ArticleSummary | null>(null);
  const [pendingFeaturedTool, setPendingFeaturedTool] = useState<Tool | null>(null);
  const [pendingPublishedArticle, setPendingPublishedArticle] =
    useState<ArticleSummary | null>(null);
  const [pendingDeleteContentSource, setPendingDeleteContentSource] =
    useState<ContentSource | null>(null);
  const [pendingCategoryAction, setPendingCategoryAction] =
    useState<PendingAdminCategoryAction | null>(null);
  const [pendingConvertItem, setPendingConvertItem] =
    useState<ContentItemSummary | null>(null);
  const [convertArticleCategory, setConvertArticleCategory] = useState("");
  const [convertArticlePreview, setConvertArticlePreview] = useState<Article | null>(null);
  const [convertArticlePreviewLoading, setConvertArticlePreviewLoading] = useState(false);
  const [convertArticlePreviewError, setConvertArticlePreviewError] = useState("");
  const [convertPublishMode, setConvertPublishMode] =
    useState<ConvertPublishMode>("published");
  const [categoryActionTarget, setCategoryActionTarget] = useState("");
  const [isDeletingTool, setIsDeletingTool] = useState(false);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);
  const [isDeletingContentSource, setIsDeletingContentSource] = useState(false);
  const [isApplyingCategoryAction, setIsApplyingCategoryAction] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(Boolean(token));
  const [isLoadingArticles, setIsLoadingArticles] = useState(Boolean(token));
  const [isLoadingMoreArticles, setIsLoadingMoreArticles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(Boolean(token));
  const [isLoadingMoreContent, setIsLoadingMoreContent] = useState(false);
  const [hasLoadedTools, setHasLoadedTools] = useState(false);
  const [hasLoadedArticles, setHasLoadedArticles] = useState(false);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);
  const [toolsLoadError, setToolsLoadError] = useState<string | null>(null);
  const [articlesLoadError, setArticlesLoadError] = useState<string | null>(null);
  const [contentLoadError, setContentLoadError] = useState<string | null>(null);
  const [contentSourcesLoadError, setContentSourcesLoadError] = useState<string | null>(null);
  const [writeLockedEntityKeys, setWriteLockedEntityKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  const mobileSidebarCloseRef = useRef<HTMLButtonElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const writeActionLocksRef = useRef(new Set<string>());
  const adminCategorySettingsRef = useRef(adminCategorySettings);
  const adminCategoryLoadRequestRef = useRef(0);
  const categoryIconSaveRef = useRef(false);
  const categoryIconGenerationRef = useRef(0);
  const adminCategorySaveGenerationRef = useRef<Record<AdminCategoryScope, number>>({
    tools: 0,
    articles: 0,
    push: 0,
    content: 0
  });
  const adminCategorySavePendingRef = useRef(new Set<AdminCategoryScope>());
  const adminCategorySaveRunningRef = useRef(false);
  const adminCategoryRollbackRef = useRef<Partial<Record<AdminCategoryScope, string[]>>>({});
  const adminToolsRequestGenerationRef = useRef(0);
  const adminArticlesRequestGenerationRef = useRef(0);
  const adminArticlesNextCursorRef = useRef<string | null>(null);
  const adminArticlesLoadingCursorRef = useRef<string | null>(null);
  const articleEditorLoadRequestRef = useRef(0);
  const contentConvertPreviewRequestRef = useRef(0);
  const contentItemsRequestGenerationRef = useRef(0);
  const contentItemsNextCursorRef = useRef<string | null>(null);
  const contentItemsLoadingCursorRef = useRef<string | null>(null);
  const contentSourcesLoadedRef = useRef(false);
  // 订阅源有自己的请求轮次,和内容列表那一套分开:内容列表的轮次会因为筛选、
  // 搜索、游标变化而增长,而订阅源列表和这些条件无关,不该被内容那边的轮次作废。
  const contentSourcesRequestGenerationRef = useRef(0);
  const mutationRefreshGenerationRef = useRef(0);
  const telegramSettingsLoadRequestRef = useRef(0);
  const telegramSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const adminAiSettingsLoadRequestRef = useRef(0);
  const adminAiSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const telegramPushRequestGenerationRef = useRef(0);
  const telegramPushNextCursorRef = useRef<string | null>(null);
  const telegramPushLoadingCursorRef = useRef<string | null>(null);
  const sidebarAnimationTimer = useRef<number | null>(null);
  const mobileSidebarFocus = useOverlayFocusManagement({
    active: mobileSidebarOpen,
    containerRef: mobileSidebarRef,
    initialFocusRef: mobileSidebarCloseRef,
    onEscape: closeMobileSidebar,
    returnFocusRef: sidebarToggleRef
  });
  const telegramGitHub = useAdminGitHubMetadata({
    active: Boolean(
      telegramResource?.type === "tool" || telegramResource?.type === "custom"
    ),
    autoApply: telegramResource?.type === "custom" && isCreatingTelegramPush,
    autoLoad: telegramResource?.type === "custom" && isCreatingTelegramPush,
    onError: (error) => setStatus(getLocalizedErrorMessage(error, t)),
    getSnapshot: () => ({
      name: telegramCustomTitle,
      description: telegramDescription,
      url: telegramUrl,
      demoUrl: telegramDemoUrl,
      image: telegramImage,
      tags: parseArticleTagsInput(telegramTagText)
    }),
    onMetadata: (
      metadata,
      normalizedUrl,
      previousMetadata,
      overwrite,
      requestSnapshot
    ) => {
      const nextFields = applyGitHubMetadataToFields(
        {
          name: telegramCustomTitle,
          description: telegramDescription,
          url: telegramUrl,
          demoUrl: telegramDemoUrl,
          image: telegramImage,
          tags: parseArticleTagsInput(telegramTagText)
        },
        metadata,
        normalizedUrl,
        previousMetadata,
        overwrite,
        requestSnapshot
      );
      setTelegramCustomTitle(nextFields.name);
      setTelegramDescription(nextFields.description);
      setTelegramUrl(nextFields.url);
      setTelegramDemoUrl(nextFields.demoUrl);
      setTelegramImage(nextFields.image);
      setTelegramMediaUrl(nextFields.image);
      setTelegramTagText(formatTagInputText(nextFields.tags));
      setTelegramBodyMarkdown((current) => {
        let next = current;
        next = syncTelegramBodyField(
          next,
          { title: nextFields.name },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { description: nextFields.description },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { url: nextFields.url, resourceType: telegramResource?.type ?? "custom" },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { demoUrl: nextFields.demoUrl },
          telegramSettings.footerMarkdown,
          locale
        );
        return syncTelegramBodyField(
          next,
          { tags: nextFields.tags },
          telegramSettings.footerMarkdown,
          locale
        );
      });
    },
    onSuccess: () => setStatus(t.status.githubMetadataApplied),
    sourceUrl: telegramUrl,
    token
  });
  const toolGitHub = useAdminGitHubMetadata({
    active: formOpen,
    autoApply: !editingTool,
    autoLoad: true,
    getSnapshot: () => ({
      name: form.name,
      description: form.description,
      url: form.url,
      demoUrl: form.demoUrl,
      image: form.image,
      tags: form.tags
    }),
    onError: (error) => setStatus(getLocalizedErrorMessage(error, t)),
    onMetadata: (metadata, normalizedUrl, previousMetadata, overwrite, requestSnapshot) => {
      setForm((current) => applyGitHubMetadataToForm(
        current,
        metadata,
        normalizedUrl,
        previousMetadata,
        overwrite,
        requestSnapshot
      ));
    },
    onSuccess: () => setStatus(t.status.githubMetadataApplied),
    sourceUrl: form.url,
    token
  });
  const siteName = getSiteDisplayName(siteSettings);
  const maintenanceText = getAdminMaintenanceText(locale);
  const workspaceText = getAdminWorkspaceText(locale);
  const categoryText = workspaceText.category;
  const articleText = getArticleText(locale);
  const telegramText = getTelegramText(locale);
  const isTelegramPushConfirmBusy = pendingTelegramUncertainRetry?.context === "quick"
    ? telegramQuickSaving
    : pendingTelegramUncertainRetry?.context === "editor"
      ? telegramMessageSaving
      : isPushingTelegramRecord;
  const telegramPushConfirmDescription = pendingTelegramUncertainRetry
    ? isTelegramPushConfirmBusy
      ? telegramText.uncertainRetryPending
      : pendingTelegramUncertainRetry.retried
        ? telegramText.uncertainRetryFailed
        : telegramText.uncertainRetryDescription
    : isPushingTelegramRecord
      ? telegramText.pushPending
      : telegramText.management.pushConfirmDescription;

  function getAiAppliedStatus(result: {
    githubRepository?: string;
  }) {
    if (result.githubRepository) {
      return maintenanceText.aiAppliedWithGitHub(result.githubRepository);
    }
    return maintenanceText.aiApplied;
  }

  function closeMobileSidebar() {
    setOpenAdminMenu(null);
    setMobileSidebarOpen(false);
  }

  function commitAdminCategorySettings(settings: AdminCategorySettings) {
    adminCategorySettingsRef.current = settings;
    setAdminCategorySettings(settings);
  }

  async function flushAdminCategorySaves() {
    if (adminCategorySaveRunningRef.current) return;
    adminCategorySaveRunningRef.current = true;

    try {
      while (adminCategorySavePendingRef.current.size > 0) {
        const scope = adminCategorySavePendingRef.current.values().next()
          .value as AdminCategoryScope;
        adminCategorySavePendingRef.current.delete(scope);
        const generation = adminCategorySaveGenerationRef.current[scope];
        const nextCategories = [...adminCategorySettingsRef.current[scope]];

        try {
          const saved = await saveAdminCategorySettings(
            { [scope]: nextCategories },
            token
          );
          if (adminCategorySaveGenerationRef.current[scope] === generation) {
            commitAdminCategorySettings({
              ...adminCategorySettingsRef.current,
              [scope]: saved[scope]
            });
            delete adminCategoryRollbackRef.current[scope];
          }
        } catch (error) {
          if (adminCategorySaveGenerationRef.current[scope] === generation) {
            const previousCategories = adminCategoryRollbackRef.current[scope];
            if (previousCategories) {
              commitAdminCategorySettings({
                ...adminCategorySettingsRef.current,
                [scope]: previousCategories
              });
            }
            delete adminCategoryRollbackRef.current[scope];
            setStatus(getLocalizedErrorMessage(error, t));
          }
        }
      }
    } finally {
      adminCategorySaveRunningRef.current = false;
      if (adminCategorySavePendingRef.current.size > 0) {
        void flushAdminCategorySaves();
      }
    }
  }

  function persistAdminCategoryScope(
    scope: AdminCategoryScope,
    nextCategories: string[],
    previousCategories: string[]
  ) {
    const generation = adminCategorySaveGenerationRef.current[scope] + 1;
    adminCategorySaveGenerationRef.current[scope] = generation;
    if (!adminCategoryRollbackRef.current[scope]) {
      adminCategoryRollbackRef.current[scope] = [...previousCategories];
    }
    const optimisticSettings = {
      ...adminCategorySettingsRef.current,
      [scope]: nextCategories
    };
    commitAdminCategorySettings(optimisticSettings);
    adminCategorySavePendingRef.current.add(scope);
    void flushAdminCategorySaves();
  }

  async function waitForAdminCategorySaves() {
    while (
      adminCategorySaveRunningRef.current ||
      adminCategorySavePendingRef.current.size > 0
    ) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    }
  }

  function acquireWriteAction(key: string) {
    if (writeActionLocksRef.current.has(key)) return false;
    writeActionLocksRef.current.add(key);
    setWriteLockedEntityKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    return true;
  }

  function releaseWriteAction(key: string) {
    writeActionLocksRef.current.delete(key);
    setWriteLockedEntityKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function isWriteEntityLocked(scope: AdminWriteEntityScope, id: string) {
    return writeActionLocksRef.current.has(getAdminWriteEntityKey(scope, id));
  }

  const contentText = getContentFlowText(locale);
  const telegramPreviewMarkdown = telegramResource
    ? telegramBodyMarkdown
    : "";
  const telegramEditedResource = telegramResource ? {
    ...telegramResource,
    title: telegramCustomTitle.trim(),
    description: telegramDescription.trim(),
    url: telegramUrl.trim(),
    demoUrl: telegramDemoUrl.trim(),
    image: telegramImage.trim(),
    category: getTelegramStoredCategory(telegramCategory),
    tags: parseArticleTagsInput(telegramTagText)
  } : null;
  const telegramPreviewLength = countTelegramMessageCharacters(
    telegramPreviewMarkdown
  );
  const telegramContentLimit = telegramMediaEnabled
    ? TELEGRAM_PHOTO_CAPTION_LIMIT
    : TELEGRAM_MESSAGE_LIMIT;
  const telegramCustomTitleMissing =
    Boolean(telegramResource) && !telegramCustomTitle.trim();
  const normalizedTelegramMediaUrl = normalizeHttpUrlInput(telegramMediaUrl);
  const telegramMediaValid = !telegramMediaEnabled || (
    Boolean(normalizedTelegramMediaUrl) &&
    isValidHttpUrl(normalizedTelegramMediaUrl)
  );
  const telegramEditorDirty = Boolean(telegramMessage && (
    telegramBodyMarkdown !== telegramMessage.bodyMarkdown ||
    telegramMediaEnabled !== telegramMessage.mediaEnabled ||
    telegramMediaUrl !== telegramMessage.mediaUrl ||
    JSON.stringify(telegramEditedResource) !== JSON.stringify(telegramMessage.resource)
  ));
  const activeTitle =
    adminView === "articles"
      ? articleText.adminNav
      : adminView === "content"
        ? contentText.nav
        : adminView === "push"
          ? telegramText.management.nav
        : adminView === "import-export"
          ? maintenanceText.importExportTab
          : adminView === "link-check"
            ? maintenanceText.linkCheckTab
            : adminView === "system"
              ? maintenanceText.systemTitle
              : t.admin.toolLibrary;
  const activeDocumentTitle =
    adminView === "system"
      ? getAdminSystemSettingsGroupTitle(
          getInitialAdminSystemSettingsGroup(),
          maintenanceText
        )
      : activeTitle;
  const isConvertingContentItem = pendingConvertItem
    ? writeLockedEntityKeys.has(
        getAdminWriteEntityKey("content-item", pendingConvertItem.id)
      )
    : false;
  const showAdminToolSkeletons = useLoadingSkeleton(isLoadingTools && !hasLoadedTools);
  const showAdminArticleSkeletons = useLoadingSkeleton(
    isLoadingArticles && !hasLoadedArticles
  );
  const showAdminContentSkeletons = useLoadingSkeleton(
    isLoadingContent && !hasLoadedContent
  );
  const isInitialTelegramPushLoad =
    adminView === "push" && !hasLoadedTelegramPushes;
  const showTelegramPushSkeletons = isInitialTelegramPushLoad;
  const canFillGitHubMetadata = toolGitHub.canLoad;
  const githubMetadataDetailText = getGitHubMetadataDetailText(locale);

  useEffect(() => {
    const requestId = browsingArticleRequestRef.current + 1;
    browsingArticleRequestRef.current = requestId;

    if (!browsingArticle) {
      setBrowsingArticleDetail(null);
      setBrowsingArticleError("");
      setBrowsingArticleLoading(false);
      return;
    }

    setBrowsingArticleDetail(null);
    setBrowsingArticleError("");
    setBrowsingArticleLoading(true);

    void loadAdminArticle(browsingArticle.id, token)
      .then((article) => {
        if (browsingArticleRequestRef.current === requestId) {
          setBrowsingArticleDetail(article);
        }
      })
      .catch((error) => {
        if (browsingArticleRequestRef.current === requestId) {
          setBrowsingArticleError(getLocalizedErrorMessage(error, t));
        }
      })
      .finally(() => {
        if (browsingArticleRequestRef.current === requestId) {
          setBrowsingArticleLoading(false);
        }
      });
  }, [browsingArticle, t, token]);

  const setStatus = useCallback((message: string) => {
    if (!token) {
      setAuthStatus(message);
      return;
    }
    setAuthStatus("");
    if (message) onNotify({ message, tone: "info" });
  }, [onNotify, token]);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileLoadError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileTokenChange = useCallback((nextToken: string) => {
    setTurnstileToken(nextToken);
  }, []);

  useEffect(() => {
    if (token) return;

    let active = true;
    setAuthConfig(null);
    setTurnstileToken("");

    void loadAdminAuthConfig()
      .then((config) => {
        if (active) setAuthConfig(config);
      })
      .catch((error) => {
        if (!active) return;
        setStatus(getLocalizedErrorMessage(error, t));
      });

    return () => {
      active = false;
    };
  }, [setStatus, t, token]);

  useEffect(() => {
    function handleUnauthorized() {
      localStorage.removeItem("htools_token");
      setAuthStatus(t.status.sessionExpired);
      setPassword("");
      setIsLoggingIn(false);
      setMobileSidebarOpen(false);
      setOpenAdminMenu(null);
      setToken("");

      window.requestAnimationFrame(() => passwordInputRef.current?.focus());
    }

    window.addEventListener("htools:admin-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("htools:admin-unauthorized", handleUnauthorized);
    };
  }, [t.status.sessionExpired]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.sort, toolSortMode);
  }, [toolSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.sort, articleSortMode);
  }, [articleSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.sort, contentSortMode);
  }, [contentSortMode]);

  useEffect(() => {
    localStorage.setItem(
      ADMIN_VIEW_STATE_STORAGE_KEYS.telegram.sort,
      telegramPushSortMode
    );
  }, [telegramPushSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.search, adminSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.category, adminCategory);
  }, [adminCategory, adminSearch]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, articleSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.category, articleCategoryFilter);
  }, [articleCategoryFilter, articleSearch]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, contentSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.category, contentCategoryFilter);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.source, contentSourceFilter);
  }, [contentCategoryFilter, contentSearch, contentSourceFilter]);

  function moveGitHubUrlFromName(value: string) {
    const normalizedUrl = normalizeHttpUrlInput(value);

    if (!isGitHubRepoUrl(normalizedUrl)) return false;

    toolGitHub.reset(normalizedUrl);
    setForm((current) => ({
      ...current,
      name: "",
      url: normalizedUrl
    }));

    return true;
  }

  async function refreshAdminCategories(options: AdminRefreshOptions = {}): Promise<AdminRefreshResult> {
    const requestId = adminCategoryLoadRequestRef.current + 1;
    adminCategoryLoadRequestRef.current = requestId;
    const generations = { ...adminCategorySaveGenerationRef.current };
    const iconGeneration = categoryIconGenerationRef.current;
    try {
      const { settings, icons } = await loadAdminCategoryConfiguration(token);
      if (
        adminCategoryLoadRequestRef.current === requestId &&
        categoryIconGenerationRef.current === iconGeneration &&
        !categoryIconSaveRef.current
      ) {
        setAdminCategoryIcons(icons);
        setAdminCategoryIconsReady(true);
      }
      if (
        adminCategoryLoadRequestRef.current !== requestId ||
        (Object.keys(generations) as AdminCategoryScope[]).some(
          (scope) =>
            adminCategorySaveGenerationRef.current[scope] !== generations[scope]
        )
      ) {
        return "superseded";
      }
      commitAdminCategorySettings(settings);
      return "success";
    } catch (error) {
      if (
        adminCategoryLoadRequestRef.current === requestId &&
        (Object.keys(generations) as AdminCategoryScope[]).every(
          (scope) =>
            adminCategorySaveGenerationRef.current[scope] === generations[scope]
        )
      ) {
        if (options.reportError !== false) setStatus(categoryText.loadFailed);
        return "failed";
      }
      return "superseded";
    }
  }

  async function editCategoryIcon(scope: AdminCategoryScope, category: string) {
    if (!isEditableCategoryIconCategory(category) || categoryIconSaveRef.current || isApplyingCategoryAction) return;
    const generation = categoryIconGenerationRef.current;
    const returnFocusTarget = getDialogReturnFocusTarget(document.activeElement);
    if (!adminCategoryIconsReady && await refreshAdminCategories() !== "success") return;
    if (categoryIconGenerationRef.current !== generation) return;
    rememberNextDialogReturnFocus(returnFocusTarget);
    setCategoryIconError("");
    setEditingCategoryIcon({ scope, category });
  }

  async function submitCategoryIcon(icon: CategoryIconValue | null) {
    if (!editingCategoryIcon || categoryIconSaveRef.current) return;
    categoryIconSaveRef.current = true;
    const generation = ++categoryIconGenerationRef.current;
    setCategoryIconSaving(true);
    setCategoryIconError("");
    try {
      const icons = await saveAdminCategoryIcon(
        token, editingCategoryIcon.scope, editingCategoryIcon.category, icon
      );
      if (categoryIconGenerationRef.current !== generation) return;
      setAdminCategoryIcons(icons);
      setAdminCategoryIconsReady(true);
      setEditingCategoryIcon(null);
      setStatus(t.categoryIcons.saved);
    } catch (error) {
      if (categoryIconGenerationRef.current === generation) {
        setCategoryIconError(getLocalizedErrorMessage(error, t, t.categoryIcons.saveFailed));
      }
    } finally {
      if (categoryIconGenerationRef.current === generation) {
        categoryIconSaveRef.current = false;
        setCategoryIconSaving(false);
      }
    }
  }

  function categoryIconProps(scope: AdminCategoryScope) {
    return {
      categoryIcons: adminCategoryIcons[scope],
      onEditIcon: (category: string) => { void editCategoryIcon(scope, category); }
    };
  }

  useEffect(() => {
    setEditingCategoryIcon(null);
    setCategoryIconSaving(false);
    setCategoryIconError("");
    setAdminCategoryIconsReady(false);
    return () => {
      categoryIconGenerationRef.current += 1;
      categoryIconSaveRef.current = false;
    };
  }, [token]);

  async function rememberAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    const currentSettings = adminCategorySettingsRef.current;
    const nextSettings = addAdminCategorySetting(
      currentSettings,
      scope,
      category
    );

    if (nextSettings === currentSettings) {
      return;
    }

    await persistAdminCategoryScope(
      scope,
      nextSettings[scope],
      currentSettings[scope]
    );
  }

  async function moveAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    if (scope === "push" && TELEGRAM_PUSH_FIXED_FILTERS.includes(normalizeAdminCategoryValue(category))) {
      return;
    }
    const currentSettings = adminCategorySettingsRef.current;
    const currentCategories =
      scope === "tools"
        ? adminFilterCategories
        : scope === "articles"
          ? articleFilterCategories
          : scope === "push"
            ? pushExistingCategories
            : contentFilterCategories;
    const nextOrder = moveAdminCategoryInList(
      currentCategories,
      category
    );

    if (
      nextOrder.length === currentSettings[scope].length &&
      nextOrder.every((item, index) => item === currentSettings[scope][index])
    ) {
      return;
    }

    await persistAdminCategoryScope(
      scope,
      nextOrder,
      currentSettings[scope]
    );
  }

  async function deleteAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (
      isAllCategoryValue(normalized) ||
      (scope === "push" && isTelegramPushSourceFilter(normalized))
    ) {
      setPendingCategoryAction({
        category: normalized,
        contentCount: getAdminCategoryContentCount(scope, normalized),
        sourceCount: getAdminCategorySourceCount(scope, normalized),
        scope
      });
      setCategoryActionTarget("");
      return;
    }

    if (scope === "tools" && isFeaturedCategoryValue(normalized)) {
      await applyCategoryAction(scope, normalized, "delete", "");
      return;
    }

    if (!isPersistableAdminCategory(normalized)) {
      return;
    }

    const contentCount = getAdminCategoryContentCount(scope, normalized);
    const sourceCount = getAdminCategorySourceCount(scope, normalized);
    // 订阅内容删分类会连该分类下的订阅源一起删,所以"要不要弹确认"必须把订阅源算上:
    // 一个"有订阅、还没同步出内容"的分类内容数是 0,只看内容就会静默删掉它的订阅源。
    // 推送只加载当前页，不能用这一页的零条记录断言分类为空。
    const hasDeletablePayload =
      scope === "push" || (scope === "content"
        ? hasDeletableContentCategoryPayload(contentCount, sourceCount)
        : contentCount > 0);

    if (hasDeletablePayload) {
      setPendingCategoryAction({
        category: normalized,
        contentCount,
        sourceCount,
        scope
      });
      setCategoryActionTarget(getDefaultCategoryActionTarget(scope, normalized));
      return;
    }

    await applyCategoryAction(scope, normalized, "delete", "");
  }

  function getAdminCategoryContentCount(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (isAllCategoryValue(normalized)) {
      if (scope === "tools") {
        return tools.length;
      }

      if (scope === "articles") {
        return Object.values(adminArticleCategoryCounts).reduce(
          (total, count) => total + count,
          0
        );
      }

      if (scope === "push") return telegramPushRecords.length;

      return countContentCategoryItems(contentCategoryCounts, normalized);
    }

    if (scope === "tools") {
      if (isFeaturedCategoryValue(normalized)) {
        return tools.filter((tool) => tool.featured).length;
      }

      return tools.filter(
        (tool) => normalizeAdminCategoryValue(tool.category) === normalized
      ).length;
    }

    if (scope === "articles") {
      return Object.entries(adminArticleCategoryCounts).reduce(
        (total, [name, count]) =>
          normalizeAdminCategoryValue(name) === normalized ? total + count : total,
        0
      );
    }

    if (scope === "push") {
      const resourceType = getTelegramPushFilterResourceType(normalized);
      if (resourceType) {
        return telegramPushRecords.filter(
          (record) => record.resourceType === resourceType
        ).length;
      }

      return telegramPushRecords.filter((record) =>
        normalizeAdminCategoryValue(record.resource?.category ?? "") === normalized
      ).length;
    }

    return countContentCategoryItems(contentCategoryCounts, normalized);
  }

  // 这个数字只给"要不要弹确认"和弹窗文案里的"几个订阅"用,不参与"几条内容"。
  // 两者分开的理由见 admin-helpers.ts 里 countContentCategoryItems 上面那段注释。
  function getAdminCategorySourceCount(
    scope: AdminCategoryScope,
    category: string
  ) {
    if (scope !== "content") return 0;

    return countContentCategorySources(contentSources, category);
  }

  function getCategoryActionOptions(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (isAllCategoryValue(normalized)) {
      return [];
    }

    const categories =
      scope === "tools"
        ? adminFilterCategories
        : scope === "articles"
          ? articleExistingCategories
          : scope === "push"
            ? pushExistingCategories
            : contentExistingCategories;

    return categories.filter((item) => {
      const next = normalizeAdminCategoryValue(item);

      return (
        next &&
        next !== normalized &&
        next !== "All" &&
        next !== ADMIN_FEATURED_CATEGORY
      );
    });
  }

  function getDefaultCategoryActionTarget(
    scope: AdminCategoryScope,
    category: string
  ) {
    return getCategoryActionOptions(scope, category)[0] ?? "";
  }

  function syncCategoryStateAfterAction(
    scope: AdminCategoryScope,
    category: string,
    targetCategory: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);
    const replacement = targetCategory
      ? normalizeAdminCategoryValue(targetCategory)
      : "";

    if (scope === "tools") {
      if (normalizeAdminCategoryValue(adminCategory) === normalized) {
        setAdminCategory(replacement || "All");
      }

      if (normalizeAdminCategoryValue(form.category) === normalized) {
        setForm((current) => ({ ...current, category: replacement }));
      }

      return;
    }

    if (scope === "articles") {
      if (normalizeAdminCategoryValue(articleCategoryFilter) === normalized) {
        setArticleCategoryFilter(replacement || "All");
      }

      if (normalizeAdminCategoryValue(articleForm.category) === normalized) {
        setArticleForm((current) => ({ ...current, category: replacement }));
      }

      if (normalizeAdminCategoryValue(convertArticleCategory) === normalized) {
        setConvertArticleCategory(replacement);
      }

      return;
    }

    if (scope === "push" && TELEGRAM_PUSH_FIXED_FILTERS.includes(normalized)) {
      return;
    }

    if (scope === "push") {
      if (normalizeAdminCategoryValue(telegramPushCategory) === normalized) {
        setTelegramPushCategory(replacement || "All");
      }
      if (normalizeAdminCategoryValue(telegramCategory) === normalized) {
        setTelegramCategory(replacement);
      }
      if (normalizeAdminCategoryValue(telegramQuickCategory) === normalized) {
        setTelegramQuickCategory(replacement);
      }
      return;
    }

    if (normalizeAdminCategoryValue(contentCategoryFilter) === normalized) {
      setContentCategoryFilter(replacement || "All");
      setContentSourceFilter("all");
    }

    setContentRailCategory((current) =>
      current && normalizeAdminCategoryValue(current) === normalized
        ? normalizeAdminCategoryValue(replacement) || null
        : current
    );

    if (normalizeAdminCategoryValue(contentSourceForm.category) === normalized) {
      setContentSourceForm((current) => ({
        ...current,
        category: replacement
      }));
    }
  }

  async function applyCategoryAction(
    scope: AdminCategoryScope,
    category: string,
    action: AdminCategoryAction,
    targetCategory: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);
    const target = targetCategory ? normalizeAdminCategoryValue(targetCategory) : "";

    if (action === "migrate") {
      if (!target || target === normalized || !isPersistableAdminCategory(target)) {
        setStatus(categoryText.migrationTargetRequired);
        return;
      }
    }

    setIsApplyingCategoryAction(true);

    try {
      await waitForAdminCategorySaves();
      const result = await applyAdminCategoryAction(
        scope,
        normalized,
        action,
        target,
        token
      );

      adminCategorySaveGenerationRef.current[scope] += 1;
      categoryIconGenerationRef.current += 1;
      commitAdminCategorySettings(result.settings);
      if (result.icons) setAdminCategoryIcons(result.icons);
      syncCategoryStateAfterAction(
        scope,
        normalized,
        action === "migrate" ? target : ""
      );
      setPendingCategoryAction(null);
      setCategoryActionTarget("");

      const resultMessage =
        action === "migrate"
          ? getAdminCategoryMigratedText(categoryText, t, normalized, target, result.affected)
          : scope === "push" && isTelegramPushSourceFilter(normalized)
            ? categoryText.cleared(
                categoryText.pushSourceScopeLabel(
                  getTelegramPushCategoryLabel(normalized, telegramText, t)
                )
              )
          : getAdminCategoryDeletedText(categoryText, t, normalized, scope);

      await refreshAfterMutation(async (options) => {
        if (scope === "tools") return refresh(options);
        if (scope === "push") return refreshTelegramPushRecords(options);
        if (scope === "articles") {
          return combineAdminRefreshResults(await Promise.all([
            refreshArticles(options),
            refreshContent(options)
          ]));
        }
        return refreshContent(options);
      }, resultMessage);
    } catch (error) {
      setStatus(categoryText.updateFailed);
    } finally {
      setIsApplyingCategoryAction(false);
    }
  }

  const adminFilterCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.tools,
        ...tools.map((tool) => tool.category),
        adminCategory
      ],
      adminCategorySettings.tools,
      t
    );

    return ["All", ADMIN_FEATURED_CATEGORY, ...names];
  }, [adminCategory, adminCategorySettings.tools, t, tools]);
  useEffect(() => {
    const normalizedAdminCategory = normalizeAdminCategoryValue(adminCategory);

    if (adminCategory !== normalizedAdminCategory) {
      setAdminCategory(normalizedAdminCategory);
      return;
    }

    if (!adminFilterCategories.includes(normalizedAdminCategory)) {
      setAdminCategory("All");
    }
  }, [adminCategory, adminFilterCategories]);
  useEffect(() => {
    localStorage.setItem(
      "htools_admin_sidebar",
      sidebarCollapsed ? "collapsed" : "expanded"
    );
  }, [sidebarCollapsed]);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 920px)");
    const updateViewport = () => setIsMobileSidebarViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1201px)");
    const updateViewport = () => setIsContentReaderViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);
  const visibleTools = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();
    const filtered = tools.filter((tool) => {
      const matchesCategory =
        isAllCategoryValue(adminCategory) ||
        (isFeaturedCategoryValue(adminCategory)
          ? tool.featured
          : tool.category === adminCategory);
      const matchesQuery =
        !query ||
          [
            tool.name,
            tool.description,
            tool.url,
            tool.demoUrl,
            tool.category,
            ...tool.tags
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

      return matchesCategory && matchesQuery;
    });

    return filtered.sort((left, right) => {
      if (toolSortMode === "oldest") {
        return (left.created_at ?? "").localeCompare(right.created_at ?? "");
      }

      return (right.created_at ?? "").localeCompare(left.created_at ?? "");
    });
  }, [adminCategory, adminSearch, toolSortMode, tools]);
  const articleExistingCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.articles,
        ...Object.keys(adminArticleCategoryCounts),
        ...adminArticles.map((article) => article.category)
      ],
      adminCategorySettings.articles,
      t
    );

    return names;
  }, [adminArticleCategoryCounts, adminArticles, adminCategorySettings.articles, t]);
  const pushExistingCategories = useMemo(
    () => uniqueAdminCategories(sortCategoriesBySettings(
      [
        ...adminCategorySettings.push,
        ...telegramPushCategoryOptions,
        ...telegramPushRecords.map((record) => record.resource?.category ?? "")
      // ponytail: legacy records still carry source sentinels in their category, and
      // they are not real categories any more. Drop them here so the editor never
      // offers one; the list filter re-adds them explicitly from
      // TELEGRAM_PUSH_FIXED_FILTERS, where they are legitimate source filters.
      ].filter(
        (category) => !isTelegramPushSourceFilter(normalizeAdminCategoryValue(category))
      ),
      adminCategorySettings.push,
      t
    )),
    [adminCategorySettings.push, t, telegramPushCategoryOptions, telegramPushRecords]
  );
  const pushCategoryOptions = useMemo(
    () => uniqueAdminCategories(sortCategoriesBySettings(
      [...pushExistingCategories, telegramCategory],
      adminCategorySettings.push,
      t
    )),
    [adminCategorySettings.push, pushExistingCategories, t, telegramCategory]
  );
  const pushFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          [...TELEGRAM_PUSH_FIXED_FILTERS, ...pushExistingCategories]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [pushExistingCategories]
  );
  const articleFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          ["All", ...articleExistingCategories, articleCategoryFilter]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [articleCategoryFilter, articleExistingCategories]
  );
  const articleCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...articleExistingCategories,
          articleCategoryFilter,
          articleForm.category,
          convertArticleCategory
        ],
        adminCategorySettings.articles,
        t
      ),
    [
      adminCategorySettings.articles,
      articleCategoryFilter,
      articleExistingCategories,
      articleForm.category,
      convertArticleCategory,
      t
    ]
  );
  const visibleArticles = adminArticles;
  const hasActiveArticleFilter =
    !isAllCategoryValue(articleCategoryFilter) || Boolean(debouncedArticleSearch.trim());
  useEffect(() => {
    const normalizedArticleCategory =
      normalizeAdminCategoryValue(articleCategoryFilter);

    if (articleCategoryFilter !== normalizedArticleCategory) {
      setArticleCategoryFilter(normalizedArticleCategory);
      return;
    }

    if (!articleFilterCategories.includes(normalizedArticleCategory)) {
      setArticleCategoryFilter("All");
    }
  }, [articleCategoryFilter, articleFilterCategories]);
  const contentExistingCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.content,
        ...Object.keys(contentCategoryCounts),
        ...contentSources.map((source) => source.category),
        ...contentItems.map((item) => item.category)
      ],
      adminCategorySettings.content,
      t
    );

    return names;
  }, [adminCategorySettings.content, contentCategoryCounts, contentItems, contentSources, t]);
  const contentCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...contentExistingCategories,
          contentCategoryFilter,
          contentSourceForm.category
        ],
        adminCategorySettings.content,
        t
      ),
    [
      adminCategorySettings.content,
      contentCategoryFilter,
      contentExistingCategories,
      contentSourceForm.category,
      t
    ]
  );
  const contentFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          ["All", ...contentExistingCategories, contentCategoryFilter]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [contentCategoryFilter, contentExistingCategories]
  );
  const visibleContentItems = contentItems;
  const effectiveContentCategory = isAllCategoryValue(contentCategoryFilter)
    ? contentRailCategory ?? "All"
    : contentCategoryFilter;
  useEffect(() => {
    const normalizedContentCategory =
      normalizeAdminCategoryValue(contentCategoryFilter);

    if (contentCategoryFilter !== normalizedContentCategory) {
      setContentCategoryFilter(normalizedContentCategory);
      return;
    }

    if (!contentFilterCategories.includes(normalizedContentCategory)) {
      setContentCategoryFilter("All");
    }
  }, [contentCategoryFilter, contentFilterCategories]);
  useEffect(() => {
    if (!contentSourcesLoadedRef.current) {
      return;
    }
    if (
      contentSourceFilter !== "all" &&
      !contentSources.some((source) => source.id === contentSourceFilter)
    ) {
      setContentSourceFilter("all");
    }
  }, [contentSourceFilter, contentSources]);
  useEffect(() => {
    if (!contentSourcesLoadedRef.current || !contentRailCategory) return;
    if (
      !contentSources.some(
        (source) =>
          normalizeAdminCategoryValue(source.category) ===
          normalizeAdminCategoryValue(contentRailCategory)
      )
    ) {
      setContentRailCategory(null);
    }
  }, [contentRailCategory, contentSources]);
  const adminCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...adminFilterCategories,
          form.category
        ],
        adminCategorySettings.tools,
        t
      ),
    [adminCategorySettings.tools, adminFilterCategories, form.category, t]
  );

  async function refresh(options: AdminRefreshOptions = {}): Promise<AdminRefreshResult> {
    const generation = adminToolsRequestGenerationRef.current + 1;
    adminToolsRequestGenerationRef.current = generation;
    setIsLoadingTools(true);

    try {
      const nextTools = await loadAdminTools(token);
      if (adminToolsRequestGenerationRef.current !== generation) return "superseded";
      setTools(nextTools);
      setToolsLoadError(null);
      return "success";
    } catch (error) {
      if (adminToolsRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setToolsLoadError(message);
        if (options.reportError !== false) setStatus(message);
        return "failed";
      }
      return "superseded";
    } finally {
      if (adminToolsRequestGenerationRef.current === generation) {
        setHasLoadedTools(true);
        setIsLoadingTools(false);
      }
    }
  }

  function getAdminArticleRequestParams(cursor?: string) {
    return {
      category: isAllCategoryValue(articleCategoryFilter)
        ? undefined
        : normalizeAdminCategoryValue(articleCategoryFilter),
      query: debouncedArticleSearch.trim() || undefined,
      sort: articleSortMode,
      limit: ADMIN_ARTICLE_PAGE_SIZE,
      cursor
    };
  }

  async function refreshArticles(options: AdminRefreshOptions = {}): Promise<AdminRefreshResult> {
    const generation = adminArticlesRequestGenerationRef.current + 1;
    adminArticlesRequestGenerationRef.current = generation;
    adminArticlesNextCursorRef.current = null;
    adminArticlesLoadingCursorRef.current = null;
    setIsLoadingArticles(true);
    setIsLoadingMoreArticles(false);
    setAdminArticlesHasMore(false);

    try {
      const nextPage = await loadAdminArticles(
        token,
        getAdminArticleRequestParams()
      );
      if (adminArticlesRequestGenerationRef.current !== generation) return "superseded";
      setAdminArticles(nextPage.articles);
      setAdminArticlesHasMore(nextPage.hasMore);
      setAdminArticlesTotal(nextPage.total);
      setAdminArticleCategoryCounts(nextPage.categoryCounts);
      adminArticlesNextCursorRef.current = nextPage.nextCursor;
      setArticlesLoadError(null);
      return "success";
    } catch (error) {
      if (adminArticlesRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setArticlesLoadError(message);
        if (options.reportError !== false) setStatus(message);
        return "failed";
      }
      return "superseded";
    } finally {
      if (adminArticlesRequestGenerationRef.current === generation) {
        setHasLoadedArticles(true);
        setIsLoadingArticles(false);
      }
    }
  }

  async function loadMoreAdminArticles() {
    const cursor = adminArticlesNextCursorRef.current;
    if (adminArticlesLoadingCursorRef.current || !adminArticlesHasMore || !cursor) {
      return;
    }

    const generation = adminArticlesRequestGenerationRef.current;
    adminArticlesLoadingCursorRef.current = cursor;
    setIsLoadingMoreArticles(true);

    try {
      const nextPage = await loadAdminArticles(
        token,
        getAdminArticleRequestParams(cursor)
      );
      if (
        adminArticlesRequestGenerationRef.current !== generation ||
        adminArticlesLoadingCursorRef.current !== cursor
      ) {
        return;
      }
      setAdminArticles((current) => {
        const articlesById = new Map(current.map((article) => [article.id, article]));
        nextPage.articles.forEach((article) => articlesById.set(article.id, article));
        return Array.from(articlesById.values());
      });
      setAdminArticlesHasMore(nextPage.hasMore);
      setAdminArticlesTotal(nextPage.total);
      setAdminArticleCategoryCounts(nextPage.categoryCounts);
      adminArticlesNextCursorRef.current = nextPage.nextCursor;
    } catch (error) {
      if (
        adminArticlesRequestGenerationRef.current === generation &&
        adminArticlesLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        adminArticlesRequestGenerationRef.current === generation &&
        adminArticlesLoadingCursorRef.current === cursor
      ) {
        adminArticlesLoadingCursorRef.current = null;
        setIsLoadingMoreArticles(false);
      }
    }
  }

  function getContentItemRequestParams(cursor?: string) {
    return {
      sourceId: contentSourceFilter === "all" ? undefined : contentSourceFilter,
      category: isAllCategoryValue(effectiveContentCategory)
        ? undefined
        : normalizeAdminCategoryValue(effectiveContentCategory),
      query: debouncedContentSearch.trim() || undefined,
      sort: contentSortMode,
      limit: CONTENT_ITEM_PAGE_SIZE,
      cursor
    };
  }

  async function refreshContent(
    options: AdminRefreshOptions & { reloadSources?: boolean } = {}
  ): Promise<AdminRefreshResult> {
    const generation = contentItemsRequestGenerationRef.current + 1;
    contentItemsRequestGenerationRef.current = generation;
    contentItemsNextCursorRef.current = null;
    contentItemsLoadingCursorRef.current = null;
    setIsLoadingContent(true);
    setIsLoadingMoreContent(false);
    setContentItemsHasMore(false);

    const shouldReloadSources =
      options.reloadSources !== false || !contentSourcesLoadedRef.current;
    const sourcesGeneration = shouldReloadSources
      ? contentSourcesRequestGenerationRef.current + 1
      : contentSourcesRequestGenerationRef.current;
    if (shouldReloadSources) {
      contentSourcesRequestGenerationRef.current = sourcesGeneration;
    }
    const sourcesRequest = shouldReloadSources
      ? loadContentSources(token)
      : Promise.resolve(null);
    const itemsRequest = loadContentItems(token, getContentItemRequestParams());
    // 两部分独立判断轮次，任何当前请求失败都要向操作反馈报告。
    let sourcesStatus: AdminRefreshResult = "success";

    try {
      const [sourcesResult, itemsResult] = await Promise.allSettled([
        sourcesRequest,
        itemsRequest
      ]);

      // 切筛选触发的内容刷新不能丢掉仍有效的订阅源结果。
      if (contentSourcesRequestGenerationRef.current !== sourcesGeneration) {
        sourcesStatus = "superseded";
      } else if (sourcesResult.status === "fulfilled") {
        if (sourcesResult.value) {
          setContentSources(sourcesResult.value);
          contentSourcesLoadedRef.current = true;
          setContentSourcesLoadError(null);
        }
      } else {
        sourcesStatus = "failed";
        const message = getLocalizedErrorMessage(sourcesResult.reason, t);
        setContentSourcesLoadError(message);
        if (options.reportError !== false) setStatus(message);
      }

      // 内容列表这一半仍然按轮次丢弃:它的结果和当时的筛选、搜索、游标绑在一起,
      // 被更新的一轮取代之后就是过期数据。
      if (contentItemsRequestGenerationRef.current !== generation) {
        return combineAdminRefreshResults([sourcesStatus, "superseded"]);
      }

      if (itemsResult.status === "fulfilled") {
        const nextPage = itemsResult.value;
        setContentItems(nextPage.items);
        setContentItemsHasMore(nextPage.hasMore);
        contentItemsNextCursorRef.current = nextPage.nextCursor;
        if (nextPage.total !== null) setContentItemsTotal(nextPage.total);
        if (nextPage.sourceCounts !== null) setContentSourceCounts(nextPage.sourceCounts);
        if (nextPage.categoryCounts !== null) setContentCategoryCounts(nextPage.categoryCounts);
        setContentLoadError(null);
        return sourcesStatus;
      } else {
        const message = getLocalizedErrorMessage(itemsResult.reason, t);
        setContentLoadError(message);
        if (options.reportError !== false) setStatus(message);
        return "failed";
      }
    } finally {
      if (contentItemsRequestGenerationRef.current === generation) {
        setHasLoadedContent(true);
        setIsLoadingContent(false);
      }
    }

  }

  async function loadMoreContentItems() {
    const cursor = contentItemsNextCursorRef.current;
    if (
      contentItemsLoadingCursorRef.current ||
      !contentItemsHasMore ||
      !cursor
    ) {
      return;
    }

    const generation = contentItemsRequestGenerationRef.current;
    contentItemsLoadingCursorRef.current = cursor;
    setIsLoadingMoreContent(true);

    try {
      const nextPage = await loadContentItems(
        token,
        { ...getContentItemRequestParams(cursor), includeCounts: false }
      );

      if (
        contentItemsRequestGenerationRef.current !== generation ||
        contentItemsLoadingCursorRef.current !== cursor
      ) {
        return;
      }

      setContentItems((current) => {
        const itemsById = new Map(current.map((item) => [item.id, item]));
        nextPage.items.forEach((item) => itemsById.set(item.id, item));
        return Array.from(itemsById.values());
      });
      setContentItemsHasMore(nextPage.hasMore);
      contentItemsNextCursorRef.current = nextPage.nextCursor;
      if (nextPage.total !== null) setContentItemsTotal(nextPage.total);
      if (nextPage.sourceCounts !== null) setContentSourceCounts(nextPage.sourceCounts);
      if (nextPage.categoryCounts !== null) setContentCategoryCounts(nextPage.categoryCounts);
    } catch (error) {
      if (
        contentItemsRequestGenerationRef.current === generation &&
        contentItemsLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        contentItemsRequestGenerationRef.current === generation &&
        contentItemsLoadingCursorRef.current === cursor
      ) {
        contentItemsLoadingCursorRef.current = null;
        setIsLoadingMoreContent(false);
      }
    }
  }

  function getTelegramPushRequestParams(cursor?: string) {
    const sourceType = getTelegramPushFilterResourceType(telegramPushCategory);
    return {
      cursor,
      limit: TELEGRAM_PUSH_PAGE_SIZE,
      query: debouncedTelegramPushSearch.trim() || undefined,
      category: isAllCategoryValue(telegramPushCategory) || sourceType
        ? undefined
        : telegramPushCategory,
      resourceType: sourceType,
      sort: telegramPushSortMode
    };
  }

  async function refreshTelegramPushRecords(options: AdminRefreshOptions = {}): Promise<AdminRefreshResult> {
    const generation = telegramPushRequestGenerationRef.current + 1;
    telegramPushRequestGenerationRef.current = generation;
    telegramPushNextCursorRef.current = null;
    telegramPushLoadingCursorRef.current = null;
    setIsLoadingTelegramPushes(true);
    setIsLoadingMoreTelegramPushes(false);
    setTelegramPushHasMore(false);

    try {
      const page = await loadTelegramPushRecords(
        token,
        getTelegramPushRequestParams()
      );
      if (telegramPushRequestGenerationRef.current !== generation) return "superseded";
      setTelegramPushRecords(page.records);
      setTelegramPushCategoryOptions(page.categoryOptions);
      setTelegramPushHasMore(page.hasMore);
      telegramPushNextCursorRef.current = page.nextCursor;
      setTelegramPushLoadError(null);
      return "success";
    } catch (error) {
      if (telegramPushRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setTelegramPushLoadError(message);
        if (options.reportError !== false) setStatus(message);
        return "failed";
      }
      return "superseded";
    } finally {
      if (telegramPushRequestGenerationRef.current === generation) {
        setHasLoadedTelegramPushes(true);
        setIsLoadingTelegramPushes(false);
      }
    }
  }

  async function loadMoreTelegramPushRecords() {
    const cursor = telegramPushNextCursorRef.current;
    if (
      telegramPushLoadingCursorRef.current ||
      !telegramPushHasMore ||
      !cursor
    ) {
      return;
    }

    const generation = telegramPushRequestGenerationRef.current;
    telegramPushLoadingCursorRef.current = cursor;
    setIsLoadingMoreTelegramPushes(true);
    try {
      const page = await loadTelegramPushRecords(
        token,
        getTelegramPushRequestParams(cursor)
      );
      if (
        telegramPushRequestGenerationRef.current !== generation ||
        telegramPushLoadingCursorRef.current !== cursor
      ) {
        return;
      }
      setTelegramPushRecords((current) => {
        const recordsById = new Map(current.map((record) => [record.id, record]));
        page.records.forEach((record) => recordsById.set(record.id, record));
        return Array.from(recordsById.values());
      });
      setTelegramPushCategoryOptions(page.categoryOptions);
      setTelegramPushHasMore(page.hasMore);
      telegramPushNextCursorRef.current = page.nextCursor;
    } catch (error) {
      if (
        telegramPushRequestGenerationRef.current === generation &&
        telegramPushLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        telegramPushRequestGenerationRef.current === generation &&
        telegramPushLoadingCursorRef.current === cursor
      ) {
        telegramPushLoadingCursorRef.current = null;
        setIsLoadingMoreTelegramPushes(false);
      }
    }
  }

  async function refreshAfterMutation(
    refreshAction: (options: AdminRefreshOptions) => Promise<AdminRefreshResult>,
    resultMessage: string
  ): Promise<AdminRefreshResult> {
    const generation = mutationRefreshGenerationRef.current + 1;
    mutationRefreshGenerationRef.current = generation;
    const scrollContainer = adminContentScrollRef.current;
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    setStatus(resultMessage);

    let result: AdminRefreshResult;
    try {
      result = await refreshAction({ reportError: false });
    } catch {
      result = "failed";
    }

    if (mutationRefreshGenerationRef.current !== generation) return "superseded";

    if (result === "failed") setStatus(`${resultMessage} ${categoryText.refreshFailedHint}`);
    if (result !== "success") return result;

    window.requestAnimationFrame(() => {
      if (mutationRefreshGenerationRef.current === generation) {
        scrollContainer?.scrollTo({ top: scrollTop, behavior: "auto" });
      }
    });
    return result;
  }

  async function refreshTelegramSettings() {
    if (!token) return;

    const requestId = ++telegramSettingsLoadRequestRef.current;
    telegramSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    telegramSettingsLoadAbortRef.current = controller;
    setTelegramSettingsLoading(true);

    try {
      const settings = await loadTelegramSettings(token, {
        signal: controller.signal
      });
      if (telegramSettingsLoadRequestRef.current !== requestId) return;
      setTelegramSettings(settings);
      setTelegramSettingsLoadError(null);
    } catch (error) {
      if (
        telegramSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setTelegramSettings({ available: false, enabled: false, target: "", footerMarkdown: "" });
        setTelegramSettingsLoadError(error);
      }
    } finally {
      if (telegramSettingsLoadRequestRef.current === requestId) {
        setTelegramSettingsLoading(false);
        if (telegramSettingsLoadAbortRef.current === controller) {
          telegramSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  function applyTelegramSettings(settings: TelegramSettings) {
    setTelegramSettings(settings);
    setTelegramSettingsLoadError(null);
    setTelegramSettingsLoading(false);
  }

  async function refreshAdminAiSettings() {
    if (!token) return;

    const requestId = ++adminAiSettingsLoadRequestRef.current;
    adminAiSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    adminAiSettingsLoadAbortRef.current = controller;
    setAdminAiSettingsLoading(true);

    try {
      const settings = await loadAdminAiSettings(token, {
        signal: controller.signal
      });
      if (adminAiSettingsLoadRequestRef.current !== requestId) return;
      setAdminAiSettings(settings);
      setAdminAiSettingsLoadError(null);
    } catch (error) {
      if (
        adminAiSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setAdminAiSettings({
          available: false,
          enabled: false,
          model: ADMIN_AI_MODELS[0]
        });
        setAdminAiSettingsLoadError(error);
      }
    } finally {
      if (adminAiSettingsLoadRequestRef.current === requestId) {
        setAdminAiSettingsLoading(false);
        if (adminAiSettingsLoadAbortRef.current === controller) {
          adminAiSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  function applyAdminAiSettings(settings: AdminAiSettings) {
    setAdminAiSettings(settings);
    setAdminAiSettingsLoadError(null);
    setAdminAiSettingsLoading(false);
  }

  useEffect(() => {
    if (!token) {
      writeActionLocksRef.current.clear();
      adminCategoryLoadRequestRef.current += 1;
      categoryIconGenerationRef.current += 1;
      categoryIconSaveRef.current = false;
      setAdminCategoryIcons(createEmptyCategoryIconSettings());
      setAdminCategoryIconsReady(false);
      setEditingCategoryIcon(null);
      setCategoryIconSaving(false);
      setCategoryIconError("");
      mutationRefreshGenerationRef.current += 1;
      articleEditorLoadRequestRef.current += 1;
      toolGitHub.reset();
      invalidateContentPreview();
      adminCategorySavePendingRef.current.clear();
      adminCategoryRollbackRef.current = {};
      adminCategorySaveGenerationRef.current.tools += 1;
      adminCategorySaveGenerationRef.current.articles += 1;
      adminCategorySaveGenerationRef.current.push += 1;
      adminCategorySaveGenerationRef.current.content += 1;
      setWriteLockedEntityKeys(new Set());
      setTools([]);
      setToolsLoadError(null);
      adminToolsRequestGenerationRef.current += 1;
      setAdminArticles([]);
      setArticlesLoadError(null);
      setAdminArticlesHasMore(false);
      setAdminArticlesTotal(0);
      setAdminArticleCategoryCounts({});
      setIsLoadingMoreArticles(false);
      adminArticlesRequestGenerationRef.current += 1;
      adminArticlesNextCursorRef.current = null;
      adminArticlesLoadingCursorRef.current = null;
      setContentSources([]);
      setContentItems([]);
      setContentLoadError(null);
      setContentSourcesLoadError(null);
      setContentItemsHasMore(false);
      setContentItemsTotal(0);
      setContentSourceCounts({});
      setContentCategoryCounts({});
      setIsLoadingMoreContent(false);
      contentItemsRequestGenerationRef.current += 1;
      contentSourcesRequestGenerationRef.current += 1;
      contentItemsNextCursorRef.current = null;
      contentItemsLoadingCursorRef.current = null;
      contentSourcesLoadedRef.current = false;
      commitAdminCategorySettings(initialAdminCategorySettings);
      setIsLoadingTools(false);
      setIsLoadingArticles(false);
      setIsLoadingContent(false);
      setHasLoadedTools(false);
      setHasLoadedArticles(false);
      setHasLoadedContent(false);
      setTelegramSettings({ available: false, enabled: false, target: "", footerMarkdown: "" });
      setTelegramSettingsLoading(false);
      setTelegramSettingsLoadError(null);
      setAdminAiSettings({
        available: false,
        enabled: false,
        model: ADMIN_AI_MODELS[0]
      });
      setAdminAiSettingsLoading(false);
      setAdminAiSettingsLoadError(null);
      telegramPushRequestGenerationRef.current += 1;
      telegramPushNextCursorRef.current = null;
      telegramPushLoadingCursorRef.current = null;
      setTelegramPushRecords([]);
      setTelegramPushCategoryOptions([]);
      setTelegramPushHasMore(false);
      setIsLoadingTelegramPushes(false);
      setIsLoadingMoreTelegramPushes(false);
      setHasLoadedTelegramPushes(false);
      setTelegramPushLoadError(null);
      setViewingTelegramPush(null);
      setPendingDeleteTelegramPush(null);
      setPendingPushTelegramRecord(null);
      setPendingTelegramUncertainRetry(null);
      setPendingTelegramResend(null);
      setTelegramQuickResource(null);
      setTelegramQuickMessage(null);
      setTelegramResource(null);
      setTelegramMessage(null);
      setIsCreatingTelegramPush(false);
      return;
    }

    setHasLoadedTools(false);
    setHasLoadedArticles(false);
    setHasLoadedContent(false);
    void refreshAdminCategories();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    void refreshTelegramSettings();
    void refreshAdminAiSettings();

    return () => {
      telegramSettingsLoadAbortRef.current?.abort();
      telegramSettingsLoadAbortRef.current = null;
      telegramSettingsLoadRequestRef.current += 1;
      adminAiSettingsLoadAbortRef.current?.abort();
      adminAiSettingsLoadAbortRef.current = null;
      adminAiSettingsLoadRequestRef.current += 1;
    };
  }, [token]);

  useEffect(() => {
    if (
      token &&
      (adminView === "tools" ||
        adminView === "import-export" ||
        adminView === "link-check") &&
      !hasLoadedTools
    ) {
      void refresh();
    }
  }, [adminView, hasLoadedTools, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedArticleSearch(articleSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [articleSearch]);

  useEffect(() => {
    if (!token || adminView !== "articles") return;
    void refreshArticles();
  }, [
    token,
    adminView,
    articleCategoryFilter,
    debouncedArticleSearch,
    articleSortMode
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedContentSearch(contentSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [contentSearch]);

  useEffect(() => {
    if (!token || adminView !== "content") {
      return;
    }

    void refreshContent({ reloadSources: !contentSourcesLoadedRef.current });
  }, [
    token,
    adminView,
    effectiveContentCategory,
    contentSourceFilter,
    debouncedContentSearch,
    contentSortMode
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTelegramPushSearch(telegramPushSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [telegramPushSearch]);

  useEffect(() => {
    if (!token || adminView !== "push") return;
    void refreshTelegramPushRecords();
  }, [
    token,
    adminView,
    telegramPushCategory,
    debouncedTelegramPushSearch,
    telegramPushSortMode
  ]);

  useLayoutEffect(() => {
    document.documentElement.classList.add("admin-route");

    return () => {
      document.documentElement.classList.remove("admin-route");
    };
  }, []);

  useEffect(() => {
    document.title = formatAdminDocumentTitle(
      activeDocumentTitle,
      siteName,
      t.nav.admin
    );
  }, [activeDocumentTitle, siteName, t.nav.admin]);

  useEffect(() => {
    const currentPathIsSettingsGroup =
      adminView === "system" &&
      Boolean(getAdminSystemSettingsGroupFromPath(window.location.pathname));
    const nextPath = currentPathIsSettingsGroup
      ? window.location.pathname
      : getAdminPath(adminView);
    const nextSearch = "";

    if (
      window.location.pathname !== nextPath ||
      window.location.search !== nextSearch
    ) {
      window.history.replaceState(
        null,
        "",
        `${nextPath}${nextSearch}${window.location.hash}`
      );
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      setAdminView(getInitialAdminView());
      closeMobileSidebar();
      window.requestAnimationFrame(() => {
        adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sidebarAnimationTimer.current) {
        window.clearTimeout(sidebarAnimationTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !openAdminMenu) {
        closeMobileSidebar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileSidebarOpen, openAdminMenu]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoggingIn) return;

    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      setPassword("");
      setPasswordError(t.admin.passwordRequired);
      passwordInputRef.current?.focus();
      return;
    }
    if (!authConfig) return;
    if (authConfig.turnstileEnabled && !turnstileToken) {
      return;
    }

    setIsLoggingIn(true);
    setStatus("");

    try {
      const nextToken = await login(normalizedPassword, turnstileToken);
      localStorage.setItem("htools_token", nextToken);
      setToken(nextToken);
      setPassword("");
      setPasswordError("");
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
        && typeof error.code === "string"
          ? error.code
          : "";
      if ([
        "TURNSTILE_CONFIG_ERROR",
        "TURNSTILE_FAILED",
        "TURNSTILE_REQUIRED",
        "TURNSTILE_UNAVAILABLE"
      ].includes(errorCode)) {
        setStatus("");
      } else if (errorCode === "INVALID_PASSWORD") {
        setPassword("");
        setPasswordError(getLocalizedErrorMessage(error, t));
        setStatus("");
      } else {
        setStatus(getLocalizedErrorMessage(error, t));
      }
      if (authConfig.turnstileEnabled) {
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
      }
      window.requestAnimationFrame(() => {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  function toggleSidebar() {
    if (isMobileSidebarViewport) {
      if (mobileSidebarOpen) {
        closeMobileSidebar();
      } else {
        setMobileSidebarOpen(true);
      }
      return;
    }

    setSidebarCollapsed((collapsed) => !collapsed);
    setSidebarAnimating(true);

    if (sidebarAnimationTimer.current) {
      window.clearTimeout(sidebarAnimationTimer.current);
    }

    sidebarAnimationTimer.current = window.setTimeout(() => {
      setSidebarAnimating(false);
      sidebarAnimationTimer.current = null;
    }, 320);
  }

  function selectAdminView(nextView: AdminView) {
    const nextPath = getAdminPath(nextView);

    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState(null, "", nextPath);
    }

    setAdminView(nextView);
    closeMobileSidebar();
    adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  function openServiceSettings() {
    const nextPath = ADMIN_SYSTEM_SETTINGS_GROUP_PATHS.services;

    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState(null, "", nextPath);
    }

    setAdminView("system");
    closeMobileSidebar();
    adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCreate() {
    const category =
      isAllCategoryValue(adminCategory) || isFeaturedCategoryValue(adminCategory)
        ? ""
        : adminCategory;

    setEditingTool(null);
    setForm({ ...initialForm, category });
    setToolTagText(formatTagInputText(initialForm.tags));
    toolGitHub.reset();
    setFormOpen(true);
  }

  function openEdit(tool: Tool) {
    if (isWriteEntityLocked("tool", tool.id)) return;
    const nextForm = normalizeForm(tool);

    setEditingTool(tool);
    setForm(nextForm);
    setToolTagText(formatTagInputText(nextForm.tags));
    toolGitHub.reset(tool.url);
    setFormOpen(true);
  }

  function closeToolEditor() {
    toolGitHub.reset();
    setFormOpen(false);
  }

  function requestToolEditorClose() {
    toolEditorCloseRequestRef.current?.() ?? closeToolEditor();
  }

  function closeTelegramMessageDialog() {
    if (telegramMessageSaving) return;
    if (pendingTelegramUncertainRetry?.context === "editor") {
      setPendingTelegramUncertainRetry(null);
    }
    telegramGitHub.reset();
    setPendingTelegramResend(null);
    setPendingTelegramSourceSync(false);
    setTelegramResource(null);
    setTelegramMessage(null);
    setIsCreatingTelegramPush(false);
    setTelegramBodyMarkdown("");
    setTelegramDescription("");
    setTelegramUrl("");
    setTelegramDemoUrl("");
    setTelegramImage("");
    setTelegramCategory("");
    setTelegramTagText("");
    setTelegramSourceLoading(false);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl("");
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(false);
  }

  async function confirmPushTelegramRecord(confirmUncertainRetry = false) {
    const record = pendingPushTelegramRecord;
    if (!record || isPushingTelegramRecord) return;
    if (record.deliveryUncertain && !confirmUncertainRetry) {
      setPendingTelegramUncertainRetry({ context: "record", retried: false });
      return;
    }

    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(record.resourceType),
      record.resourceId
    );
    if (!acquireWriteAction(actionKey)) return;
    setIsPushingTelegramRecord(true);
    setStatus("");

    try {
      await sendTelegramMessage(
        record.resourceType,
        record.resourceId,
        record.messageMarkdown,
        record.mediaEnabled,
        record.mediaUrl,
        locale,
        token,
        {
          category: record.resource?.category ?? "",
          title: record.title,
          resource: record.resource ?? undefined,
          confirmUncertainRetry
        }
      );
      setStatus(telegramText.sent);
      setPendingTelegramUncertainRetry(null);
      setPendingPushTelegramRecord(null);
      void refreshTelegramPushRecords();
    } catch (error) {
      if (isTelegramPushUncertainError(error)) {
        setPendingTelegramUncertainRetry({ context: "record", retried: confirmUncertainRetry });
        setTelegramPushRecords((current) => current.map((item) => item.id === record.id
          ? { ...item, deliveryUncertain: true }
          : item));
        setStatus("");
      } else {
        setPendingTelegramUncertainRetry(null);
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      releaseWriteAction(actionKey);
      setIsPushingTelegramRecord(false);
    }
  }

  function openCreateTelegramPush() {
    const resource: TelegramPushResource = {
      type: "custom",
      id: crypto.randomUUID(),
      title: "",
      description: "",
      url: "",
      demoUrl: "",
      image: "",
      category: "",
      tags: []
    };
    const defaultBody = buildTelegramPreviewMarkdown(
      resource,
      createTelegramCustomBodyExample(locale),
      telegramSettings.footerMarkdown,
      locale
    );
    setTelegramResource(resource);
    telegramGitHub.reset();
    setIsCreatingTelegramPush(true);
    setTelegramCustomTitle("");
    setTelegramMessage({
      exists: false,
      targetChanged: false,
      deliveryUncertain: false,
      syncStatus: "not_pushed",
      bodyMarkdown: defaultBody,
      mediaEnabled: false,
      mediaUrl: "",
      defaultBodyMarkdown: defaultBody,
      defaultMediaUrl: "",
      resource,
      resourceExists: true
    });
    setTelegramBodyMarkdown(defaultBody);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl("");
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(false);
    setStatus("");
  }

  async function openTelegramQuickPush(resource: TelegramPushResource) {
    if (telegramQuickLoading) return;
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(resource.type),
      resource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    const previewResource = { ...resource, category: "" };
    setTelegramQuickResource(previewResource);
    setTelegramQuickCategory("");
    setTelegramQuickMessage(
      createOptimisticTelegramMessage(
        previewResource,
        telegramSettings.footerMarkdown,
        locale
      )
    );
    setTelegramQuickMode("published");
    setTelegramQuickLoading(true);
    setStatus("");

    try {
      const message = await loadTelegramMessage(
        resource.type,
        resource.id,
        token,
        locale
      );
      setTelegramQuickMessage(message);
      setTelegramQuickCategory(getTelegramStoredCategory(message.resource.category));
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
      setTelegramQuickResource(null);
    } finally {
      setTelegramQuickLoading(false);
      releaseWriteAction(actionKey);
    }
  }

  function closeTelegramQuickPush() {
    if (telegramQuickSaving) return;
    if (pendingTelegramUncertainRetry?.context === "quick") {
      setPendingTelegramUncertainRetry(null);
    }
    setTelegramQuickResource(null);
    setTelegramQuickMessage(null);
    setTelegramQuickCategory("");
  }

  async function confirmTelegramQuickPush(confirmUncertainRetry = false) {
    const resource = telegramQuickResource;
    const message = telegramQuickMessage;
    if (!resource || !message || telegramQuickLoading || telegramQuickSaving) return;
    if (telegramQuickMode === "published" && message.deliveryUncertain && !confirmUncertainRetry) {
      setPendingTelegramUncertainRetry({ context: "quick", retried: false });
      return;
    }

    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(resource.type),
      resource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramQuickSaving(true);
    setStatus("");
    const storedCategory = getTelegramStoredCategory(telegramQuickCategory);
    const pushResource = { ...resource, category: storedCategory };

    try {
      if (telegramQuickMode === "published") {
        await sendTelegramMessage(
          resource.type,
          resource.id,
          message.bodyMarkdown,
          message.mediaEnabled,
          message.mediaUrl,
          locale,
          token,
          { resource: pushResource, category: storedCategory, confirmUncertainRetry }
        );
        setStatus(telegramText.sent);
      } else {
        const savedMessage = await saveTelegramMessage(
          resource.type,
          resource.id,
          message.bodyMarkdown,
          message.mediaEnabled,
          message.mediaUrl,
          locale,
          token,
          { resource: pushResource, category: storedCategory }
        );
        setStatus(savedMessage.deliveryUncertain ? telegramText.draftSavedUncertain : telegramText.saved);
      }
      setTelegramQuickResource(null);
      setTelegramQuickMessage(null);
      setTelegramQuickCategory("");
      setPendingTelegramUncertainRetry(null);
      if (adminView === "push") void refreshTelegramPushRecords();
    } catch (error) {
      if (telegramQuickMode === "published" && isTelegramPushUncertainError(error)) {
        setTelegramQuickMessage((current) => current ? { ...current, deliveryUncertain: true } : current);
        setPendingTelegramUncertainRetry({ context: "quick", retried: confirmUncertainRetry });
        setStatus("");
      } else {
        setPendingTelegramUncertainRetry(null);
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      releaseWriteAction(actionKey);
      setTelegramQuickSaving(false);
    }
  }

  async function openTelegramMessageDialog(resource: TelegramPushResource) {
    if (isWriteEntityLocked(getTelegramWriteEntityScope(resource.type), resource.id)) return;
    telegramGitHub.reset();
    setTelegramCustomTitle(resource.title);
    setTelegramDescription(resource.description);
    setTelegramUrl(resource.url);
    setTelegramDemoUrl(resource.demoUrl);
    setTelegramImage(resource.image);
    setTelegramCategory(getTelegramStoredCategory(resource.category));
    setTelegramTagText(formatTagInputText(resource.tags));
    const optimisticMessage = createOptimisticTelegramMessage(
      resource,
      telegramSettings.footerMarkdown,
      locale
    );
    setTelegramResource(resource);
    setIsCreatingTelegramPush(false);
    setTelegramMessage(optimisticMessage);
    setTelegramBodyMarkdown(optimisticMessage.bodyMarkdown);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl(optimisticMessage.mediaUrl);
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(true);
    setStatus("");

    try {
      const message = await loadTelegramMessage(
        resource.type,
        resource.id,
        token,
        locale
      );
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramBodyMarkdown(message.bodyMarkdown);
      setTelegramCustomTitle(message.resource.title);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      setTelegramCategory(getTelegramStoredCategory(message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      setTelegramMediaEnabled(message.mediaEnabled);
      setTelegramMediaUrl(message.mediaUrl);
      if (message.targetChanged) setStatus(telegramText.targetChanged);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
      setTelegramResource(null);
    } finally {
      setTelegramMessageLoading(false);
    }
  }

  async function refreshTelegramSource() {
    if (!telegramResource || telegramResource.type === "custom" || telegramSourceLoading) return;
    setTelegramSourceLoading(true);
    try {
      const source = await loadTelegramSource(telegramResource.type, telegramResource.id, token, locale);
      const refreshedResource = {
        ...source.resource,
        category: getTelegramStoredCategory(telegramCategory)
      };
      setTelegramResource(refreshedResource);
      setTelegramMessage((current) => current ? {
        ...current,
        resource: refreshedResource,
        defaultBodyMarkdown: source.bodyMarkdown,
        defaultMediaUrl: source.mediaUrl
      } : current);
      setTelegramCustomTitle(source.resource.title);
      setTelegramDescription(source.resource.description);
      setTelegramUrl(source.resource.url);
      setTelegramDemoUrl(source.resource.demoUrl);
      setTelegramImage(source.resource.image);
      setTelegramTagText(formatTagInputText(source.resource.tags));
      setTelegramBodyMarkdown(source.bodyMarkdown);
      setTelegramMediaUrl(source.mediaUrl);
      setTelegramMediaEnabled(false);
      setStatus(locale === "zh" ? "已读取最新信息。" : "Latest information loaded.");
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setTelegramSourceLoading(false);
    }
  }

  function handleTelegramMediaEnabledChange(enabled: boolean) {
    setTelegramMediaEnabled(enabled);
    if (enabled) setTelegramMarkdownEditorMode("preview");
  }

  async function saveTelegramMessageChanges() {
    if (
      !telegramResource ||
      !telegramMessage ||
      telegramMessageSaving ||
      !telegramEditorDirty ||
      !telegramBodyMarkdown.trim() ||
      telegramCustomTitleMissing ||
      !telegramMediaValid ||
      telegramPreviewLength > telegramContentLimit
    ) {
      return;
    }
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(telegramResource.type),
      telegramResource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramMessageSaving(true);
    setStatus("");

    try {
      const message = await saveTelegramMessage(
        telegramResource.type,
        telegramResource.id,
        telegramBodyMarkdown,
        telegramMediaEnabled,
        normalizedTelegramMediaUrl,
        locale,
        token,
        {
          category: getTelegramStoredCategory(telegramCategory),
          title: telegramCustomTitle,
          resource: telegramEditedResource ?? undefined
        }
      );
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      // ponytail: keep the category the admin just picked. Sentinels from legacy
      // records are stripped on read, so an untouched record opens with an empty
      // category and shows the "select or create" empty state instead of a raw
      // __telegram_tool__ string.
      setTelegramCategory(getTelegramStoredCategory(message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      setTelegramBodyMarkdown(message.bodyMarkdown);
      setTelegramMediaEnabled(message.mediaEnabled);
      setTelegramMediaUrl(message.mediaUrl);
      setStatus(
        message.deliveryUncertain ? telegramText.savedUncertain
          : message.targetChanged ? telegramText.targetChanged : telegramText.saved
      );
      if (adminView === "push") void refreshTelegramPushRecords();
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setTelegramMessageSaving(false);
    }
  }

  async function submitTelegramMessage(confirmUncertainRetry = false) {
    if (
      !telegramResource ||
      !telegramMessage ||
      telegramMessageSaving ||
      telegramCustomTitleMissing ||
      !telegramMediaValid ||
      telegramPreviewLength > telegramContentLimit
    ) {
      return;
    }
    if (telegramMessage.deliveryUncertain && !confirmUncertainRetry) {
      setPendingTelegramUncertainRetry({ context: "editor", retried: false });
      return;
    }
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(telegramResource.type),
      telegramResource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramMessageSaving(true);
    setPendingTelegramResend(null);
    setStatus("");

    try {
      const message = telegramMessage.exists
        ? await updateTelegramMessage(
            telegramResource.type,
            telegramResource.id,
            telegramBodyMarkdown,
            telegramMediaEnabled,
            normalizedTelegramMediaUrl,
            locale,
            token,
            {
              category: getTelegramStoredCategory(telegramCategory),
              title: telegramCustomTitle,
              resource: telegramEditedResource ?? undefined,
              confirmUncertainRetry
            }
          )
        : await sendTelegramMessage(
            telegramResource.type,
            telegramResource.id,
            telegramBodyMarkdown,
            telegramMediaEnabled,
            normalizedTelegramMediaUrl,
            locale,
            token,
            {
              category: getTelegramStoredCategory(telegramCategory),
              title: telegramCustomTitle,
              resource: telegramEditedResource ?? undefined,
              confirmUncertainRetry
            }
          );
      setPendingTelegramUncertainRetry(null);
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      setTelegramCategory(getTelegramStoredCategory(message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      if (message.remoteMessageMissing) {
        // ponytail: the edits are saved but nothing reached Telegram. Keep the editor
        // open and ask before sending a new message, because deleting the original one
        // may well have been deliberate.
        setTelegramBodyMarkdown(message.bodyMarkdown);
        setTelegramMediaEnabled(message.mediaEnabled);
        setTelegramMediaUrl(message.mediaUrl);
        setPendingTelegramResend(message.remoteMessageMissing);
        setStatus("");
        if (adminView === "push") void refreshTelegramPushRecords();
        return;
      }
      setStatus(
        telegramMessage.exists ? telegramText.updated : telegramText.sent
      );
      if (adminView === "push") void refreshTelegramPushRecords();
      setTelegramResource(null);
      setTelegramMessage(null);
      setIsCreatingTelegramPush(false);
      setTelegramBodyMarkdown("");
      setTelegramMediaEnabled(false);
      setTelegramMediaUrl("");
    } catch (error) {
      if (isTelegramPushUncertainError(error)) {
        if (!telegramMessage.exists) {
          setTelegramMessage((current) => current ? { ...current, deliveryUncertain: true } : current);
        }
        setPendingTelegramUncertainRetry({ context: "editor", retried: confirmUncertainRetry });
        setStatus("");
      } else {
        setPendingTelegramUncertainRetry(null);
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      releaseWriteAction(actionKey);
      setTelegramMessageSaving(false);
    }
  }

  function confirmTelegramUncertainRetry() {
    const context = pendingTelegramUncertainRetry?.context;
    if (!context || isTelegramPushConfirmBusy) return;
    if (context === "record") {
      void confirmPushTelegramRecord(true);
    } else if (context === "quick") {
      void confirmTelegramQuickPush(true);
    } else {
      void submitTelegramMessage(true);
    }
  }

  function closeArticleEditor() {
    articleEditorLoadRequestRef.current += 1;
    setPendingAiDocumentImport(null);
    setArticleFormOpen(false);
  }

  function requestArticleEditorClose() {
    articleEditorCloseRequestRef.current?.() ?? closeArticleEditor();
  }

  function closeContentSourceEditor() {
    invalidateContentPreview();
    setContentSourceFormOpen(false);
  }

  function requestContentSourceEditorClose() {
    contentSourceEditorCloseRequestRef.current?.() ?? closeContentSourceEditor();
  }

  function closeContentConvertDialog() {
    contentConvertPreviewRequestRef.current += 1;
    setPendingConvertItem(null);
    setConvertArticleCategory("");
    setConvertArticlePreview(null);
    setConvertArticlePreviewLoading(false);
    setConvertArticlePreviewError("");
    setConvertPublishMode("published");
  }

  function requestContentConvertClose() {
    contentConvertCloseRequestRef.current?.() ?? closeContentConvertDialog();
  }

  function openCreateArticle() {
    articleEditorLoadRequestRef.current += 1;
    const category = isAllCategoryValue(articleCategoryFilter)
      ? ""
      : articleCategoryFilter;

    setEditingArticle(null);
    setArticleForm({ ...initialArticleForm, category });
    setArticleTagText(formatTagInputText(initialArticleForm.tags));
    setArticleFormOpen(true);
  }

  async function openEditArticle(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) return;
    const requestId = articleEditorLoadRequestRef.current + 1;
    articleEditorLoadRequestRef.current = requestId;
    const returnFocusTarget = getDialogReturnFocusTarget(document.activeElement);
    setStatus("");

    try {
      const fullArticle = await loadAdminArticle(article.id, token);
      if (articleEditorLoadRequestRef.current !== requestId) return;
      const nextForm = normalizeArticleForm(fullArticle);
      setEditingArticle(fullArticle);
      setArticleForm(nextForm);
      setArticleTagText(formatTagInputText(nextForm.tags));
      rememberNextDialogReturnFocus(returnFocusTarget);
      setArticleFormOpen(true);
    } catch (error) {
      if (articleEditorLoadRequestRef.current === requestId) {
        setStatus(workspaceText.articleLoadFailed);
      }
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function openCreateContentSource() {
    invalidateContentPreview();
    const category = isAllCategoryValue(contentCategoryFilter)
      ? ""
      : contentCategoryFilter;

    setEditingContentSource(null);
    setContentSourceForm({ ...initialContentSourceForm, category });
    setContentSourceTagText(formatTagInputText(initialContentSourceForm.tags));
    setContentPreview(null);
    setContentSourceFormOpen(true);
  }

  function openEditContentSource(source: ContentSource) {
    if (isWriteEntityLocked("content-source", source.id)) return;
    invalidateContentPreview();
    const nextForm = normalizeContentSourceForm(source);

    setEditingContentSource(source);
    setContentSourceForm(nextForm);
    setContentSourceTagText(formatTagInputText(nextForm.tags));
    setContentPreview(null);
    setContentSourceFormOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("tool", editingTool?.id);
    if (!acquireWriteAction(actionKey)) return;

    const category = normalizeAdminCategoryValue(form.category);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(categoryText.requiredLabel(categoryText.toolLabel));
      releaseWriteAction(actionKey);
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const normalizedUrl = normalizeHttpUrlInput(form.url);
      const normalizedDemoUrl = normalizeHttpUrlInput(form.demoUrl);
      const normalizedImage = normalizeHttpUrlInput(form.image);
      const tags = parseArticleTagsInput(toolTagText);
      const payload = {
        ...form,
        category,
        url: normalizedUrl,
        demoUrl: normalizedDemoUrl,
        image: normalizedImage || createImageFromUrl(normalizedUrl),
        tags
      };

      if (editingTool) {
        await updateTool(editingTool.id, payload, token);
      } else {
        await createTool(payload, token);
      }

      requestToolEditorClose();
      await refreshAfterMutation(refresh, editingTool ? t.status.toolUpdated : t.status.toolCreated);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsSaving(false);
    }
  }

  async function handleSaveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("article", editingArticle?.id);
    if (!acquireWriteAction(actionKey)) return;
    setStatus("");

    const category = normalizeAdminCategoryValue(articleForm.category);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(categoryText.requiredLabel(categoryText.articleLabel));
      releaseWriteAction(actionKey);
      return;
    }

    setIsArticleSaving(true);

    try {
      const normalizedCoverImage = normalizeHttpUrlInput(articleForm.coverImage);
      const tags = parseArticleTagsInput(articleTagText);
      const payload = {
        ...articleForm,
        category,
        coverImage: normalizedCoverImage,
        publishedAt: datetimeLocalToIso(articleForm.publishedAt),
        slug: normalizeSlugInput(articleForm.slug),
        tags
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, payload, token);
      } else {
        await createArticle(payload, token);
      }

      requestArticleEditorClose();
      await refreshAfterMutation(refreshArticles, editingArticle ? articleText.updated : articleText.created);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsArticleSaving(false);
    }
  }

  function invalidateContentPreview() {
    contentPreviewRequestRef.current += 1;
    contentPreviewAbortRef.current?.abort();
    contentPreviewAbortRef.current = null;
    contentPreviewAppliedTitleRef.current = "";
    setIsContentPreviewing(false);
    setContentPreview(null);
  }

  async function handlePreviewContentSource() {
    const requestId = contentPreviewRequestRef.current + 1;
    contentPreviewRequestRef.current = requestId;
    contentPreviewAbortRef.current?.abort();
    const controller = new AbortController();
    contentPreviewAbortRef.current = controller;
    setIsContentPreviewing(true);
    setContentPreview(null);
    setStatus("");

    try {
      const tags = parseArticleTagsInput(contentSourceTagText);
      const payload = {
        ...contentSourceForm,
        url: normalizeHttpUrlInput(contentSourceForm.url),
        tags
      };
      const preview = await previewContentSource(payload, token, {
        signal: controller.signal
      });
      if (
        controller.signal.aborted ||
        contentPreviewRequestRef.current !== requestId
      ) {
        return;
      }
      setContentPreview(preview);
      setStatus(contentText.previewLoaded(preview.items.length));

      setContentSourceForm((current) => {
        if (current.title.trim()) {
          contentPreviewAppliedTitleRef.current = "";
          return current;
        }
        contentPreviewAppliedTitleRef.current = preview.title;
        return { ...current, title: preview.title };
      });

      window.requestAnimationFrame(() => {
        if (contentPreviewRequestRef.current === requestId) {
          contentPreviewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    } catch (error) {
      if (
        !controller.signal.aborted &&
        contentPreviewRequestRef.current === requestId
      ) {
        setStatus(getContentFeedErrorMessage(error, contentText, t, t.status.saveFailed));
      }
    } finally {
      if (contentPreviewRequestRef.current === requestId) {
        setIsContentPreviewing(false);
        if (contentPreviewAbortRef.current === controller) {
          contentPreviewAbortRef.current = null;
        }
      }
    }
  }

  async function handleSaveContentSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("content-source", editingContentSource?.id);
    if (!acquireWriteAction(actionKey)) return;
    setStatus("");

    const category = normalizeAdminCategoryValue(contentSourceForm.category);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(categoryText.requiredLabel(categoryText.contentLabel));
      releaseWriteAction(actionKey);
      return;
    }

    setIsContentSourceSaving(true);

    try {
      const tags = parseArticleTagsInput(contentSourceTagText);
      const payload = {
        ...contentSourceForm,
        category,
        url: normalizeHttpUrlInput(contentSourceForm.url),
        tags
      };
      const savedSource = editingContentSource
        ? await updateContentSource(editingContentSource.id, payload, token)
        : await createContentSource(payload, token);

      if (!editingContentSource) {
        setContentSources((current) => [
          savedSource,
          ...current.filter((source) => source.id !== savedSource.id)
        ]);
        contentSourcesLoadedRef.current = true;
      }
      requestContentSourceEditorClose();

      let resultMessage = contentText.saved;
      if (!editingContentSource) {
        try {
          const result = await syncContentSource(savedSource.id, token);
          resultMessage = contentText.synced(result.imported, result.updated);
        } catch (error) {
          const syncError = getContentFeedErrorMessage(
            error,
            contentText,
            t,
            t.errors.requestFailed
          );
          resultMessage = contentText.savedSyncFailed(syncError);
        }
      }

      await refreshAfterMutation(refreshContent, resultMessage);
    } catch (error) {
      setStatus(getContentFeedErrorMessage(error, contentText, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsContentSourceSaving(false);
    }
  }

  async function handleSyncContentSources(sources: ContentSource[]) {
    const targets = sources.filter((source) => source.category.trim());
    if (sources.length && !targets.length) {
      setStatus(categoryText.requiredLabel(categoryText.contentLabel));
      return;
    }

    const actionKeys = targets
      .map((source) => getAdminWriteEntityKey("content-source", source.id))
      .filter((key) => acquireWriteAction(key));
    if (!actionKeys.length) return;

    setStatus("");

    try {
      const results = await Promise.allSettled(
        targets
          .filter((source) =>
            actionKeys.includes(getAdminWriteEntityKey("content-source", source.id))
          )
          .map((source) => syncContentSource(source.id, token))
      );
      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<ContentSyncResponse> =>
          result.status === "fulfilled"
      );
      const failed = results.length - succeeded.length;
      const imported = succeeded.reduce((total, result) => total + result.value.imported, 0);
      const updated = succeeded.reduce((total, result) => total + result.value.updated, 0);

      if (!succeeded.length) {
        const firstFailure = results.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );
        setStatus(
          getContentFeedErrorMessage(
            firstFailure?.reason,
            contentText,
            t,
            t.status.saveFailed
          )
        );
        return;
      }

      await refreshAfterMutation(refreshContent,
        results.length === 1
          ? contentText.synced(imported, updated)
          : `${contentText.syncedCategory(succeeded.length, imported, updated)}${
              failed ? ` ${contentText.syncedCategoryPartial(failed)}` : ""
            }`
      );
    } finally {
      for (const key of actionKeys) releaseWriteAction(key);
    }
  }

  async function handleDelete(tool: Tool) {
    const actionKey = getAdminWriteEntityKey("tool", tool.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteTool(null);
      return false;
    }
    setIsDeletingTool(true);
    try {
      await deleteTool(tool.id, token);
      setPendingDeleteTool(null);
      await refreshAfterMutation(refresh, t.status.toolDeleted);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingTool(false);
    }
  }

  async function handleDeleteArticle(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteArticle(null);
      return false;
    }
    setIsDeletingArticle(true);

    try {
      await deleteArticle(article.id, token);
      setPendingDeleteArticle(null);
      await refreshAfterMutation(async (options) => combineAdminRefreshResults(
        await Promise.all([refreshArticles(options), refreshContent(options)])
      ), articleText.deleted);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingArticle(false);
    }
  }

  async function handleDeleteContentSource(source: ContentSource) {
    const actionKey = getAdminWriteEntityKey("content-source", source.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteContentSource(null);
      return false;
    }
    setIsDeletingContentSource(true);

    try {
      await deleteContentSource(source.id, token);
      setPendingDeleteContentSource(null);
      setContentSources((current) =>
        current.filter((item) => item.id !== source.id)
      );
      setContentSourceFilter((current) => (current === source.id ? "all" : current));
      await refreshAfterMutation(refreshContent, contentText.deleted);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingContentSource(false);
    }
  }

  async function handleDeleteTelegramPush(record: TelegramPushRecord) {
    if (isDeletingTelegramPush) return false;
    setIsDeletingTelegramPush(true);
    setStatus("");

    try {
      await deleteTelegramPush(record.resourceType, record.resourceId, record.id, token);
      setPendingDeleteTelegramPush(null);
      setViewingTelegramPush((current) => current?.id === record.id ? null : current);
      await refreshAfterMutation(refreshTelegramPushRecords, telegramText.management.deleted);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      setIsDeletingTelegramPush(false);
    }
  }

  async function openConvertContentItem(item: ContentItemSummary) {
    if (isWriteEntityLocked("content-item", item.id)) {
      return;
    }

    const itemCategory = normalizeAdminCategoryValue(item.category);
    const linkedArticleCategory = normalizeAdminCategoryValue(
      item.articleCategory ?? ""
    );
    const initialCategory = linkedArticleCategory
      ? linkedArticleCategory
      : !isAllCategoryValue(articleCategoryFilter)
        ? articleCategoryFilter
        : articleExistingCategories.includes(itemCategory)
          ? itemCategory
          : "";

    setPendingConvertItem(item);
    setConvertArticleCategory(initialCategory);
    setConvertArticlePreview(null);
    setConvertArticlePreviewError("");
    setConvertArticlePreviewLoading(true);
    setConvertPublishMode(
      item.articleId && item.articlePublished === false ? "draft" : "published"
    );

    const requestId = contentConvertPreviewRequestRef.current + 1;
    contentConvertPreviewRequestRef.current = requestId;
    try {
      const preview = await loadContentItemArticlePreview(item.id, token);
      if (contentConvertPreviewRequestRef.current === requestId) {
        setConvertArticlePreview(preview);
      }
    } catch (error) {
      if (contentConvertPreviewRequestRef.current === requestId) {
        setConvertArticlePreviewError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (contentConvertPreviewRequestRef.current === requestId) {
        setConvertArticlePreviewLoading(false);
      }
    }
  }

  async function handleConvertContentItem(
    item: ContentItemSummary,
    categoryValue: string,
    publishMode: ConvertPublishMode
  ) {
    const actionKey = getAdminWriteEntityKey("content-item", item.id);
    if (!acquireWriteAction(actionKey)) return;

    const category = normalizeAdminCategoryValue(categoryValue);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(categoryText.requiredLabel(categoryText.articleLabel));
      releaseWriteAction(actionKey);
      return;
    }

    setStatus("");

    try {
      const shouldPublish = publishMode === "published";
      const article = await convertContentItemToArticle(
        item.id,
        category,
        shouldPublish,
        token
      );
      setContentItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                articleId: article.id,
                articleSlug: article.slug,
                articleCategory: article.category,
                articlePublished: article.published
              }
            : entry
        )
      );
      requestContentConvertClose();
      await refreshAfterMutation(refreshArticles,
        item.articleId
          ? shouldPublish
            ? contentText.updatedPublishedDone
            : contentText.updatedDraftDone
          : shouldPublish
            ? contentText.convertedPublishedDone
            : contentText.convertedDraftDone
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  async function handleToggleFeatured(tool: Tool) {
    const actionKey = getAdminWriteEntityKey("tool", tool.id);
    if (!acquireWriteAction(actionKey)) return;
    const nextFeatured = !tool.featured;
    setStatus("");

    try {
      const updatedTool = await updateTool(
        tool.id,
        {
          ...normalizeForm(tool),
          featured: nextFeatured
        },
        token
      );
      setTools((current) =>
        current.map((item) => (item.id === updatedTool.id ? updatedTool : item))
      );
      setStatus(
        nextFeatured ? t.status.featuredEnabled : t.status.featuredDisabled
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function requestToggleFeatured(tool: Tool) {
    if (isWriteEntityLocked("tool", tool.id)) return;
    setPendingFeaturedTool(tool);
  }

  async function handleToggleArticlePublished(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) return;
    const nextPublished = !article.published;
    setStatus("");

    try {
      await updateArticlePublished(article.id, nextPublished, token);
      await refreshAfterMutation(refreshArticles,
        nextPublished ? articleText.publishedDone : articleText.draftedDone
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function requestToggleArticlePublished(article: ArticleSummary) {
    if (isWriteEntityLocked("article", article.id)) return;
    setPendingPublishedArticle(article);
  }

  function handleLogout() {
    localStorage.removeItem("htools_token");
    closeMobileSidebar();
    setToken("");
  }

  if (!token) {
    return (
      <div className="admin-shell auth-shell">
        <section className="auth-card">
          <div className="auth-card-actions">
            <button className="auth-home-brand"
              type="button"
              onClick={onBackHome}
              aria-label={`${t.actions.backHome}: ${siteName}`}
            >
              <SiteBrandIdentity showSubtitle />
            </button>
            <UtilityMenuControls
              className="auth-menu-actions"
              controller={adminUtilityMenuController}
              locale={locale}
              onLocaleChange={onLocaleChange}
              onThemeChange={onThemeChange}
              t={t}
              themeMode={themeMode}
            />
          </div>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span className="auth-password-label">
                <span>{t.admin.password}</span>
                {authStatus ? <span className="auth-inline-status" role="alert">{authStatus}</span> : null}
              </span>
              <input
                ref={passwordInputRef}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                disabled={isLoggingIn}
                className={passwordError ? "is-invalid" : ""}
                placeholder={passwordError || "ADMIN_PASSWORD"}
                type="password"
              />
            </label>
            {authConfig?.turnstileEnabled ? (
              <TurnstileWidget
                language={locale === "zh" ? "zh-CN" : "en"}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
                onLoadError={handleTurnstileLoadError}
                onTokenChange={handleTurnstileTokenChange}
                resetKey={turnstileResetKey}
                siteKey={authConfig.turnstileSiteKey}
              />
            ) : null}
            <button className="primary-button wide"
              disabled={isLoggingIn || !authConfig}
              type="submit"
            >
              {t.actions.login}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const pendingCategoryIsAll = pendingCategoryAction
    ? isAllCategoryValue(pendingCategoryAction.category)
    : false;
  const pendingCategoryIsPushSource = pendingCategoryAction?.scope === "push" &&
    isTelegramPushSourceFilter(pendingCategoryAction.category);
  const pendingCategoryIsBulkClear = pendingCategoryIsAll || pendingCategoryIsPushSource;
  const pendingCategoryPushScopeLabel = pendingCategoryAction?.scope === "push"
    ? pendingCategoryIsPushSource
      ? categoryText.pushSourceScopeLabel(
          getTelegramPushCategoryLabel(pendingCategoryAction.category, telegramText, t)
        )
      : categoryText.scopeLabel("push")
    : "";
  const sidebarToggleLabel = isMobileSidebarViewport
    ? mobileSidebarOpen
      ? t.actions.close
      : t.admin.expandSidebar
    : sidebarCollapsed
      ? t.admin.expandSidebar
      : t.admin.collapseSidebar;
  const telegramResourceUrlField = telegramResource && telegramResource.type !== "content" ? (
    <AdminUrlField
      disabled={telegramMessageLoading || telegramMessageSaving}
      inputAside={
        telegramResource.type === "tool" || telegramResource.type === "custom" ? (
          <AdminGitHubMetadataButton
            disabled={telegramGitHub.loading}
            label={t.form.githubMetadata}
            mobileLabel={locale === "zh" ? "仓库" : "Repo"}
            onClick={() =>
              void telegramGitHub.load(telegramUrl, {
                force: true,
                apply: true,
                notify: true,
                overwrite: true
              })
            }
            onUnavailable={() => setStatus(t.form.githubMetadataUnavailable)}
            unavailable={!telegramGitHub.canLoad}
            unavailableTitle={t.form.githubMetadataUnavailable}
          />
        ) : undefined
      }
      label={
        telegramResource.type === "article"
          ? (locale === "zh" ? "文章地址" : "Article URL")
          : t.form.url
      }
      onChange={(url) => {
        if (url !== telegramUrl) telegramGitHub.reset(url);
        setTelegramUrl(url);
        setTelegramBodyMarkdown((current) =>
          syncTelegramBodyField(
            current,
            { url, resourceType: telegramResource.type },
            telegramSettings.footerMarkdown,
            locale
          )
        );
      }}
      placeholder={
        telegramResource.type === "article"
          ? telegramText.articleUrlPlaceholder
          : t.form.urlPlaceholder
      }
      value={telegramUrl}
    />
  ) : null;
  const telegramContentOriginalUrlField = telegramResource?.type === "content" ? (
    <AdminUrlField
      disabled={telegramMessageLoading || telegramMessageSaving}
      label={telegramText.contentOriginalUrlLabel}
      onChange={(demoUrl) => {
        setTelegramDemoUrl(demoUrl);
        setTelegramBodyMarkdown((current) =>
          syncTelegramBodyField(
            current,
            { demoUrl, resourceType: telegramResource.type },
            telegramSettings.footerMarkdown,
            locale
          )
        );
      }}
      placeholder={telegramText.contentOriginalUrlPlaceholder}
      value={telegramDemoUrl}
    />
  ) : null;
  const telegramMediaUrlField = telegramResource ? (
    <AdminUrlField
      className="telegram-media-url-field"
      disabled={telegramMessageLoading || telegramMessageSaving}
      help={telegramText.mediaHelp}
      titleAside={
        <SettingsStatusBadge
          disabled={telegramMessageLoading || telegramMessageSaving}
          disabledLabel={telegramText.mediaDisabled}
          enabled={telegramMediaEnabled}
          enabledLabel={telegramText.mediaEnabled}
          onChange={handleTelegramMediaEnabledChange}
        />
      }
      inputAside={
        <AdminImageUploadButton
          disabled={telegramMessageLoading || telegramMessageSaving}
          label={t.form.imageUpload}
          mobileLabel={locale === "zh" ? "上传" : "Upload"}
          onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
          onUploaded={(url) => {
            setTelegramMediaUrl(url);
            setStatus(t.form.imageUploadSuccess);
          }}
          token={token}
        />
      }
      id="telegram-media-url"
      label={telegramText.mediaUrlLabel}
      maxLength={2048}
      onChange={setTelegramMediaUrl}
      placeholder={telegramText.mediaUrlPlaceholder}
      value={telegramMediaUrl}
    >
      {!telegramMediaValid ? (
        <p className="telegram-media-error" role="alert">
          {telegramText.mediaInvalid}
        </p>
      ) : null}
    </AdminUrlField>
  ) : null;

  return (
    <div
      className={`admin-workspace ${sidebarCollapsed ? "is-sidebar-collapsed" : ""} ${
        sidebarAnimating ? "is-sidebar-animating" : ""
      } ${mobileSidebarOpen ? "is-mobile-sidebar-open" : ""}`}
    >
      <aside
        ref={mobileSidebarRef}
        className="admin-sidebar"
        onKeyDown={mobileSidebarFocus.handleKeyDown}
      >
        <div className="admin-sidebar-head">
          <button className="admin-brand" type="button" onClick={onBackHome}>
            <SiteBrandIdentity markClassName="compact-mark" showSubtitle />
          </button>
          <button ref={mobileSidebarCloseRef}
            className="admin-mobile-sidebar-close"
            type="button"
            aria-label={t.actions.close}
            onClick={closeMobileSidebar}
          >
            <X size={26} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label={t.admin.dashboard}>
          <span className="admin-sidebar-section">{t.admin.platform}</span>
          <button className={adminView === "tools" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("tools")}
          >
            <Wrench size={18} />
            <span>{t.admin.toolLibrary}</span>
          </button>
          <button className={adminView === "articles" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("articles")}
          >
            <FileText size={18} />
            <span>{articleText.adminNav}</span>
          </button>
          <button className={adminView === "content" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("content")}
          >
            <Rss size={18} />
            <span>{contentText.nav}</span>
          </button>
          <button className={adminView === "push" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("push")}
          >
            <Send size={18} />
            <span>{telegramText.management.nav}</span>
          </button>

          <span className="admin-sidebar-section">{t.admin.settings}</span>
          <button className={adminView === "import-export" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("import-export")}
          >
            <ArrowRightLeft size={18} />
            <span>{maintenanceText.importExportTab}</span>
          </button>
          <button className={adminView === "link-check" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("link-check")}
          >
            <ShieldCheck size={18} />
            <span>{maintenanceText.linkCheckTab}</span>
          </button>
          <button className={adminView === "system" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("system")}
          >
            <Settings size={18} />
            <span>{maintenanceText.systemTitle}</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <UtilityMenuControls
            className="admin-sidebar-utility"
            controller={adminUtilityMenuController}
            iconSize={17}
            locale={locale}
            localeControlClassName="admin-utility-menu"
            onLocaleChange={onLocaleChange}
            onThemeChange={onThemeChange}
            t={t}
            themeControlClassName="admin-utility-menu"
            themeMode={themeMode}
          />

          <div className="admin-user-card">
            <span className="admin-user-card-copy">
              <strong>{t.admin.rootUser}</strong>
              <small>{t.admin.directoryService}</small>
            </span>
            <button
              className="icon-button"
              type="button"
              onClick={handleLogout}
              aria-label={t.actions.logout}
            >
              <LogOut aria-hidden="true" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <button className="admin-mobile-sidebar-overlay"
        type="button"
        aria-label={t.actions.close}
        onClick={closeMobileSidebar}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <button ref={sidebarToggleRef}
              className={`admin-sidebar-toggle ${sidebarAnimating ? "is-toggling" : ""}`}
              type="button"
              aria-expanded={
                isMobileSidebarViewport ? mobileSidebarOpen : !sidebarCollapsed
              }
              aria-label={sidebarToggleLabel}
              title={sidebarToggleLabel}
              onClick={toggleSidebar}
            >
              <PanelLeft size={18} />
            </button>
            <span>{t.admin.dashboard}</span>
            <ChevronRight size={15} />
            <strong>{activeTitle}</strong>
          </div>

          <div className="admin-topbar-actions">
            {adminView === "system" ? (
              <div
                className="admin-command-row admin-system-settings-topbar-slot"
                id="admin-system-settings-topbar-slot"
              />
            ) : null}
            {adminView === "tools" ? (
              <div className="admin-command-row">
                <button className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreate}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{t.actions.addTool}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton mode={toolSortMode} onChange={setToolSortMode} t={t} />
              </div>
            ) : null}
            {adminView === "articles" ? (
              <div className="admin-command-row">
                <button className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreateArticle}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{articleText.addArticle}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={articleSortMode}
                  onChange={setArticleSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "content" ? (
              <div className="admin-command-row">
                <button className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreateContentSource}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{contentText.addContent}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={contentSortMode}
                  onChange={setContentSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "push" ? (
              <div className="admin-command-row">
                <button className="ghost-button admin-create-button"
                  disabled={!telegramSettings.enabled}
                  type="button"
                  onClick={openCreateTelegramPush}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">
                    {telegramText.management.addPush}
                  </span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={telegramPushSortMode}
                  onChange={setTelegramPushSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "tools" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(adminCategory) || Boolean(adminSearch.trim())
                }
                searchPlaceholder={t.admin.searchPlaceholder}
                searchValue={adminSearch}
                onClear={() => {
                  setAdminCategory("All");
                  setAdminSearch("");
                }}
                onSearchChange={setAdminSearch}
                categoryControl={<AdminCategoryFilter
                  {...categoryIconProps("tools")}
                  allLabel={categoryText.toolLabel}
                  categories={adminFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("tools", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("tools", category)
                  }
                  onChange={(category) => {
                    setAdminCategory(category);
                    void rememberAdminCategory("tools", category);
                  }}
                  t={t}
                  value={adminCategory}
                />}
              />
            ) : null}
            {adminView === "articles" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(articleCategoryFilter) || Boolean(articleSearch.trim())
                }
                searchPlaceholder={articleText.searchPlaceholder}
                searchValue={articleSearch}
                onClear={() => {
                  setArticleCategoryFilter("All");
                  setArticleSearch("");
                  setDebouncedArticleSearch("");
                }}
                onSearchChange={setArticleSearch}
                categoryControl={<AdminCategoryFilter
                  {...categoryIconProps("articles")}
                  allLabel={categoryText.articleLabel}
                  categories={articleFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("articles", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("articles", category)
                  }
                  onChange={(category) => {
                    setArticleCategoryFilter(category);
                    void rememberAdminCategory("articles", category);
                  }}
                  t={t}
                  value={articleCategoryFilter}
                />}
              />
            ) : null}
            {adminView === "content" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(contentCategoryFilter) ||
                  contentSourceFilter !== "all" ||
                  Boolean(contentSearch.trim())
                }
                searchPlaceholder={contentText.searchPlaceholder}
                searchValue={contentSearch}
                onClear={() => {
                  setContentCategoryFilter("All");
                  setContentSourceFilter("all");
                  setContentSearch("");
                  setDebouncedContentSearch("");
                }}
                onSearchChange={setContentSearch}
                categoryControl={<AdminCategoryFilter
                  {...categoryIconProps("content")}
                  allLabel={categoryText.contentLabel}
                  categories={contentFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("content", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("content", category)
                  }
                  onChange={(category) => {
                    setContentCategoryFilter(category);
                    setContentRailCategory(null);
                    setContentSourceFilter("all");
                    void rememberAdminCategory("content", category);
                  }}
                  t={t}
                  value={contentCategoryFilter}
                />}
              />
            ) : null}
            {adminView === "push" ? (
              <AdminFilterBar
                categoryControl={<AdminCategoryFilter
                  {...categoryIconProps("push")}
                  allLabel={categoryText.pushLabel}
                  deletableFixedCategories={TELEGRAM_PUSH_FIXED_FILTERS}
                  fixedCategories={TELEGRAM_PUSH_FIXED_FILTERS}
                  categories={pushFilterCategories}
                  categoryText={categoryText}
                  labelFor={(category) =>
                    getTelegramPushCategoryLabel(category, telegramText, t)
                  }
                  onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                  onMoveCategory={(category) => void moveAdminCategory("push", category)}
                  onChange={(category) => {
                    setTelegramPushCategory(category);
                    if (!TELEGRAM_PUSH_FIXED_FILTERS.includes(category)) {
                      void rememberAdminCategory("push", category);
                    }
                  }}
                  t={t}
                  value={telegramPushCategory}
                />}
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(telegramPushCategory) || Boolean(telegramPushSearch.trim())
                }
                onClear={() => {
                  setTelegramPushCategory("All");
                  setTelegramPushSearch("");
                  setDebouncedTelegramPushSearch("");
                }}
                onSearchChange={setTelegramPushSearch}
                searchPlaceholder={telegramText.management.searchPlaceholder}
                searchValue={telegramPushSearch}
              />
            ) : null}
          </div>
        </header>

        <div
          className={`admin-content-scroll ${
            adminView === "content" ? "is-full-height" : ""
          }`}
          ref={adminContentScrollRef}
        >
          {adminView === "tools" && (
            isLoadingTools && !hasLoadedTools ? (
              <SkeletonVisibility visible={showAdminToolSkeletons}>
                <AdminResourceCardSkeletonGrid ariaLabel={t.admin.manageTools} />
              </SkeletonVisibility>
            ) : toolsLoadError ? (
              <AdminInitialLoadError
                isRetrying={isLoadingTools}
                message={toolsLoadError}
                onRetry={() => void refresh()}
                t={t}
              />
            ) : visibleTools.length ? (
              <section className="admin-tool-grid" aria-label={t.admin.manageTools}>
                {visibleTools.map((tool) => (
                  <AdminToolCard
                    key={tool.id}
                    isBusy={writeLockedEntityKeys.has(
                      getAdminWriteEntityKey("tool", tool.id)
                    )}
                    onDelete={() => {
                      if (!isWriteEntityLocked("tool", tool.id)) {
                        setPendingDeleteTool(tool);
                      }
                    }}
                    onEdit={() => openEdit(tool)}
                    onTelegram={() =>
                      void openTelegramQuickPush(createTelegramToolResource(tool))
                    }
                    onToggleFeatured={() => requestToggleFeatured(tool)}
                    proxySettings={proxySettings}
                    t={t}
                    telegramEnabled={telegramSettings.enabled}
                    telegramText={telegramText}
                    tool={tool}
                  />
                ))}
              </section>
            ) : (
              <AdminEmptyState
                action={
                  tools.length === 0
                    ? {
                        label: t.empty.libraryAction,
                        onClick: () => selectAdminView("import-export")
                      }
                    : {
                        label: t.actions.clearFilters,
                        onClick: () => {
                          setAdminCategory("All");
                          setAdminSearch("");
                        },
                        tone: "ghost"
                      }
                }
                description={
                  tools.length === 0
                    ? t.empty.libraryDescription
                    : t.admin.emptyDescription
                }
                title={tools.length === 0 ? t.empty.libraryTitle : t.admin.emptyTitle}
              />
            )
          )}

          {adminView === "articles" && (
            isLoadingArticles && !hasLoadedArticles ? (
              <SkeletonVisibility visible={showAdminArticleSkeletons}>
                <AdminResourceCardSkeletonGrid ariaLabel={articleText.adminTitle} />
              </SkeletonVisibility>
            ) : articlesLoadError ? (
              <AdminInitialLoadError
                isRetrying={isLoadingArticles}
                message={articlesLoadError}
                onRetry={() => void refreshArticles()}
                t={t}
              />
            ) : visibleArticles.length ? (
              <>
                <section className="admin-tool-grid" aria-label={articleText.adminTitle}>
                  {visibleArticles.map((article) => (
                    <AdminArticleCard
                      article={article}
                      articleText={articleText}
                      isBusy={writeLockedEntityKeys.has(
                        getAdminWriteEntityKey("article", article.id)
                      )}
                      key={article.id}
                      onBrowse={() => setBrowsingArticle(article)}
                      onDelete={() => {
                        if (!isWriteEntityLocked("article", article.id)) {
                          setPendingDeleteArticle(article);
                        }
                      }}
                      onEdit={() => void openEditArticle(article)}
                      onTelegram={() =>
                        void openTelegramQuickPush(
                          createTelegramArticleResource(article, window.location.origin)
                        )
                      }
                      onTogglePublished={() => requestToggleArticlePublished(article)}
                      t={t}
                      telegramEnabled={telegramSettings.enabled}
                      telegramText={telegramText}
                    />
                  ))}
                </section>
                {adminArticlesHasMore ? (
                  <div className="content-flow-load-more">
                    <button className="ghost-button" disabled={isLoadingMoreArticles}
                      type="button"
                      onClick={() => void loadMoreAdminArticles()}
                    >
                      {articleText.loadMore}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <AdminEmptyState
                action={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? { label: articleText.addArticle, onClick: openCreateArticle }
                    : {
                        label: t.actions.clearFilters,
                        onClick: () => {
                          setArticleCategoryFilter("All");
                          setArticleSearch("");
                          setDebouncedArticleSearch("");
                        },
                        tone: "ghost"
                      }
                }
                description={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? articleText.emptyDescription
                    : articleText.noMatchDescription
                }
                title={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? articleText.emptyTitle
                    : articleText.noMatchTitle
                }
              />
            )
          )}

          {adminView === "content" ? (
            <AdminContentFlowPanel
              categoryIcons={adminCategoryIcons.content}
              contentSourceCounts={contentSourceCounts}
              clearFiltersLabel={t.actions.clearFilters}
              categoryOrder={contentFilterCategories}
              contentCategoryFilter={effectiveContentCategory}
              contentSourceFilter={contentSourceFilter}
              contentSources={contentSources}
              contentText={contentText}
              contentCategoryItemCount={contentItemsTotal}
              hasActiveFilter={
                !isAllCategoryValue(effectiveContentCategory) ||
                contentSourceFilter !== "all" ||
                Boolean(contentSearch.trim())
              }
              hasAnyContentSources={contentSources.length > 0}
              hasLoadedContent={hasLoadedContent}
              loadError={contentLoadError ?? contentSourcesLoadError}
              isLoadingContent={isLoadingContent}
              isLoadingMoreContent={isLoadingMoreContent}
              locale={locale}
              hasMoreContent={contentItemsHasMore}
              onConvertItem={openConvertContentItem}
              onTelegram={(item) =>
                void openTelegramQuickPush(
                  createTelegramContentResource(item, window.location.origin)
                )
              }
              onDeleteSource={(source) => {
                if (!isWriteEntityLocked("content-source", source.id)) {
                  setPendingDeleteContentSource(source);
                }
              }}
              onEditSource={openEditContentSource}
              onSelectScope={({ category, sourceId }) => {
                const normalized = normalizeAdminCategoryValue(category);
                setContentRailCategory(
                  isAllCategoryValue(normalized) || !normalized ? null : normalized
                );
                setContentSourceFilter(sourceId);
              }}
              onSyncSources={(sources) => void handleSyncContentSources(sources)}
              onLoadMore={() => void loadMoreContentItems()}
              onRetry={() => void refreshContent()}
              onClearFilters={() => {
                setContentCategoryFilter("All");
                setContentRailCategory(null);
                setContentSourceFilter("all");
                setContentSearch("");
                setDebouncedContentSearch("");
              }}
              proxySettings={proxySettings}
              readerEnabled={isContentReaderViewport}
              onAddSource={openCreateContentSource}
              showSkeletons={showAdminContentSkeletons}
              t={t}
              telegramEnabled={telegramSettings.enabled}
              telegramText={telegramText}
              token={token}
              visibleContentItems={visibleContentItems}
              writeLockedEntityKeys={writeLockedEntityKeys}
            />
          ) : null}

          {adminView === "push" ? (
            <AdminTelegramPushPanel
              hasActiveFilter={
                !isAllCategoryValue(telegramPushCategory) || Boolean(debouncedTelegramPushSearch)
              }
              hasMore={telegramPushHasMore}
              isLoading={
                isLoadingTelegramPushes || !hasLoadedTelegramPushes
              }
              isLoadingMore={isLoadingMoreTelegramPushes}
              loadError={telegramPushLoadError}
              onDelete={setPendingDeleteTelegramPush}
              onEdit={(record) => {
                if (record.resource) {
                  void openTelegramMessageDialog(record.resource);
                }
              }}
              onClearFilters={() => {
                setTelegramPushCategory("All");
                setTelegramPushSearch("");
                setDebouncedTelegramPushSearch("");
              }}
              onCreate={openCreateTelegramPush}
              onLoadMore={() => void loadMoreTelegramPushRecords()}
              onOpenSettings={openServiceSettings}
              onPush={(record) => {
                setPendingPushTelegramRecord(record);
                if (record.deliveryUncertain) {
                  setPendingTelegramUncertainRetry({ context: "record", retried: false });
                }
              }}
              onPushedStatus={() =>
                onNotify({
                  message: telegramText.management.pushedNotice,
                  tone: "info"
                })
              }
              onRetry={() => void refreshTelegramPushRecords()}
              onView={setViewingTelegramPush}
              records={telegramPushRecords}
              serviceEnabled={telegramSettings.enabled}
              settingsLoading={telegramSettingsLoading}
              showSkeletons={showTelegramPushSkeletons}
              t={t}
              text={telegramText.management}
            />
          ) : null}

          {adminView === "import-export" || adminView === "link-check" ? (
            <AdminLinkCheckPanel
              isLoadingTools={isLoadingTools && !hasLoadedTools}
              maintenanceText={maintenanceText}
              onReloadTools={(resultMessage) => resultMessage
                ? refreshAfterMutation(refresh, resultMessage)
                : refresh()}
              proxySettings={proxySettings}
              setStatus={setStatus}
              t={t}
              token={token}
              tools={tools}
              section={adminView}
            />
          ) : null}

          {adminView === "system" ? (
            <AdminSystemSettingsPanel
              locale={locale}
              maintenanceText={maintenanceText}
              onTokenChange={(nextToken) => {
                localStorage.setItem("htools_token", nextToken);
                setToken(nextToken);
              }}
              onProxySettingsChange={onProxySettingsChange}
              onDataRestored={(resultMessage, settingsResult) => refreshAfterMutation(async (options) =>
                combineAdminRefreshResults(await Promise.all([
                  settingsResult,
                  refreshAdminCategories(options),
                  refresh(options),
                  refreshArticles(options),
                  refreshContent(options)
                ])), resultMessage)}
              onSiteSettingsChange={onSiteSettingsChange}
              adminAiSettings={adminAiSettings}
              adminAiSettingsLoadError={adminAiSettingsLoadError}
              adminAiSettingsLoading={adminAiSettingsLoading}
              onAdminAiSettingsChange={applyAdminAiSettings}
              onReloadAdminAiSettings={refreshAdminAiSettings}
              onTelegramSettingsChange={applyTelegramSettings}
              onUmamiSettingsChange={onUmamiSettingsChange}
              onReloadTelegramSettings={refreshTelegramSettings}
              proxySettings={proxySettings}
              proxySettingsLoadError={proxySettingsLoadError}
              proxySettingsReady={proxySettingsReady}
              setStatus={setStatus}
              siteSettings={siteSettings}
              siteSettingsLoadError={siteSettingsLoadError}
              siteSettingsReady={siteSettingsReady}
              t={t}
              telegramSettings={telegramSettings}
              telegramSettingsLoadError={telegramSettingsLoadError}
              telegramSettingsLoading={telegramSettingsLoading}
              token={token}
            />
          ) : null}
        </div>
      </main>

      {telegramQuickResource && !telegramQuickLoading ? (
        <Dialog
          closeDisabled={telegramQuickSaving}
          closeLabel={t.actions.close}
          description={
            telegramQuickMessage?.deliveryUncertain
              ? telegramQuickMessage.exists
                ? telegramText.quickPush.deliveryUncertain
                : telegramText.deliveryUncertain
              : telegramQuickMessage?.exists
              ? telegramText.quickPush.alreadyPushed
              : telegramText.quickPush.description
          }
          descriptionId="telegram-quick-push-description"
          onClose={closeTelegramQuickPush}
          panelClassName="tool-editor-dialog admin-tool-editor-dialog"
          title={telegramText.title}
          footer={
            <AdminDialogActions
              disabled={
                telegramQuickLoading ||
                telegramQuickSaving ||
                !telegramQuickMessage
              }
              primaryLabel={
                telegramQuickMessage?.exists
                  ? telegramText.quickPush.goManage
                  : telegramQuickMode === "published"
                    ? telegramText.quickPush.sendAction
                    : telegramText.quickPush.draftAction
              }
              onPrimary={() => {
                if (telegramQuickMessage?.exists) {
                  closeTelegramQuickPush();
                  selectAdminView("push");
                  return;
                }
                void confirmTelegramQuickPush();
              }}
            />
          }
        >
          <div className="tool-form article-form">
            {!telegramQuickMessage?.exists ? (
              <>
                <PublishModeField
                  disabled={telegramQuickLoading || telegramQuickSaving}
                  draftLabel={telegramText.quickPush.draftLabel}
                  label={telegramText.quickPush.modeLabel}
                  onChange={setTelegramQuickMode}
                  publishedLabel={telegramText.quickPush.sendLabel}
                  value={telegramQuickMode}
                />
                <div className="tool-form-field">
                  <span className="tool-form-label">
                    {telegramText.categoryLabel}
                  </span>
                  <AdminCategoryFilter
                    {...categoryIconProps("push")}
                    alignToTopOnOpen
                    categories={uniqueAdminCategories([
                      ...pushExistingCategories,
                      telegramQuickCategory
                    ])}
                    categoryText={categoryText}
                    className="tool-form-category-filter"
                    disabled={telegramQuickLoading || telegramQuickSaving}
                    emptyOptionLabel={getTelegramDefaultCategoryLabel(telegramQuickResource.type, telegramText)}
                    onChange={(category) => {
                      setTelegramQuickCategory(category);
                      void rememberAdminCategory("push", category);
                    }}
                    onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                    onMoveCategory={(category) => void moveAdminCategory("push", category)}
                    t={t}
                    value={telegramQuickCategory}
                    scope="push"
                  />
                </div>
              </>
            ) : null}
            <div className="tool-form-field telegram-message-preview-field">
              <span className="tool-form-label">{telegramText.previewTitle}</span>
              <section className="telegram-message-preview">
                {!telegramQuickLoading && telegramQuickMessage ? (
                  <TelegramMessagePreview
                    content={telegramQuickMessage.bodyMarkdown}
                    mediaEnabled={telegramQuickMessage.mediaEnabled}
                    mediaUrl={telegramQuickMessage.mediaUrl}
                    locale={locale}
                    proxySettings={proxySettings}
                    resource={telegramQuickResource}
                  />
                ) : (
                  <div className="telegram-channel-preview-message">
                    <ArticleBodySkeleton />
                  </div>
                )}
              </section>
            </div>
          </div>
        </Dialog>
      ) : null}

      {telegramResource ? (
        <Dialog
          closeDisabled={telegramMessageSaving}
          title={telegramText.title}
          closeLabel={t.actions.close}
          description={
            telegramMessage?.deliveryUncertain
              ? telegramText.deliveryUncertain
              : telegramResource.type === "custom"
              ? telegramText.customDescription
              : telegramText.description
          }
          descriptionId="telegram-message-dialog-description"
          onClose={closeTelegramMessageDialog}
          panelClassName="tool-editor-dialog admin-tool-editor-dialog telegram-message-dialog"
          footer={
            <>
              {telegramResource.type !== "custom" ? (
                <button
                  aria-busy={telegramSourceLoading || undefined}
                  className="ghost-button"
                  disabled={
                    telegramMessageLoading ||
                    telegramMessageSaving ||
                    telegramSourceLoading
                  }
                  type="button"
                  onClick={() => {
                    if (telegramMessage?.resourceExists === false) {
                      setStatus(telegramText.management.resourceDeleted);
                      return;
                    }
                    setPendingTelegramSourceSync(true);
                  }}
                  title={telegramText.syncSourceHint}
                >
                  {telegramText.syncSource}
                </button>
              ) : null}
              <button className="ghost-button" disabled={
                  telegramMessageLoading ||
                  telegramMessageSaving ||
                  !telegramMessage ||
                  !telegramEditorDirty ||
                  !telegramBodyMarkdown.trim() ||
                  telegramCustomTitleMissing ||
                  !telegramMediaValid ||
                  telegramPreviewLength > telegramContentLimit
                }
                type="button"
                onClick={() => void saveTelegramMessageChanges()}
              >
                {telegramText.save}
              </button>
              <button className="primary-button" disabled={
                  telegramMessageLoading ||
                  telegramMessageSaving ||
                  !telegramMessage ||
                  !telegramBodyMarkdown.trim() ||
                  telegramCustomTitleMissing ||
                  !telegramMediaValid ||
                  telegramPreviewLength > telegramContentLimit
                }
                type="button"
                onClick={() => void submitTelegramMessage()}
              >
                {telegramMessage?.exists ? telegramText.update : telegramText.send}
              </button>
            </>
          }
        >
          {!telegramMessage ? (
            <div className="telegram-message-loading tool-form" role="status">
              <div className="tool-form-field telegram-message-preview-field is-placeholder">
                <span className="tool-form-label">{telegramText.previewTitle}</span>
                <section className="telegram-message-preview">
                  <div className="telegram-channel-preview-message">
                    <ArticleBodySkeleton />
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <>
              <div className="telegram-message-editor tool-form">
              {telegramResource.type === "tool" || telegramResource.type === "custom"
                ? telegramResourceUrlField
                : null}
              <AdminTextField
                disabled={telegramMessageLoading || telegramMessageSaving}
                inputAside={
                  <AdminAiAction
                    available={adminAiSettings.available}
                    disabled={telegramMessageLoading || telegramMessageSaving}
                    disabledTitle={maintenanceText.aiEnableHint}
                    enabled={adminAiSettings.enabled}
                    input={{
                      title: telegramCustomTitle,
                      description: telegramDescription,
                      bodyMarkdown: telegramBodyMarkdown,
                      url: telegramUrl,
                      demoUrl: telegramDemoUrl,
                      category: telegramCategory,
                      tags: parseArticleTagsInput(telegramTagText)
                    }}
                    label={maintenanceText.aiGeneratePushTitle}
                    locale={locale}
                    onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                    onResult={(result) => {
                      if (result.title) {
                        setTelegramCustomTitle(result.title);
                        setTelegramBodyMarkdown((current) =>
                          syncTelegramBodyField(
                            current,
                            { title: result.title },
                            telegramSettings.footerMarkdown,
                            locale
                          )
                        );
                      }
                      setStatus(getAiAppliedStatus(result));
                    }}
                    task="telegram_title"
                    token={token}
                  />
                }
                id="telegram-custom-title"
                label={telegramText.customTitleLabel}
                maxLength={120}
                onChange={(nextTitle) => {
                  setTelegramCustomTitle(nextTitle);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { title: nextTitle },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminName}
                value={telegramCustomTitle}
              />
              <AdminTextareaField
                disabled={telegramMessageLoading || telegramMessageSaving}
                inputAside={
                  <AdminAiAction
                    available={adminAiSettings.available}
                    disabled={telegramMessageLoading || telegramMessageSaving}
                    disabledTitle={maintenanceText.aiEnableHint}
                    enabled={adminAiSettings.enabled}
                    input={{
                      title: telegramCustomTitle,
                      description: telegramDescription,
                      bodyMarkdown: telegramBodyMarkdown,
                      url: telegramUrl,
                      demoUrl: telegramDemoUrl,
                      category: telegramCategory,
                      tags: parseArticleTagsInput(telegramTagText)
                    }}
                    label={maintenanceText.aiGenerateDescription}
                    locale={locale}
                    onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                    onResult={(result) => {
                      if (result.description) {
                        setTelegramDescription(result.description);
                        setTelegramBodyMarkdown((current) =>
                          syncTelegramBodyField(
                            current,
                            { description: result.description },
                            telegramSettings.footerMarkdown,
                            locale
                          )
                        );
                      }
                      setStatus(getAiAppliedStatus(result));
                    }}
                    task="telegram_description"
                    token={token}
                  />
                }
                label={t.form.description}
                onChange={(description) => {
                  setTelegramDescription(description);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { description },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminDescription}
                rows={4}
                value={telegramDescription}
              />
              {telegramContentOriginalUrlField}
              {telegramResource.type === "article" ? telegramResourceUrlField : null}
              {telegramResource.type === "tool" || telegramResource.type === "custom" ? (
                <AdminUrlField
                  disabled={telegramMessageLoading || telegramMessageSaving}
                  label={t.form.demoUrl}
                  onChange={(demoUrl) => {
                    setTelegramDemoUrl(demoUrl);
                    setTelegramBodyMarkdown((current) =>
                      syncTelegramBodyField(
                        current,
                        { demoUrl, resourceType: telegramResource.type },
                        telegramSettings.footerMarkdown,
                        locale
                      )
                    );
                  }}
                  placeholder={t.form.demoUrlPlaceholder}
                  value={telegramDemoUrl}
                />
              ) : null}
              <AdminTagsField
                disabled={telegramMessageLoading || telegramMessageSaving}
                inputAside={
                  <AdminAiAction
                    available={adminAiSettings.available}
                    disabled={telegramMessageLoading || telegramMessageSaving}
                    disabledTitle={maintenanceText.aiEnableHint}
                    enabled={adminAiSettings.enabled}
                    input={{
                      title: telegramCustomTitle,
                      description: telegramDescription,
                      bodyMarkdown: telegramBodyMarkdown,
                      url: telegramUrl,
                      demoUrl: telegramDemoUrl,
                      category: telegramCategory,
                      tags: parseArticleTagsInput(telegramTagText)
                    }}
                    label={maintenanceText.aiGenerateTags}
                    locale={locale}
                    onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                    onResult={(result) => {
                      if (result.tags) {
                        setTelegramTagText(formatTagInputText(result.tags));
                        setTelegramBodyMarkdown((current) =>
                          syncTelegramBodyField(
                            current,
                            { tags: result.tags },
                            telegramSettings.footerMarkdown,
                            locale
                          )
                        );
                      }
                      setStatus(getAiAppliedStatus(result));
                    }}
                    task="telegram_tags"
                    token={token}
                  />
                }
                label={t.form.tags}
                onChange={(tagText) => {
                  setTelegramTagText(tagText);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { tags: parseArticleTagsInput(tagText) },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminTags}
                value={telegramTagText}
              />
              {telegramResource.type === "article" || telegramResource.type === "content"
                ? telegramMediaUrlField
                : null}
              <div className="tool-form-field">
                <span className="tool-form-label">{telegramText.categoryLabel}</span>
                <AdminCategoryFilter
                  {...categoryIconProps("push")}
                  allowCreate
                  alignToTopOnOpen
                  categories={pushCategoryOptions}
                  categoryText={categoryText}
                  className="tool-form-category-filter"
                  emptyOptionLabel={getTelegramDefaultCategoryLabel(telegramResource.type, telegramText)}
                  onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                  onChange={(category) => {
                    setTelegramCategory(category);
                    void rememberAdminCategory("push", category);
                  }}
                  t={t}
                  value={telegramCategory}
                  scope="push"
                />
              </div>
              {telegramResource.type === "tool" || telegramResource.type === "custom"
                ? telegramMediaUrlField
                : null}
              <AdminMarkdownEditor
                actions={TELEGRAM_MARKDOWN_EDITOR_ACTIONS}
                className="telegram-message-body-field"
                disabled={telegramMessageLoading || telegramMessageSaving}
                id="telegram-rich-markdown-body"
                label={telegramText.bodyLabel}
                locale={locale}
                maxLength={telegramContentLimit}
                mode={telegramMarkdownEditorMode}
                onChange={(value) => {
                  setTelegramBodyMarkdown(value);
                  const fields = readTelegramBodyFields(
                    value,
                    telegramSettings.footerMarkdown,
                    locale,
                    isCreatingTelegramPush
                  );
                  if (
                    telegramResource.type === "custom" &&
                    isCreatingTelegramPush &&
                    fields.url !== telegramUrl
                  ) {
                    telegramGitHub.reset(fields.url);
                  }
                  setTelegramCustomTitle(fields.title);
                  setTelegramDescription(fields.description);
                  setTelegramUrl(fields.url);
                  setTelegramDemoUrl(fields.demoUrl);
                  setTelegramTagText(formatTagInputText(fields.tags));
                }}
                onModeChange={setTelegramMarkdownEditorMode}
                preview={
                  telegramMessageLoading ? (
                    <div className="telegram-channel-preview-message">
                      <ArticleBodySkeleton />
                    </div>
                  ) : (
                    <TelegramMessagePreview
                      content={telegramPreviewMarkdown}
                      mediaEnabled={telegramMediaEnabled}
                      mediaUrl={normalizedTelegramMediaUrl}
                      locale={locale}
                      proxySettings={proxySettings}
                      resource={telegramResource}
                    />
                  )
                }
                previewClassName="telegram-message-preview"
                placeholder={telegramText.bodyPlaceholder}
                proxySettings={proxySettings}
                rows={isCreatingTelegramPush ? 11 : 12}
                text={t.markdownEditor}
                value={telegramBodyMarkdown}
              />
              {telegramPreviewLength > telegramContentLimit ? (
                <div className="telegram-message-count" aria-live="polite">
                  <span className="is-invalid">
                    {telegramMediaEnabled
                      ? telegramText.photoCaptionTooLong
                      : telegramText.tooLong}
                  </span>
                </div>
              ) : null}
              </div>
            </>
          )}
        </Dialog>
      ) : null}

      {viewingTelegramPush ? (
        <Dialog
          closeLabel={t.actions.close}
          onClose={() => setViewingTelegramPush(null)}
          panelClassName="tool-editor-dialog telegram-message-dialog telegram-push-preview-dialog"
          title={telegramText.management.viewAction}
        >
          <div className="telegram-push-preview-dialog-body">
            <section className="telegram-message-preview">
              <TelegramMessagePreview
                content={viewingTelegramPush.messageMarkdown}
                mediaEnabled={viewingTelegramPush.mediaEnabled}
                mediaUrl={viewingTelegramPush.mediaUrl}
                locale={locale}
                proxySettings={proxySettings}
                resource={
                  viewingTelegramPush.resource ?? {
                    type: viewingTelegramPush.resourceType,
                    id: viewingTelegramPush.resourceId,
                    title: viewingTelegramPush.title,
                    description: "",
                    url: "",
                    demoUrl: "",
                    image: viewingTelegramPush.mediaUrl,
                    category: "",
                    tags: []
                  }
                }
              />
            </section>
          </div>
        </Dialog>
      ) : null}

      {browsingArticle ? (
        <Dialog
          closeLabel={t.actions.close}
          onClose={() => setBrowsingArticle(null)}
          panelClassName="tool-editor-dialog content-browse-dialog"
          title={getArticleDisplayTitle(browsingArticle)}
        >
          <div className="content-browse-dialog-body">
            {browsingArticleLoading ? (
              <ArticleDetailContentSkeleton />
            ) : browsingArticleDetail ? (
              <ArticleDetailContent
                article={browsingArticleDetail}
                locale={locale}
                proxySettings={proxySettings}
              />
            ) : (
              <AdminDetailPlaceholder
                icon={<FileText size={16} />}
                role={browsingArticleError ? "alert" : undefined}
              >
                {browsingArticleError || articleText.notFoundDescription}
              </AdminDetailPlaceholder>
            )}
          </div>
        </Dialog>
      ) : null}

      {formOpen ? (
        <Dialog
          closeRequestRef={toolEditorCloseRequestRef}
          closeDisabled={isSaving}
          description={editingTool ? t.form.editDescription : t.form.addDescription}
          descriptionId="tool-editor-dialog-description"
          title={editingTool ? t.admin.editTool : t.actions.addTool}
          closeLabel={t.actions.close}
          onClose={() => {
            closeToolEditor();
          }}
          panelClassName="tool-editor-dialog admin-tool-editor-dialog"
          footer={
            <AdminDialogActions
              disabled={isSaving}
              formId="admin-tool-editor-form"
              primaryLabel={t.form.saveTool}
            />
          }
        >
          <form id="admin-tool-editor-form" className="tool-form" onSubmit={handleSave}>
            <AdminUrlField
              className="tool-url-field"
              id="admin-tool-url"
              inputAside={
                <AdminGitHubMetadataButton
                  disabled={toolGitHub.loading}
                  label={t.form.githubMetadata}
                  mobileLabel={locale === "zh" ? "仓库" : "Repo"}
                  onClick={() =>
                    void toolGitHub.load(form.url, {
                      force: true,
                      apply: true,
                      notify: true,
                      overwrite: true
                    })
                  }
                  onUnavailable={() => setStatus(t.form.githubMetadataUnavailable)}
                  unavailable={!canFillGitHubMetadata}
                  unavailableTitle={t.form.githubMetadataUnavailable}
                />
              }
              label={t.form.url}
              onChange={(nextUrl) => {
                if (nextUrl !== form.url) toolGitHub.reset(nextUrl);
                setForm((current) => ({ ...current, url: nextUrl }));
              }}
              placeholder={t.form.urlPlaceholder}
              required
              value={form.url}
            />

            <AdminTextField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: form.name,
                    description: form.description,
                    url: form.url,
                    demoUrl: form.demoUrl,
                    category: form.category,
                    tags: form.tags
                  }}
                  label={maintenanceText.aiGenerateName}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.name) {
                      setForm((current) => ({
                        ...current,
                        name: result.name ?? current.name
                      }));
                    }
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="tool_name"
                  token={token}
                />
              }
              label={t.form.name}
              onBlurValue={moveGitHubUrlFromName}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              onPaste={(event) => {
                  const pastedText = event.clipboardData.getData("text");

                  if (moveGitHubUrlFromName(pastedText)) {
                    event.preventDefault();
                  }
              }}
              placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminName}
              required
              value={form.name}
            />

            <AdminTextareaField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: form.name,
                    description: form.description,
                    url: form.url,
                    demoUrl: form.demoUrl,
                    category: form.category,
                    tags: form.tags
                  }}
                  label={maintenanceText.aiGenerateDescription}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.description) {
                      setForm((current) => ({
                        ...current,
                        description: result.description ?? current.description
                      }));
                    }
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="tool_description"
                  token={token}
                />
              }
              label={t.form.description}
              onChange={(description) =>
                setForm((current) => ({ ...current, description }))
              }
              placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminDescription}
              required
              rows={4}
              value={form.description}
            />

            <AdminUrlField
              label={t.form.demoUrl}
              onChange={(demoUrl) => setForm((current) => ({ ...current, demoUrl }))}
              placeholder={t.form.demoUrlPlaceholder}
              value={form.demoUrl}
            />

            <AdminTagsField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: form.name,
                    description: form.description,
                    url: form.url,
                    demoUrl: form.demoUrl,
                    category: form.category,
                    tags: form.tags
                  }}
                  label={maintenanceText.aiGenerateTags}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.tags) setToolTagText(formatTagInputText(result.tags));
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="tool_tags"
                  token={token}
                />
              }
              label={t.form.tags}
              onChange={setToolTagText}
              placeholder={ADMIN_RESOURCE_FIELD_EXAMPLES[locale].adminTags}
              value={toolTagText}
            />

            <AdminUrlField
              inputAside={
                <AdminImageUploadButton
                  disabled={isSaving}
                  label={t.form.imageUpload}
                  mobileLabel={locale === "zh" ? "上传" : "Upload"}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onUploaded={(image) => {
                    setForm((current) => ({ ...current, image }));
                    setStatus(t.form.imageUploadSuccess);
                  }}
                  token={token}
                />
              }
              label={t.form.image}
              onChange={(image) => setForm((current) => ({ ...current, image }))}
              placeholder={t.form.imagePlaceholder}
              value={form.image}
            />

            <div className="tool-form-field">
              <span className="tool-form-label">{t.form.category}</span>
              <div className="admin-resource-input-row admin-resource-category-row has-input-aside">
                <AdminCategoryFilter
                  {...categoryIconProps("tools")}
                  allowCreate
                  alignToTopOnOpen
                  categories={adminCategoryOptions}
                  categoryText={categoryText}
                  className="tool-form-category-filter"
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("tools", category)
                  }
                  onChange={(category) => {
                    setForm({ ...form, category });
                    void rememberAdminCategory("tools", category);
                  }}
                  t={t}
                  value={form.category}
                  scope="tools"
                />
                <BooleanSegmentedToggle
                  className="tool-featured-status-toggle field-assist-toggle"
                  disabledLabel={t.form.featuredTool}
                  enabledIcon={
                    <Star
                      fill={form.featured ? "currentColor" : "none"}
                      size={16}
                    />
                  }
                  enabledLabel={t.form.featuredTool}
                  mobileEnabledLabel={locale === "zh" ? "精选" : "Featured"}
                  onChange={(nextFeatured) => {
                    setForm((current) => ({ ...current, featured: nextFeatured }));
                    setStatus(
                      nextFeatured
                        ? t.status.featuredDraftEnabled
                        : t.status.featuredDraftDisabled
                    );
                  }}
                  singleOption
                  value={form.featured}
                />
              </div>
            </div>

            <AdminGitHubMetadataCard
              canLoad={canFillGitHubMetadata}
              detailText={githubMetadataDetailText}
              failed={toolGitHub.failed}
              loading={toolGitHub.loading}
              metadata={toolGitHub.metadata}
              previewLoading={toolGitHub.previewLoading}
            />
          </form>
        </Dialog>
      ) : null}

      {articleFormOpen ? (
        <Dialog
          closeRequestRef={articleEditorCloseRequestRef}
          closeDisabled={isArticleSaving}
          description={
            editingArticle ? articleText.editArticleDescription : articleText.addArticleDescription
          }
          descriptionId="article-editor-dialog-description"
          title={editingArticle ? articleText.editArticle : articleText.addArticle}
          closeLabel={t.actions.close}
          onClose={() => {
            closeArticleEditor();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog"
          footer={
            <AdminDialogActions
              disabled={isArticleSaving}
              formId="admin-article-editor-form"
              primaryLabel={articleText.saveArticle}
            />
          }
        >
          <EditorTopActions className="article-editor-top-actions">
            <PublishModeField
              draftLabel={articleText.draftLabel}
              label={articleText.publishModeLabel}
              publishedLabel={articleText.publishDirectLabel}
              value={articleForm.published ? "published" : "draft"}
              onChange={(mode) => {
                const published = mode === "published";
                setArticleForm((current) => ({ ...current, published }));
                onNotify({
                  message: published
                    ? articleText.publishDraftEnabled
                    : articleText.publishDraftDisabled,
                  tone: "info"
                });
              }}
            />
          </EditorTopActions>

          <form
            id="admin-article-editor-form"
            className="tool-form article-form"
            onSubmit={handleSaveArticle}
          >
            <AdminTextField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isArticleSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: articleForm.title,
                    summary: articleForm.summary,
                    content: articleForm.content,
                    category: articleForm.category,
                    tags: articleForm.tags
                  }}
                  label={maintenanceText.aiGenerateTitle}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.title) {
                      setArticleForm((current) => ({
                        ...current,
                        title: result.title ?? current.title
                      }));
                    }
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="article_title"
                  token={token}
                />
              }
              label={articleText.titleLabel}
              onChange={(title) =>
                setArticleForm((current) => ({ ...current, title }))
              }
              placeholder={articleText.titlePlaceholder}
              required
              value={articleForm.title}
            />

            <AdminTextareaField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isArticleSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: articleForm.title,
                    summary: articleForm.summary,
                    content: articleForm.content,
                    category: articleForm.category,
                    tags: articleForm.tags
                  }}
                  label={maintenanceText.aiGenerateSummary}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.summary) {
                      setArticleForm((current) => ({
                        ...current,
                        summary: result.summary ?? current.summary
                      }));
                    }
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="article_summary"
                  token={token}
                />
              }
              label={articleText.summaryLabel}
              onChange={(summary) =>
                setArticleForm((current) => ({ ...current, summary }))
              }
              placeholder={articleText.summaryPlaceholder}
              required
              rows={3}
              value={articleForm.summary}
            />

            <AdminTextField
              id="admin-article-slug"
              label={articleText.slugLabel}
              onBlurValue={(slug) =>
                setArticleForm((current) => ({
                  ...current,
                  slug: normalizeSlugInput(slug)
                }))
              }
              onChange={(slug) => setArticleForm((current) => ({ ...current, slug }))}
              placeholder={articleText.slugPlaceholder}
              value={articleForm.slug}
            />

            <AdminTagsField
              inputAside={
                <AdminAiAction
                  available={adminAiSettings.available}
                  disabled={isArticleSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  input={{
                    title: articleForm.title,
                    summary: articleForm.summary,
                    content: articleForm.content,
                    category: articleForm.category,
                    tags: articleForm.tags
                  }}
                  label={maintenanceText.aiGenerateTags}
                  locale={locale}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (result.tags) setArticleTagText(formatTagInputText(result.tags));
                    setStatus(getAiAppliedStatus(result));
                  }}
                  task="article_tags"
                  token={token}
                />
              }
              label={articleText.tagsLabel}
              onChange={setArticleTagText}
              placeholder={articleText.tagsPlaceholder}
              value={articleTagText}
            />

            <AdminUrlField
              inputAside={
                <AdminImageUploadButton
                  disabled={isArticleSaving}
                  label={t.form.imageUpload}
                  mobileLabel={locale === "zh" ? "上传" : "Upload"}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onUploaded={(coverImage) => {
                    setArticleForm((current) => ({ ...current, coverImage }));
                    setStatus(t.form.imageUploadSuccess);
                  }}
                  token={token}
                />
              }
              label={articleText.coverImageLabel}
              onChange={(coverImage) =>
                setArticleForm((current) => ({ ...current, coverImage }))
              }
              placeholder={articleText.coverImagePlaceholder}
              value={articleForm.coverImage}
            />

            <div className="tool-form-field">
              <span className="tool-form-label">{articleText.categoryLabel}</span>
              <small className="form-field-help">{articleText.categoryPlaceholder}</small>
              <AdminCategoryFilter
                {...categoryIconProps("articles")}
                alignToTopOnOpen
                categories={articleCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                disabled={isConvertingContentItem}
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("articles", category)
                }
                onChange={(category) => {
                  setArticleForm({
                    ...articleForm,
                    category
                  });
                  void rememberAdminCategory("articles", category);
                }}
                t={t}
                value={articleForm.category}
                scope="articles"
              />
            </div>

            <div className="tool-form-field">
              <div className="tool-form-field-head">
                <label htmlFor="admin-article-published-at">{articleText.publishTimeLabel}</label>
              </div>
              <small className="form-field-help">{articleText.publishTimeHelp}</small>
              <div className="admin-resource-input-row has-input-aside">
                <input
                  id="admin-article-published-at"
                  ref={articlePublishTimeRef}
                  type="datetime-local"
                  value={articleForm.publishedAt}
                  onChange={(event) =>
                    setArticleForm({
                      ...articleForm,
                      publishedAt: event.target.value
                    })
                  }
                />
                <AdminFieldAssistButton
                  icon={<CalendarDays size={16} />}
                  label={articleText.publishTimeAction}
                  mobileLabel={locale === "zh" ? "时间" : "Time"}
                  onClick={() => {
                    const input = articlePublishTimeRef.current;
                    if (!input) return;
                    if (typeof input.showPicker === "function") input.showPicker();
                    else input.focus();
                  }}
                />
              </div>
            </div>

            <AdminMarkdownEditor
              className="tool-form-field article-markdown-editor"
              disabled={isArticleSaving}
              modeAside={
                <AdminAiDocumentImport
                  available={adminAiSettings.available}
                  disabled={isArticleSaving}
                  disabledTitle={maintenanceText.aiEnableHint}
                  enabled={adminAiSettings.enabled}
                  label={maintenanceText.aiImportDocument}
                  loadingLabel={maintenanceText.aiImportingDocument}
                  mobileLabel={locale === "zh" ? "导入" : "Import"}
                  onError={(error) => setStatus(getLocalizedErrorMessage(error, t))}
                  onResult={(result) => {
                    if (articleForm.content.trim()) {
                      setPendingAiDocumentImport(result.markdown);
                      return;
                    }
                    setArticleForm((current) => ({
                      ...current,
                      content: result.markdown
                    }));
                    setStatus(maintenanceText.aiDocumentApplied);
                  }}
                  token={token}
                />
              }
              id="admin-article-content"
              label={articleText.contentLabel}
              locale={locale}
              onChange={(content) => setArticleForm({ ...articleForm, content })}
              placeholder={articleText.contentPlaceholder}
              proxySettings={proxySettings}
              required
              rows={12}
              text={t.markdownEditor}
              textareaClassName="article-content-input"
              value={articleForm.content}
            />
          </form>
        </Dialog>
      ) : null}

      {contentSourceFormOpen ? (
        <Dialog
          closeRequestRef={contentSourceEditorCloseRequestRef}
          closeDisabled={isContentSourceSaving}
          description={
            editingContentSource
              ? contentText.editSourceDescription
              : contentText.addSourceDescription
          }
          descriptionId="content-source-dialog-description"
          title={
            editingContentSource
              ? contentText.editSource
              : contentText.addSource
          }
          closeLabel={t.actions.close}
          onClose={() => {
            closeContentSourceEditor();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog content-source-dialog"
          footer={
            <AdminDialogActions
              disabled={isContentSourceSaving}
              formId="admin-content-source-form"
              primaryLabel={contentText.saveSource}
              leading={
              <button className="ghost-button" disabled={isContentPreviewing || isContentSourceSaving}
                type="button"
                onClick={() => void handlePreviewContentSource()}
              >
                {contentText.preview}
              </button>
              }
            />
          }
        >
          <EditorTopActions>
            <BooleanSegmentedToggle
              className="content-source-status-toggle"
              disabledLabel={contentText.disabledLabel}
              enabledLabel={contentText.enabledLabel}
              onChange={(nextEnabled) => {
                setContentSourceForm((current) => ({
                  ...current,
                  enabled: nextEnabled
                }));
                setStatus(
                  nextEnabled
                    ? contentText.enabledDraftEnabled
                    : contentText.enabledDraftDisabled
                );
              }}
              value={contentSourceForm.enabled}
            />
          </EditorTopActions>

          <form
            id="admin-content-source-form"
            className="tool-form article-form"
            onSubmit={handleSaveContentSource}
          >
            <label>
              {contentText.sourceUrlLabel}
              <input
                value={contentSourceForm.url}
                onChange={(event) => {
                  const nextUrl = event.target.value;
                  const shouldClearPreviewTitle =
                    nextUrl !== contentSourceForm.url &&
                    contentPreviewAppliedTitleRef.current &&
                    contentSourceForm.title.trim() ===
                      contentPreviewAppliedTitleRef.current.trim();
                  if (nextUrl !== contentSourceForm.url) {
                    invalidateContentPreview();
                  }
                  setContentSourceForm({
                    ...contentSourceForm,
                    url: nextUrl,
                    ...(shouldClearPreviewTitle ? { title: "" } : {})
                  });
                }}
                onBlur={() => {
                  const url = normalizeRssHubRouteUrl(contentSourceForm.url) ||
                    normalizeHttpUrlInput(contentSourceForm.url);
                  if (url !== contentSourceForm.url) invalidateContentPreview();
                  setContentSourceForm({ ...contentSourceForm, url });
                }}
                placeholder={contentText.sourceUrlPlaceholder}
                inputMode="url"
                required
              />
            </label>

            <label>
              {contentText.sourceTitleLabel}
              <input
                value={contentSourceForm.title}
                onChange={(event) => {
                  if (
                    event.target.value.trim() !==
                    contentPreviewAppliedTitleRef.current.trim()
                  ) {
                    contentPreviewAppliedTitleRef.current = "";
                  }
                  setContentSourceForm({
                    ...contentSourceForm,
                    title: event.target.value
                  });
                }}
                placeholder={contentText.sourceTitlePlaceholder}
              />
            </label>

            <div className="tool-form-field">
              <span className="tool-form-label">{contentText.categoryLabel}</span>
              <small className="form-field-help">{contentText.categoryPlaceholder}</small>
              <AdminCategoryFilter
                {...categoryIconProps("content")}
                alignToTopOnOpen
                categories={contentCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("content", category)
                }
                onChange={(category) => {
                  setContentSourceForm({
                    ...contentSourceForm,
                    category
                  });
                  void rememberAdminCategory("content", category);
                }}
                t={t}
                value={contentSourceForm.category}
                scope="content"
              />
            </div>

            <label>
              {contentText.tagsLabel}
              <input
                value={contentSourceTagText}
                onChange={(event) => setContentSourceTagText(event.target.value)}
                onBlur={(event) => setContentSourceTagText(normalizeTagInputText(event.currentTarget.value))}
                onPaste={(event) => {
                  const text = event.clipboardData.getData("text");

                  if (text.includes("\n") || /^\s*tags\s*:/i.test(text) || /#[^\s#]+/.test(text)) {
                    event.preventDefault();
                    setContentSourceTagText(normalizeTagInputText(text));
                  }
                }}
                placeholder={contentText.tagsPlaceholder}
              />
            </label>

            {contentPreview ? (
              <div className="content-source-preview" ref={contentPreviewRef}>
                <div>
                  <strong>{contentText.previewTitle}</strong>
                  <span>{contentPreview.title}</span>
                </div>
                {contentPreview.items.slice(0, 3).map((item) => (
                  <article key={item.externalId}>
                    <h3>{getArticleDisplayTitle(item)}</h3>
                    <p>{cleanArticleDisplayText(item.summary)}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </form>
        </Dialog>
      ) : null}

      {pendingConvertItem ? (
        <Dialog
          closeRequestRef={contentConvertCloseRequestRef}
          closeDisabled={isConvertingContentItem}
          description={
            pendingConvertItem.articleId
              ? contentText.updateArticleDescription
              : contentText.convertCategoryDescription
          }
          descriptionId="content-convert-dialog-description"
          title={
            pendingConvertItem.articleId
              ? contentText.updateArticleTitle
              : contentText.convertCategoryTitle
          }
          closeLabel={t.actions.close}
          onClose={() => {
            closeContentConvertDialog();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog content-convert-dialog"
          footer={
            <AdminDialogActions
              disabled={isConvertingContentItem}
              primaryLabel={
                pendingConvertItem.articleId
                  ? contentText.updateArticleAction
                  : contentText.convertCategoryAction
              }
              onPrimary={() =>
                void handleConvertContentItem(
                  pendingConvertItem,
                  convertArticleCategory,
                  convertPublishMode
                )
              }
            />
          }
        >
          <div className="tool-form article-form">
            <PublishModeField
              disabled={isConvertingContentItem}
              draftLabel={contentText.convertAsDraft}
              label={contentText.convertPublishLabel}
              publishedLabel={contentText.convertAsPublished}
              value={convertPublishMode}
              onChange={(mode) => {
                setConvertPublishMode(mode);
                onNotify({
                  message:
                    mode === "published"
                      ? contentText.convertPublishPublishedTip
                      : contentText.convertPublishDraftTip,
                  tone: "info"
                });
              }}
            />
            <div className="tool-form-field">
              <span className="tool-form-label">{articleText.categoryLabel}</span>
              <small className="form-field-help">{articleText.categoryPlaceholder}</small>
              <AdminCategoryFilter
                {...categoryIconProps("articles")}
                alignToTopOnOpen
                categories={articleCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("articles", category)
                }
                onChange={(category) => {
                  setConvertArticleCategory(category);
                  void rememberAdminCategory("articles", category);
                }}
                t={t}
                value={convertArticleCategory}
                scope="articles"
              />
            </div>
            <AdminMarkdownEditor
              className="tool-form-field article-markdown-editor content-convert-preview-field"
              id="content-convert-article-preview"
              label={contentText.convertPreviewTitle}
              locale={locale}
              onChange={() => undefined}
              preview={
                convertArticlePreviewLoading ? (
                  <ArticleBodySkeleton />
                ) : convertArticlePreview ? (
                  <MarkdownContent
                    content={convertArticlePreview.content}
                    locale={locale}
                    proxySettings={proxySettings}
                  />
                ) : (
                  <AdminDetailPlaceholder
                    icon={<FileText size={16} />}
                    role={convertArticlePreviewError ? "alert" : undefined}
                  >
                    {convertArticlePreviewError || contentText.convertPreviewUnavailable}
                  </AdminDetailPlaceholder>
                )
              }
              previewClassName="content-convert-preview"
              previewOnly
              proxySettings={proxySettings}
              rows={12}
              text={t.markdownEditor}
              textareaClassName="article-content-input"
              value={convertArticlePreview?.content ?? ""}
            />
          </div>
        </Dialog>
      ) : null}

      {pendingCategoryAction ? (
        <Dialog
          description={
            pendingCategoryAction.scope === "push"
              ? `${
                  pendingCategoryIsBulkClear
                    ? categoryText.clearDescriptionWithoutCount(
                        pendingCategoryPushScopeLabel
                      )
                    : categoryText.pushCategoryDescription
                } ${telegramText.management.deleteDescription}`
              : pendingCategoryAction.scope === "content"
              ? // 订阅内容单独一支:删分类会连订阅源一起删,所以两个数都要说出来;
                // 空工作区点"全部"时回退到不带数字的那句,详见 admin-text.ts 里的说明。
                getContentCategoryActionDescription(categoryText, {
                  isAll: pendingCategoryIsAll,
                  sourceCount: pendingCategoryAction.sourceCount,
                  itemCount: pendingCategoryAction.contentCount
                })
              : pendingCategoryIsAll
              ? categoryText.clearDescription(
                  categoryText.scopeLabel(pendingCategoryAction.scope),
                  pendingCategoryAction.contentCount
                )
              : categoryText.occupiedDescription(
                  pendingCategoryAction.contentCount
                )
          }
          descriptionId="category-action-dialog-description"
          title={
            pendingCategoryIsBulkClear
              ? categoryText.clearTitle(
                  pendingCategoryAction.scope === "push"
                    ? pendingCategoryPushScopeLabel
                    : categoryText.scopeLabel(pendingCategoryAction.scope)
                )
              : categoryText.manageTitle(
                  getCategoryLabel(pendingCategoryAction.category, t)
                )
          }
          closeLabel={t.actions.close}
          onClose={() => {
            if (!isApplyingCategoryAction) {
              setPendingCategoryAction(null);
              setCategoryActionTarget("");
            }
          }}
          panelClassName="tool-editor-dialog admin-action-dialog admin-category-action-dialog"
          footer={
            <>
              <button className="ghost-button" disabled={isApplyingCategoryAction}
                type="button"
                onClick={() => {
                  setPendingCategoryAction(null);
                  setCategoryActionTarget("");
                }}
              >
                {t.status.deleteCancel}
              </button>
              <button className={pendingCategoryIsBulkClear ? "primary-button" : "ghost-button"}
                disabled={isApplyingCategoryAction}
                type="button"
                onClick={() =>
                  void applyCategoryAction(
                    pendingCategoryAction.scope,
                    pendingCategoryAction.category,
                    "delete",
                    ""
                  )
                }
              >
                {pendingCategoryIsBulkClear
                  ? categoryText.clearAllAction
                  : categoryText.deleteWithContentAction}
              </button>
              {pendingCategoryIsBulkClear ? null : (
                <button className="primary-button" disabled={isApplyingCategoryAction}
                  type="button"
                  onClick={() =>
                    void applyCategoryAction(
                      pendingCategoryAction.scope,
                      pendingCategoryAction.category,
                      "migrate",
                      categoryActionTarget
                    )
                  }
                >
                  {categoryText.migrateAction}
                </button>
              )}
            </>
          }
        >
          <div className="admin-category-action-body">
            {pendingCategoryIsBulkClear ? null : (
              <div className="admin-category-action-field">
                <div className="admin-category-action-copy">
                  <span className="admin-category-action-label">
                    {categoryText.migrateToLabel}
                  </span>
                  <small className="admin-category-action-help">
                    {categoryText.migrateHelp}
                  </small>
                </div>
                <AdminCategoryFilter
                  {...categoryIconProps(pendingCategoryAction.scope)}
                  categories={getCategoryActionOptions(
                    pendingCategoryAction.scope,
                    pendingCategoryAction.category
                  )}
                  categoryText={categoryText}
                  className="admin-category-action-filter"
                  disabled={isApplyingCategoryAction}
                  onChange={setCategoryActionTarget}
                  scope={pendingCategoryAction.scope}
                  t={t}
                  value={categoryActionTarget}
                />
              </div>
            )}
          </div>
        </Dialog>
      ) : null}

      {pendingFeaturedTool ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="toggle-featured-dialog-description"
          description={t.status.featuredConfirmDescription(!pendingFeaturedTool.featured)}
          title={t.status.featuredConfirmTitle(!pendingFeaturedTool.featured)}
          onCancel={() => setPendingFeaturedTool(null)}
          onConfirm={() => {
            const tool = pendingFeaturedTool;
            setPendingFeaturedTool(null);
            void handleToggleFeatured(tool);
          }}
        />
      ) : null}

      {pendingPublishedArticle ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="toggle-published-dialog-description"
          description={t.status.publishedConfirmDescription(!pendingPublishedArticle.published)}
          title={t.status.publishedConfirmTitle(!pendingPublishedArticle.published)}
          onCancel={() => setPendingPublishedArticle(null)}
          onConfirm={() => {
            const article = pendingPublishedArticle;
            setPendingPublishedArticle(null);
            void handleToggleArticlePublished(article);
          }}
        />
      ) : null}

      {pendingDeleteTool ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-tool-dialog-description"
          description={t.status.deleteConfirmDescription}
          title={t.status.deleteConfirmTitle}
          disabled={isDeletingTool}
          onCancel={() => {
            if (!isDeletingTool) {
              setPendingDeleteTool(null);
            }
          }}
          onConfirm={() => void handleDelete(pendingDeleteTool)}
        />
      ) : null}

      {pendingPushTelegramRecord || pendingTelegramUncertainRetry ? (
        <AdminConfirmDialog
          cancelLabel={pendingTelegramUncertainRetry
            ? telegramText.uncertainRetryCancel
            : t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={pendingTelegramUncertainRetry
            ? telegramText.uncertainRetryAction
            : t.actions.confirm}
          descriptionId="push-telegram-record-dialog-description"
          description={telegramPushConfirmDescription}
          disabled={isTelegramPushConfirmBusy}
          onCancel={() => {
            if (isTelegramPushConfirmBusy) return;
            setPendingTelegramUncertainRetry(null);
            setPendingPushTelegramRecord(null);
          }}
          onConfirm={pendingTelegramUncertainRetry
            ? confirmTelegramUncertainRetry
            : () => void confirmPushTelegramRecord()}
          title={pendingTelegramUncertainRetry
            ? telegramText.uncertainRetryTitle
            : telegramText.management.pushConfirmTitle}
        />
      ) : null}

      {pendingAiDocumentImport ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          description={maintenanceText.aiDocumentReplaceDescription}
          descriptionId="replace-article-document-dialog-description"
          onCancel={() => setPendingAiDocumentImport(null)}
          onConfirm={() => {
            const markdown = pendingAiDocumentImport;
            setPendingAiDocumentImport(null);
            setArticleForm((current) => ({ ...current, content: markdown }));
            setStatus(maintenanceText.aiDocumentApplied);
          }}
          title={maintenanceText.aiDocumentReplaceTitle}
        />
      ) : null}

      {pendingTelegramResend ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={telegramText.resendAction}
          descriptionId="telegram-resend-dialog-description"
          description={
            pendingTelegramResend === "deleted"
              ? telegramText.resendDeletedDescription
              : telegramText.resendTargetChangedDescription
          }
          disabled={telegramMessageSaving}
          onCancel={() => {
            setPendingTelegramResend(null);
            setStatus(telegramText.resendSkipped);
          }}
          onConfirm={() => {
            setPendingTelegramResend(null);
            void submitTelegramMessage();
          }}
          title={
            pendingTelegramResend === "deleted"
              ? telegramText.resendDeletedTitle
              : telegramText.resendTargetChangedTitle
          }
        />
      ) : null}

      {pendingTelegramSourceSync ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          description={telegramText.syncSourceConfirmDescription}
          descriptionId="telegram-sync-source-dialog-description"
          disabled={telegramSourceLoading}
          onCancel={() => {
            if (!telegramSourceLoading) setPendingTelegramSourceSync(false);
          }}
          onConfirm={() => {
            setPendingTelegramSourceSync(false);
            void refreshTelegramSource();
          }}
          title={telegramText.syncSourceConfirmTitle}
        />
      ) : null}

      {pendingDeleteTelegramPush ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-telegram-push-dialog-description"
          description={telegramText.management.deleteDescription}
          disabled={isDeletingTelegramPush}
          onCancel={() => {
            if (!isDeletingTelegramPush) setPendingDeleteTelegramPush(null);
          }}
          onConfirm={() => void handleDeleteTelegramPush(pendingDeleteTelegramPush)}
          title={telegramText.management.deleteTitle}
        />
      ) : null}

      {pendingDeleteArticle ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-article-dialog-description"
          description={articleText.deleteConfirmDescription}
          title={articleText.deleteConfirmTitle}
          disabled={isDeletingArticle}
          onCancel={() => {
            if (!isDeletingArticle) {
              setPendingDeleteArticle(null);
            }
          }}
          onConfirm={() => void handleDeleteArticle(pendingDeleteArticle)}
        />
      ) : null}

      {pendingDeleteContentSource ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-content-source-dialog-description"
          description={contentText.deleteConfirmDescription}
          title={contentText.deleteConfirmTitle}
          disabled={isDeletingContentSource}
          onCancel={() => {
            if (!isDeletingContentSource) {
              setPendingDeleteContentSource(null);
            }
          }}
          onConfirm={() =>
            void handleDeleteContentSource(pendingDeleteContentSource)
          }
        />
      ) : null}

      {editingCategoryIcon ? (
        <AdminCategoryIconDialog
          category={editingCategoryIcon.category}
          error={categoryIconError}
          icon={adminCategoryIcons[editingCategoryIcon.scope][editingCategoryIcon.category]}
          key={`${editingCategoryIcon.scope}:${editingCategoryIcon.category}`}
          onClose={() => {
            if (!categoryIconSaveRef.current) setEditingCategoryIcon(null);
          }}
          onSave={(icon) => { void submitCategoryIcon(icon); }}
          saving={categoryIconSaving}
          t={t}
        />
      ) : null}
    </div>
  );
}

function AdminContentFlowPanel({
  categoryIcons,
  clearFiltersLabel,
  contentSourceCounts,
  categoryOrder,
  contentCategoryFilter,
  contentSourceFilter,
  contentSources,
  contentText,
  contentCategoryItemCount,
  hasActiveFilter,
  hasAnyContentSources,
  hasLoadedContent,
  hasMoreContent,
  isLoadingContent,
  isLoadingMoreContent,
  locale,
  loadError,
  onAddSource,
  onConvertItem,
  onDeleteSource,
  onEditSource,
  onLoadMore,
  onRetry,
  onClearFilters,
  onSelectScope,
  onSyncSources,
  onTelegram,
  proxySettings,
  readerEnabled,
  showSkeletons,
  t,
  telegramEnabled,
  telegramText,
  token,
  visibleContentItems,
  writeLockedEntityKeys
}: {
  categoryIcons: CategoryIconSettings["content"];
  clearFiltersLabel: string;
  contentSourceCounts: Record<string, number>;
  categoryOrder: string[];
  contentCategoryFilter: string;
  contentSourceFilter: string;
  contentSources: ContentSource[];
  contentText: ReturnType<typeof getContentFlowText>;
  contentCategoryItemCount: number;
  hasActiveFilter: boolean;
  hasAnyContentSources: boolean;
  hasLoadedContent: boolean;
  hasMoreContent: boolean;
  isLoadingContent: boolean;
  isLoadingMoreContent: boolean;
  locale: Locale;
  loadError: string | null;
  onAddSource: () => void;
  onConvertItem: (item: ContentItemSummary) => void;
  onDeleteSource: (source: ContentSource) => void;
  onEditSource: (source: ContentSource) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onSelectScope: (scope: { category: string; sourceId: string }) => void;
  onSyncSources: (sources: ContentSource[]) => void;
  onTelegram: (item: ContentItemSummary) => void;
  proxySettings: ProxySettings;
  readerEnabled: boolean;
  showSkeletons: boolean;
  t: Messages;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
  token: string;
  visibleContentItems: ContentItemSummary[];
  writeLockedEntityKeys: Set<string>;
}) {
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, ContentSource[]>();
    for (const source of contentSources) {
      const category = normalizeAdminCategoryValue(source.category);
      const entries = groups.get(category) ?? [];
      entries.push(source);
      groups.set(category, entries);
    }
    const orderMap = new Map(
      categoryOrder.map((category, index) => [normalizeAdminCategoryValue(category), index])
    );
    return Array.from(groups.entries())
      .map(([category, sources]) => ({
        category,
        label: category || contentText.uncategorized,
        sources
      }))
      .sort((left, right) => {
        const leftIndex = orderMap.get(left.category);
        const rightIndex = orderMap.get(right.category);
        if (leftIndex !== undefined || rightIndex !== undefined) {
          if (leftIndex === undefined) return 1;
          if (rightIndex === undefined) return -1;
          return leftIndex - rightIndex;
        }
        return left.label.localeCompare(right.label, "zh-Hans-CN");
      });
  }, [categoryOrder, contentSources, contentText.uncategorized]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);
  const [selectedContentItemId, setSelectedContentItemId] = useState("");
  const [browsingContentItemId, setBrowsingContentItemId] = useState("");
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const [readerError, setReaderError] = useState("");
  const [readerLoading, setReaderLoading] = useState(false);
  const readerRequestRef = useRef(0);
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  const selectedContentItem =
    visibleContentItems.find((item) => item.id === selectedContentItemId) ?? null;
  const browsingContentItem =
    visibleContentItems.find((item) => item.id === browsingContentItemId) ?? null;
  const readerItem = readerEnabled ? selectedContentItem : browsingContentItem;
  const selectedSource = contentSources.find(
    (source) => source.id === contentSourceFilter
  ) ?? null;
  const scopeSources = useMemo(() => {
    if (selectedSource) return [selectedSource];
    if (isAllCategoryValue(contentCategoryFilter)) return contentSources;
    const normalized = normalizeAdminCategoryValue(contentCategoryFilter);
    return contentSources.filter(
      (source) => normalizeAdminCategoryValue(source.category) === normalized
    );
  }, [contentCategoryFilter, contentSources, selectedSource]);
  const sourceActions = useAdminCardActionMenu(
    selectedSource ? `content-source-header:${selectedSource.id}` : "content-source-header:all"
  );
  useEffect(() => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (selectedSource) {
        next.add(normalizeAdminCategoryValue(selectedSource.category));
      }
      for (const category of next) {
        if (!categoryGroups.some((group) => group.category === category)) {
          next.delete(category);
        }
      }
      return next;
    });
  }, [categoryGroups, selectedSource?.category]);

  useEffect(() => {
    const requestId = readerRequestRef.current + 1;
    readerRequestRef.current = requestId;

    if (!readerItem) {
      setReaderArticle(null);
      setReaderError("");
      setReaderLoading(false);
      return;
    }

    setReaderArticle(null);
    setReaderError("");
    setReaderLoading(true);

    const request = readerItem.articleId
      ? loadAdminArticle(readerItem.articleId, token)
      : loadContentItemArticlePreview(readerItem.id, token);

    void request
      .then((article) => {
        if (readerRequestRef.current === requestId) {
          setReaderArticle(article);
        }
      })
      .catch((error) => {
        if (readerRequestRef.current === requestId) {
          setReaderError(getLocalizedErrorMessage(error, t));
        }
      })
      .finally(() => {
        if (readerRequestRef.current === requestId) {
          setReaderLoading(false);
        }
      });
  }, [
    readerItem?.articleId,
    readerItem?.id,
    readerItem?.updated_at,
    t,
    token
  ]);

  const [readerTitlePinned, setReaderTitlePinned] = useState(false);

  useEffect(() => {
    const container = readerScrollRef.current;

    if (!readerEnabled || !container || !readerArticle) {
      setReaderTitlePinned(false);
      return;
    }

    const update = () => {
      const heading = container.querySelector(".article-detail-head h1");
      setReaderTitlePinned(
        Boolean(heading) &&
          Boolean(container.clientHeight) &&
          heading!.getBoundingClientRect().bottom <=
            container.getBoundingClientRect().top
      );
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [readerArticle, readerEnabled]);

  if (isLoadingContent && !hasLoadedContent) {
    return (
      <SkeletonVisibility visible={showSkeletons}>
        <ContentFlowSkeleton contentText={contentText} />
      </SkeletonVisibility>
    );
  }

  if (loadError) {
    return <AdminInitialLoadError isRetrying={isLoadingContent} message={loadError} onRetry={onRetry} t={t} />;
  }

  const readerBody = readerLoading ? (
    <ArticleDetailContentSkeleton />
  ) : readerArticle ? (
    <ArticleDetailContent
      article={readerArticle}
      locale={locale}
      proxySettings={proxySettings}
    />
  ) : (
    <AdminDetailPlaceholder
      icon={<FileText size={16} />}
      role={readerError ? "alert" : undefined}
    >
      {readerError || contentText.convertPreviewUnavailable}
    </AdminDetailPlaceholder>
  );

  return (
    <section className="content-flow-layout" aria-label={contentText.title}>
      <aside className="content-flow-rail">
        <div className="content-flow-section-head">
          <h2>{contentText.title}</h2>
        </div>

        <div className="content-source-list">
          <button
            className={`content-source-group content-source-all ${
              contentSourceFilter === "all" && isAllCategoryValue(contentCategoryFilter)
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={() => onSelectScope({ category: "All", sourceId: "all" })}
          >
            <span className="content-source-group-chevron" aria-hidden="true" />
            <span className="content-source-group-copy"><strong>{contentText.allSources}</strong><small>{contentSources.length}</small></span>
          </button>
          {categoryGroups.map(({ category, label, sources }) => {
            const expanded = expandedCategories.has(category);
            return (
              <div className="content-source-group-wrap" key={category || "uncategorized"}>
                <div
                  className={`content-source-group ${
                    contentSourceFilter === "all" &&
                    normalizeAdminCategoryValue(contentCategoryFilter) === category
                      ? "is-active"
                      : ""
                  }`}
                >
                  <button
                    aria-expanded={expanded}
                    aria-label={`${label} ${expanded ? contentText.collapseCategory : contentText.expandCategory}`}
                    className="content-source-group-toggle"
                    type="button"
                    onClick={() => toggleCategory(category)}
                  >
                    {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <button
                    className="content-source-group-main"
                    title={contentText.categoryToggleHint}
                    type="button"
                    onClick={() => onSelectScope({ category, sourceId: "all" })}
                    onDoubleClick={() => toggleCategory(category)}
                  >
                    <CategoryIcon category={category} icon={categoryIcons[category]} size={16} />
                    <span className="content-source-group-copy"><strong>{label}</strong><small>{sources.length}</small></span>
                  </button>
                </div>
                {expanded ? (
                  <div className="content-source-group-items">
                    {sources.map((source) => (
                      <ContentSourceButton
                        count={contentSourceCounts[source.id] ?? 0}
                        isSelected={contentSourceFilter === source.id}
                        key={source.id}
                        onSelect={() => onSelectScope({ category: "All", sourceId: source.id })}
                        proxySettings={proxySettings}
                        source={source}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="content-flow-main">
        <div className="content-source-toolbar">
          <div className="content-source-toolbar-title">
            {selectedSource ? (
              <ContentSourceIcon proxySettings={proxySettings} source={selectedSource} />
            ) : null}
            <strong>
              {selectedSource?.title ??
                (isAllCategoryValue(contentCategoryFilter)
                  ? contentText.allSubscriptions
                  : normalizeAdminCategoryValue(contentCategoryFilter) ||
                    contentText.uncategorized)}
            </strong>
          </div>
          {selectedSource ? (
            <div className="content-source-toolbar-actions" ref={sourceActions.rootRef}>
              <button className="icon-button" disabled={writeLockedEntityKeys.has(getAdminWriteEntityKey("content-source", selectedSource.id))} type="button" title={contentText.syncSource} onClick={() => onSyncSources([selectedSource])}><RefreshCw size={15} /></button>
              <AdminCardActionMenu
                actions={sourceActions}
                label={t.actions.menu(selectedSource.title)}
                items={[
                  {
                    key: "edit",
                    label: contentText.editSource,
                    shortLabel: t.admin.editAction,
                    icon: <SquarePen size={18} />,
                    onSelect: () => onEditSource(selectedSource)
                  },
                  {
                    key: "delete",
                    label: contentText.deleteSource,
                    shortLabel: t.admin.deleteAction,
                    icon: <Trash2 size={16} />,
                    danger: true,
                    onSelect: () => onDeleteSource(selectedSource)
                  }
                ]}
              />
            </div>
          ) : scopeSources.length ? (
            <div className="content-source-toolbar-actions">
              <button
                className="icon-button"
                disabled={scopeSources.some((source) =>
                  writeLockedEntityKeys.has(
                    getAdminWriteEntityKey("content-source", source.id)
                  )
                )}
                title={contentText.syncCategory}
                type="button"
                onClick={() => onSyncSources(scopeSources)}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="content-flow-main-scroll">
          {contentSources.length === 0 ? (
            <AdminEmptyState
              action={
                hasAnyContentSources
                  ? {
                      label: clearFiltersLabel,
                      onClick: onClearFilters,
                      tone: "ghost"
                    }
                  : { label: contentText.addContent, onClick: onAddSource }
              }
              className="content-flow-empty"
              description={
                hasAnyContentSources
                  ? contentText.noMatchDescription
                  : contentText.sourceEmptyDescription
              }
              title={
                hasAnyContentSources ? contentText.noMatchTitle : contentText.sourceEmptyTitle
              }
            />
          ) : (
            <>
              {visibleContentItems.length ? (
                <div className="content-item-list">
                  {visibleContentItems.map((item) => (
                    <ContentItemCard
                      isBusy={writeLockedEntityKeys.has(
                        getAdminWriteEntityKey("content-item", item.id)
                      )}
                      isSelected={readerEnabled && selectedContentItem?.id === item.id}
                      item={item}
                      key={item.id}
                      onSelect={() => {
                        if (readerEnabled) {
                          setSelectedContentItemId(item.id);
                          return;
                        }
                        setBrowsingContentItemId(item.id);
                      }}
                      proxySettings={proxySettings}
                      showSourceIcon={!selectedSource}
                      source={contentSources.find((source) => source.id === item.sourceId) ?? null}
                      mobileActions={
                        <ContentItemActions
                          className="admin-tool-card-actions"
                          contentText={contentText}
                          isBusy={writeLockedEntityKeys.has(
                            getAdminWriteEntityKey("content-item", item.id)
                          )}
                          item={item}
                          menuKey={`content-item-mobile:${item.id}`}
                          onConvert={() => onConvertItem(item)}
                          onTelegram={() => onTelegram(item)}
                          proxySettings={proxySettings}
                          t={t}
                          telegramEnabled={telegramEnabled}
                          telegramText={telegramText}
                        />
                      }
                    />
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  action={
                    hasActiveFilter
                      ? {
                          label: clearFiltersLabel,
                          onClick: onClearFilters,
                          tone: "ghost"
                        }
                      : undefined
                  }
                  className="content-flow-empty"
                  description={
                    !hasActiveFilter && contentCategoryItemCount === 0
                      ? // 左栏标题块改成 52px 通栏之后,"这个栏目是干什么的"那句说明搬到了这里:
                        // 先说是什么(contentText.description),再说怎么做(itemEmptyDescription)。
                        // 公共 AdminEmptyState 不动、也不给它加属性 —— 它被四个栏目共用,
                        // 这里只是把两句拼成它本来就接受的那一个字符串。
                        `${contentText.description} ${contentText.itemEmptyDescription}`
                      : contentText.noMatchDescription
                  }
                  title={
                    !hasActiveFilter && contentCategoryItemCount === 0
                      ? contentText.itemEmptyTitle
                      : contentText.noMatchTitle
                  }
                />
              )}
              {hasMoreContent ? (
                <div className="content-flow-load-more">
                  <button className="ghost-button" disabled={isLoadingMoreContent}
                    type="button"
                    onClick={onLoadMore}
                  >
                    {contentText.loadMore}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <aside className="content-flow-reader" aria-live="polite">
        <div className="content-reader-toolbar">
          <strong
            className={`content-reader-title ${readerTitlePinned ? "is-visible" : ""}`}
          >
            {selectedContentItem ? getArticleDisplayTitle(selectedContentItem) : ""}
          </strong>
          {selectedContentItem ? (
            <ContentItemActions
              contentText={contentText}
              isBusy={writeLockedEntityKeys.has(
                getAdminWriteEntityKey("content-item", selectedContentItem.id)
              )}
              item={selectedContentItem}
              menuKey={`content-reader:${selectedContentItem.id}`}
              onConvert={() => onConvertItem(selectedContentItem)}
              onTelegram={() => onTelegram(selectedContentItem)}
              proxySettings={proxySettings}
              t={t}
              telegramEnabled={telegramEnabled}
              telegramText={telegramText}
            />
          ) : null}
        </div>
        <div className="content-flow-reader-scroll" ref={readerScrollRef}>
          {selectedContentItem ? (
            readerBody
          ) : (
            <AdminDetailPlaceholder icon={<FileText size={16} />}>
              {contentText.itemEmptyTitle}
            </AdminDetailPlaceholder>
          )}
        </div>
      </aside>

      {browsingContentItem ? (
        <Dialog
          closeLabel={t.actions.close}
          onClose={() => setBrowsingContentItemId("")}
          panelClassName="tool-editor-dialog content-browse-dialog"
          title={getArticleDisplayTitle(browsingContentItem)}
        >
          <div className="content-browse-dialog-body">{readerBody}</div>
        </Dialog>
      ) : null}
    </section>
  );
}

function ContentSourceButton({
  count,
  isSelected,
  onSelect,
  proxySettings,
  source
}: {
  count: number;
  isSelected: boolean;
  onSelect: () => void;
  proxySettings: ProxySettings;
  source: ContentSource;
}) {
  return (
    <div className={`content-source-item ${isSelected ? "is-active" : ""}`}>
      <button className="content-source-main" type="button" onClick={() => {
        onSelect();
      }}>
        <ContentSourceIcon proxySettings={proxySettings} source={source} />
        <span className="content-source-copy">
          <strong>{source.title}</strong>
          <small>{count}</small>
        </span>
      </button>
    </div>
  );
}

function ContentSourceIcon({
  proxySettings,
  source
}: {
  proxySettings: ProxySettings;
  source: ContentSource;
}) {
  return (
    <AdminSiteIcon
      className="content-source-icon"
      proxySettings={proxySettings}
      url={source.siteUrl || source.url}
    />
  );
}

function ContentItemCard({
  isBusy,
  isSelected,
  item,
  mobileActions,
  onSelect,
  proxySettings,
  showSourceIcon,
  source
}: {
  isBusy: boolean;
  isSelected: boolean;
  item: ContentItemSummary;
  mobileActions: ReactNode;
  onSelect: () => void;
  proxySettings: ProxySettings;
  showSourceIcon: boolean;
  source: ContentSource | null;
}) {
  const displayDate = formatAdminDate(item.published_at ?? item.updated_at);
  const displayTitle = getArticleDisplayTitle(item);

  return (
    <article className={`content-item-card ${showSourceIcon ? "has-source-icon" : ""} ${isSelected ? "is-active" : ""}`}>
      {showSourceIcon && source ? (
        <ContentSourceIcon proxySettings={proxySettings} source={source} />
      ) : null}
      <button
        aria-pressed={isSelected}
        className="content-item-select"
        disabled={isBusy}
        type="button"
        onClick={onSelect}
      >
        <span className="content-item-title-row">
          <strong>{displayTitle}</strong>
          {displayDate ? <time>{displayDate}</time> : null}
        </span>
        <span className="content-item-summary">
          {cleanArticleDisplayText(item.summary)}
        </span>
      </button>
      <div className="content-item-mobile-actions">{mobileActions}</div>
    </article>
  );
}

function ContentItemActions({
  className = "content-reader-actions",
  contentText,
  isBusy,
  item,
  menuKey,
  onConvert,
  onTelegram,
  proxySettings,
  t,
  telegramEnabled,
  telegramText
}: {
  className?: string;
  contentText: ReturnType<typeof getContentFlowText>;
  isBusy: boolean;
  item: ContentItemSummary;
  menuKey: string;
  onConvert: () => void;
  onTelegram: () => void;
  proxySettings: ProxySettings;
  t: Messages;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
}) {
  const actions = useAdminCardActionMenu(menuKey);
  const displayTitle = getArticleDisplayTitle(item);
  const originalHref = proxifyUrl(item.url, proxySettings);

  return (
    <div className={className} ref={actions.rootRef}>
      {telegramEnabled ? (
        <AdminTelegramPushButton
          disabled={isBusy}
          label={`${telegramText.action}: ${displayTitle}`}
          onClick={() => {
            actions.close();
            onTelegram();
          }}
        />
      ) : null}
      <button
        aria-label={`${item.articleId ? contentText.updateArticle : contentText.convert}: ${displayTitle}`}
        aria-pressed={Boolean(item.articleId)}
        className={`icon-button admin-article-publish-button ${item.articleId ? "is-active" : ""}`}
        disabled={isBusy}
        title={item.articleId ? contentText.updateArticle : contentText.convert}
        type="button"
        onClick={() => {
          actions.close();
          onConvert();
        }}
      >
        {item.articleId ? <CheckCircle2 size={16} /> : <FileText size={16} />}
      </button>
      <AdminCardActionMenu
        actions={actions}
        label={t.actions.menu(displayTitle)}
        triggerDisabled={isBusy}
        items={[
          {
            key: "original",
            label: contentText.openOriginal,
            shortLabel: contentText.openOriginalShort,
            icon: <ArrowUpRight size={16} />,
            onSelect: () => window.open(originalHref, "_blank", "noopener,noreferrer")
          }
        ]}
      />
    </div>
  );
}

type AdminCategoryText = ReturnType<typeof getAdminWorkspaceText>["category"];

function getAdminCategoryDeleteLabel(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string,
  resolvedLabel?: string
) {
  if (isAllCategoryValue(category)) {
    return categoryText.clearAllAction;
  }

  if (isTelegramPushSourceFilter(category)) {
    return categoryText.clearTitle(
      categoryText.pushSourceScopeLabel(resolvedLabel ?? getCategoryLabel(category, t))
    );
  }

  const label = resolvedLabel ?? getCategoryLabel(category, t);
  return categoryText.deleteLabel(label);
}

function getAdminCategoryMoveLabel(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string
) {
  const label = getCategoryLabel(category, t);
  return categoryText.moveLabel(label);
}

function getAdminCategoryDeletedText(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string,
  scope: AdminCategoryScope
) {
  if (isAllCategoryValue(category)) {
    return categoryText.cleared(categoryText.scopeLabel(scope));
  }

  if (scope === "tools" && isFeaturedCategoryValue(category)) {
    return categoryText.featuredCleared;
  }

  const label = getCategoryLabel(category, t);
  return categoryText.removed(label, categoryText.scopeLabel(scope));
}

function getAdminCategoryMigratedText(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string,
  targetCategory: string,
  affected: number
) {
  const label = getCategoryLabel(category, t);
  const targetLabel = getCategoryLabel(targetCategory, t);
  return categoryText.migrated(label, targetLabel, affected);
}

function AdminCategoryFilter({
  allowCreate = true,
  alignToTopOnOpen = false,
  allLabel,
  categories,
  categoryIcons,
  categoryText,
  className = "",
  deletableFixedCategories = [],
  disabled = false,
  emptyOptionLabel,
  fixedCategories = [],
  labelFor,
  onChange,
  onDeleteCategory,
  onEditIcon,
  onMoveCategory,
  scope,
  t,
  value
}: {
  allowCreate?: boolean;
  alignToTopOnOpen?: boolean;
  allLabel?: string;
  categories: string[];
  categoryIcons: Record<string, CategoryIconValue>;
  categoryText: AdminCategoryText;
  className?: string;
  deletableFixedCategories?: string[];
  disabled?: boolean;
  /** 启用一个保存值为空的固定选项，同时用该名称回显空值。 */
  emptyOptionLabel?: string;
  fixedCategories?: string[];
  labelFor?: (category: string) => string;
  onChange: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
  onEditIcon: (category: string) => void;
  onMoveCategory?: (category: string) => void;
  /**
   * Which category list this control edits. Editors pass it so the empty state reads
   * "选择或新建工具分类" instead of implying a selection; filters omit it and use allLabel.
   */
  scope?: AdminCategoryScope;
  t: Messages;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusTargetRef = useRef<"first" | "last" | null>(null);
  const directTouchFocusUntilRef = useRef(0);
  const emptyText = categoryText.empty;
  const normalizedFixedCategories = useMemo(
    () => new Set(fixedCategories.map(normalizeAdminCategoryValue)),
    [fixedCategories]
  );
  const normalizedDeletableFixedCategories = useMemo(
    () => new Set(deletableFixedCategories.map(normalizeAdminCategoryValue)),
    [deletableFixedCategories]
  );
  const resolveLabel = useCallback(
    (category: string) => !category && emptyOptionLabel
      ? emptyOptionLabel
      : labelFor?.(category) ?? getCategoryLabel(category, t),
    [emptyOptionLabel, labelFor, t]
  );
  const normalizedCategories = useMemo(
    () => Array.from(new Set([
      ...(emptyOptionLabel ? [""] : []),
      ...categories.map(normalizeAdminCategoryValue)
    ])),
    [categories, emptyOptionLabel]
  );
  const normalizedValue = normalizeAdminCategoryValue(value);
  // ponytail: a lookup table instead of nested ternaries, so adding a fifth
  // AdminCategoryScope member is a type error here rather than a silent fall
  // through to the push label.
  const scopeCategoryLabels: Record<AdminCategoryScope, string> = {
    tools: categoryText.toolLabel,
    articles: categoryText.articleLabel,
    content: categoryText.contentLabel,
    push: categoryText.pushLabel
  };
  const scopeCategoryLabel = scope ? scopeCategoryLabels[scope] : "";
  const resolvedEmptyLabel = emptyOptionLabel ?? (scopeCategoryLabel
    ? categoryText.selectOrCreateLabel(scopeCategoryLabel)
    : getCategoryLabel("All", t));
  const selectedLabel = normalizedValue
    ? isAllCategoryValue(normalizedValue) && allLabel
      ? allLabel
      : resolveLabel(normalizedValue)
    : resolvedEmptyLabel;
  const displaySelectedLabel = !normalizedValue && emptyOptionLabel
    ? selectedLabel
    : getAdminCategoryDisplayLabel(selectedLabel);
  const createCategoryName = query.trim();
  const isFilteringCategories = Boolean(query.trim());
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return normalizedCategories;
    }

    return normalizedCategories.filter((category) => {
      const label = resolveLabel(category);

      return `${category} ${label}`.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedCategories, query, resolveLabel]);
  const canCreateCategory = useMemo(() => {
    const normalizedName = createCategoryName.toLowerCase();

    if (
      !allowCreate ||
      !normalizedName ||
      isAllCategoryValue(createCategoryName) ||
      isFeaturedCategoryValue(createCategoryName)
    ) {
      return false;
    }

    return !normalizedCategories.some((category) => {
      const label = resolveLabel(category).toLowerCase();

      return (
        normalizeAdminCategoryValue(category).toLowerCase() === normalizedName ||
        label === normalizedName
      );
    });
  }, [allowCreate, normalizedCategories, createCategoryName, resolveLabel]);
  const categoryWidthChars = useMemo(() => {
    const widthLabel = allLabel ?? resolvedEmptyLabel;
    return Math.max(
      getAdminCategoryLabelWidth(categoryText.topLabel),
      getAdminCategoryLabelWidth(widthLabel)
    );
  }, [allLabel, categoryText.topLabel, resolvedEmptyLabel]);
  const categoryFilterStyle = {
    "--admin-category-filter-text-width": `${categoryWidthChars}em`
  } as CSSProperties;

  function getCategoryOptionButtons() {
    return Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-admin-category-option="true"]:not(:disabled)'
      ) ?? []
    );
  }

  function closeCategoryFilter(restoreFocus = false) {
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  function focusCategoryOption(target: "first" | "last") {
    const options = getCategoryOptionButtons();
    options[target === "first" ? 0 : options.length - 1]?.focus();
  }

  function handleCategoryOptionKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>
  ) {
    if (!open) {
      return;
    }

    const options = getCategoryOptionButtons();
    const currentIndex = options.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeCategoryFilter(true);
      return;
    }

    if (event.key === "Tab") {
      window.setTimeout(() => {
        if (!rootRef.current?.contains(document.activeElement)) {
          closeCategoryFilter();
        }
      }, 0);
      return;
    }

    let nextIndex = -1;

    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex < 0
          ? options.length - 1
          : (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      options[nextIndex]?.focus();
    }
  }

  function selectCategory(category: string, restoreFocus = true) {
    if (disabled) return;
    onChange(normalizeAdminCategoryValue(category));
    closeCategoryFilter(restoreFocus);
  }

  function scrollFilterToDialogTop(behavior: ScrollBehavior = "smooth") {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const target = root.closest(".tool-form-field") ?? root;
    const scrollContainer = root.closest(".dialog-body") as HTMLElement | null;

    if (!scrollContainer) {
      target.scrollIntoView({
        behavior,
        block: "start"
      });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = scrollContainer.scrollTop + targetRect.top - containerRect.top;

    scrollContainer.scrollTo({
      behavior,
      top: Math.max(0, nextTop)
    });
  }

  useOutsideInteractionDismiss({
    active: open,
    isInside: (event) => isEventInsideElement(event, rootRef.current),
    onDismiss: () => closeCategoryFilter()
  });

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCategoryFilter(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const hasDirectTouchFocus =
      directTouchFocusUntilRef.current > performance.now();

    if (alignToTopOnOpen && !hasDirectTouchFocus) {
      window.requestAnimationFrame(() => scrollFilterToDialogTop());
      window.setTimeout(() => scrollFilterToDialogTop(), 80);
      window.setTimeout(() => scrollFilterToDialogTop(), 180);
    }

    if (hasDirectTouchFocus) {
      const directFocusTimer = window.setTimeout(() => {
        scrollFilterToDialogTop("auto");
        searchRef.current?.focus({ preventScroll: true });
      }, 120);
      return () => window.clearTimeout(directFocusTimer);
    }

    const focusTimer = window.setTimeout(() => {
      if (focusTargetRef.current) {
        focusCategoryOption(focusTargetRef.current);
        focusTargetRef.current = null;
        return;
      }

      searchRef.current?.focus({ preventScroll: true });
    }, alignToTopOnOpen ? 220 : 0);

    return () => window.clearTimeout(focusTimer);
  }, [alignToTopOnOpen, open]);

  return (
    <div
      className={`admin-category-filter ${className} ${open ? "is-open" : ""}`}
      ref={rootRef}
      style={categoryFilterStyle}
      onKeyDown={handleCategoryOptionKeyDown}
    >
      {open ? (
        <div
          className="admin-category-filter-trigger is-searching"
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
        >
          <CategoryIcon category={query ? "" : normalizedValue} icon={query ? undefined : categoryIcons[normalizedValue]} size={16} />
          <span className="admin-category-filter-search">
            <input
              ref={searchRef}
              aria-label={categoryText.inputPlaceholder}
              placeholder={categoryText.inputPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  event.stopPropagation();
                  focusCategoryOption(
                    event.key === "ArrowDown" ? "first" : "last"
                  );
                  return;
                }

                if (event.key === "Enter" && canCreateCategory) {
                  event.preventDefault();
                  event.stopPropagation();
                  selectCategory(createCategoryName, true);
                }
              }}
            />
          </span>
          <button className="admin-category-filter-arrow"
            type="button"
            aria-label={t.actions.close}
            onClick={(event) => closeCategoryFilter(event.detail === 0)}
          >
            <ChevronDown size={15} />
          </button>
        </div>
      ) : (
        <button ref={triggerRef}
          className="admin-category-filter-trigger"
          disabled={disabled}
          type="button"
          aria-expanded="false"
          aria-haspopup="listbox"
          onPointerDown={(event) => {
            if (
              disabled ||
              !alignToTopOnOpen ||
              event.pointerType !== "touch"
            ) {
              return;
            }

            event.preventDefault();
            directTouchFocusUntilRef.current = performance.now() + 400;
            flushSync(() => setOpen(true));
          }}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              focusTargetRef.current =
                event.key === "ArrowDown" ? "first" : "last";
              setOpen(true);
            }
          }}
        >
          <CategoryIcon category={normalizedValue} icon={categoryIcons[normalizedValue]} size={16} />
          <span className="admin-category-filter-value" title={selectedLabel}>
            {displaySelectedLabel}
          </span>
          <span className="admin-category-filter-arrow admin-category-filter-arrow-indicator">
            <ChevronDown size={15} />
          </span>
        </button>
      )}

      {open ? (
        <div className="admin-category-filter-popover" role="listbox">
          {canCreateCategory ? (
            <button className="admin-category-create-option"
              type="button"
              role="option"
              aria-selected="false"
              data-admin-category-option="true"
              onClick={(event) =>
                selectCategory(createCategoryName, event.detail === 0)
              }
            >
              <Plus size={15} />
              <span>{categoryText.createLabel(createCategoryName)}</span>
            </button>
          ) : null}
          {filteredCategories.length > 0 || !canCreateCategory ? (
            <div className="admin-category-filter-list">
              {filteredCategories.length > 0 ? (
              <>
                {filteredCategories.map((category) => {
                  const selected = category === normalizedValue;
                  const fixed = normalizedFixedCategories.has(category) ||
                    (!category && Boolean(emptyOptionLabel));
                  const canDelete = Boolean(onDeleteCategory) && (
                    !fixed || normalizedDeletableFixedCategories.has(category)
                  );
                  const categoryLabel = resolveLabel(category);
                  const displayCategoryLabel = !category && emptyOptionLabel
                    ? categoryLabel
                    : getAdminCategoryDisplayLabel(categoryLabel);
                  const movableCategories = filteredCategories.filter(
                    isPersistableAdminCategory
                  );
                  const canMove =
                    Boolean(onMoveCategory) &&
                    !fixed &&
                    !isFilteringCategories &&
                    isPersistableAdminCategory(category) &&
                    movableCategories.length > 1;

                  return (
                    <div className="admin-category-filter-option" key={category}>
                      {isEditableCategoryIconCategory(category) && !fixed ? (
                        <button
                          aria-label={t.categoryIcons.edit(categoryLabel)}
                          className="admin-category-icon-button"
                          disabled={disabled}
                          title={t.categoryIcons.edit(categoryLabel)}
                          type="button"
                          onClick={() => {
                            onEditIcon(category);
                            closeCategoryFilter();
                          }}
                        >
                          <CategoryIcon category={category} icon={categoryIcons[category]} size={16} />
                        </button>
                      ) : (
                        <span className="admin-category-icon-static">
                          <CategoryIcon category={category} size={16} />
                        </span>
                      )}
                      <button className={`admin-category-select-option ${
                          selected ? "is-selected" : ""
                        }`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-admin-category-option="true"
                        onClick={(event) =>
                          selectCategory(category, event.detail === 0)
                        }
                      >
                        <span title={categoryLabel}>{displayCategoryLabel}</span>
                      </button>
                      {canMove || canDelete ? (
                        <div className="admin-category-option-actions">
                          {canMove ? (
                            <button className="admin-category-option-action admin-category-move-option"
                              type="button"
                              aria-label={getAdminCategoryMoveLabel(categoryText, t, category)}
                              title={getAdminCategoryMoveLabel(categoryText, t, category)}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onMoveCategory?.(category);
                              }}
                            >
                              <ArrowUp size={14} />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button className="admin-category-option-action admin-category-delete-option"
                              type="button"
                              aria-label={getAdminCategoryDeleteLabel(
                                categoryText,
                                t,
                                category,
                                categoryLabel
                              )}
                              title={getAdminCategoryDeleteLabel(
                                categoryText,
                                t,
                                category,
                                categoryLabel
                              )}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setOpen(false);
                                onDeleteCategory?.(category);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="admin-category-filter-empty">
                {emptyText}
              </div>
            )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getInitialAdminSystemSettingsGroup(): AdminSystemSettingsGroup {
  if (typeof window === "undefined") {
    return "site";
  }

  return (
    getAdminSystemSettingsGroupFromPath(window.location.pathname) ?? "site"
  );
}

function getAdminSystemSettingsGroupTitle(
  group: AdminSystemSettingsGroup,
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>
) {
  if (group === "services") {
    return maintenanceText.systemGroupIntegrations;
  }

  if (group === "management") {
    return maintenanceText.systemGroupSecurity;
  }

  return maintenanceText.systemGroupGeneral;
}

function AdminSystemSettingsPanel({
  adminAiSettings,
  adminAiSettingsLoadError,
  adminAiSettingsLoading,
  locale,
  maintenanceText,
  onTokenChange,
  onProxySettingsChange,
  onDataRestored,
  onAdminAiSettingsChange,
  onReloadAdminAiSettings,
  onSiteSettingsChange,
  onTelegramSettingsChange,
  onReloadTelegramSettings,
  onUmamiSettingsChange,
  proxySettings,
  proxySettingsLoadError,
  proxySettingsReady,
  setStatus,
  siteSettings,
  siteSettingsLoadError,
  siteSettingsReady,
  t,
  telegramSettings,
  telegramSettingsLoadError,
  telegramSettingsLoading,
  token
}: {
  adminAiSettings: AdminAiSettings;
  adminAiSettingsLoadError: unknown;
  adminAiSettingsLoading: boolean;
  locale: Locale;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onTokenChange: (token: string) => void;
  onProxySettingsChange: (settings: ProxySettings) => void;
  onDataRestored: (resultMessage: string, settingsResult: AdminRefreshResult) => Promise<AdminRefreshResult>;
  onAdminAiSettingsChange: (settings: AdminAiSettings) => void;
  onReloadAdminAiSettings: () => Promise<void>;
  onSiteSettingsChange: (settings: SiteSettings) => void;
  onTelegramSettingsChange: (settings: TelegramSettings) => void;
  onReloadTelegramSettings: () => Promise<void>;
  onUmamiSettingsChange: (settings: UmamiSettings) => void;
  proxySettings: ProxySettings;
  proxySettingsLoadError: unknown;
  proxySettingsReady: boolean;
  setStatus: (status: string) => void;
  siteSettings: SiteSettings;
  siteSettingsLoadError: unknown;
  siteSettingsReady: boolean;
  t: Messages;
  telegramSettings: TelegramSettings;
  telegramSettingsLoadError: unknown;
  telegramSettingsLoading: boolean;
  token: string;
}) {
  const [sourceSettings, setSourceSettings] = useState<SourceSettings | null>(null);
  const [activeSettingsGroup, setActiveSettingsGroup] =
    useState<AdminSystemSettingsGroup>(getInitialAdminSystemSettingsGroup);
  const [settingsTopbarTarget, setSettingsTopbarTarget] =
    useState<HTMLElement | null>(null);
  const [sourceSettingsLoading, setSourceSettingsLoading] = useState(true);
  const [adminAiSettingsSaving, setAdminAiSettingsSaving] = useState(false);
  const [adminAiModel, setAdminAiModel] = useState(adminAiSettings.model);
  const [securitySettingsLoading, setSecuritySettingsLoading] = useState(true);
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(!siteSettingsReady);
  const [proxySettingsLoading, setProxySettingsLoading] = useState(!proxySettingsReady);
  const [sourceSettingsError, setSourceSettingsError] = useState<unknown>(null);
  const [siteSettingsError, setSiteSettingsError] = useState<unknown>(siteSettingsLoadError);
  const [proxySettingsError, setProxySettingsError] = useState<unknown>(proxySettingsLoadError);
  const [sourceSettingsSaving, setSourceSettingsSaving] = useState(false);
  const [githubSettingsDirty, setGitHubSettingsDirty] = useState(false);
  const [umamiSettingsDirty, setUmamiSettingsDirty] = useState(false);
  const [imageBedSettingsDirty, setImageBedSettingsDirty] = useState(false);
  const [rssHubSettingsDirty, setRssHubSettingsDirty] = useState(false);
  const [telegramSettingsDirty, setTelegramSettingsDirty] = useState(false);
  const [securitySettingsDirty, setSecuritySettingsDirty] = useState(false);
  const [settingsReloadKey, setSettingsReloadKey] = useState(0);
  const [proxySaving, setProxySaving] = useState(false);
  const proxySavingRef = useRef(false);
  const [proxyForm, setProxyForm] = useState(proxySettings);
  const [siteForm, setSiteForm] = useState(() =>
    getEditableSiteSettings(siteSettings)
  );
  const [persistedSiteSettings, setPersistedSiteSettings] = useState(() =>
    getEditableSiteSettings(siteSettings)
  );
  const [siteSaving, setSiteSaving] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [siteResetting, setSiteResetting] = useState(false);
  const [aboutResetting, setAboutResetting] = useState(false);
  const [privacyResetting, setPrivacyResetting] = useState(false);
  const [termsResetting, setTermsResetting] = useState(false);
  const [footerResetting, setFooterResetting] = useState(false);
  const [homeResetting, setHomeResetting] = useState(false);
  const [siteIconFileName, setSiteIconFileName] = useState("");
  const [siteIconFileInvalid, setSiteIconFileInvalid] = useState(false);
  const [footerSocialLinksText, setFooterSocialLinksText] = useState(
    formatFooterJson(getSiteFooterSettings(siteSettings).socialLinks)
  );
  const [footerGroupsText, setFooterGroupsText] = useState(
    formatFooterJson(getSiteFooterSettings(siteSettings).groups)
  );
  const [footerInvalidField, setFooterInvalidField] = useState<"social" | "groups" | null>(null);
  const [backupFileName, setBackupFileName] = useState("");
  const [backupFileInvalid, setBackupFileInvalid] = useState(false);
  const [backupPayload, setBackupPayload] = useState<HtoolsBackup | null>(null);
  const [backupExporting, setBackupExporting] = useState(false);
  const backupExportingRef = useRef(false);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [factoryResetting, setFactoryResetting] = useState(false);
  const maintenanceMutationRef = useRef(false);
  const [pendingBackupRestore, setPendingBackupRestore] = useState(false);
  const [pendingFactoryReset, setPendingFactoryReset] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] = useState<
    "backup" | null
  >(null);
  const siteSettingsMutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const settingsWriteLocksRef = useRef(new Set<string>());
  const locallyAppliedSiteSettingsSignatureRef = useRef("");
  const settingsGroupTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sourceSettingsLoadRequestRef = useRef(0);
  const siteSettingsLoadRequestRef = useRef(0);
  const proxySettingsLoadRequestRef = useRef(0);
  const sourceSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const siteSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const proxySettingsLoadAbortRef = useRef<AbortController | null>(null);

  function clearMessage() {
    setStatus("");
  }

  function acquireSettingsWriteLock(key: string) {
    if (settingsWriteLocksRef.current.has(key)) return false;
    settingsWriteLocksRef.current.add(key);
    return true;
  }

  function releaseSettingsWriteLock(key: string) {
    settingsWriteLocksRef.current.delete(key);
  }

  function getSiteSettingsErrorMessage(error: unknown) {
    const message = getLocalizedErrorMessage(error, t);

    if (message === "footer social links JSON is invalid.") {
      return maintenanceText.footerSocialJsonInvalid;
    }

    if (message === "footer groups JSON is invalid.") {
      return maintenanceText.footerGroupsJsonInvalid;
    }

    if (
      message === "site icon URL must be a valid http/https URL." ||
      message === "site icon must be a valid http/https URL or supported image data."
    ) {
      return maintenanceText.siteIconInvalid;
    }

    return message;
  }

  function createSiteSettingsSignature(settings: SiteSettings) {
    return JSON.stringify(getEditableSiteSettings(settings));
  }

  function syncSiteSettingsForm(settings: SiteSettings) {
    const editableSettings = getEditableSiteSettings(settings);
    const footer = getSiteFooterSettings(settings);

    setPersistedSiteSettings(editableSettings);
    setSiteForm(editableSettings);
    setFooterSocialLinksText(formatFooterJson(footer.socialLinks));
    setFooterGroupsText(formatFooterJson(footer.groups));
  }

  function applySiteSettingsResponse(
    settings: SiteSettings,
    section: "identity" | "about" | "privacy" | "terms" | "home" | "footer"
  ) {
    const editableSettings = getEditableSiteSettings(settings);
    const footer = getSiteFooterSettings(settings);

    setPersistedSiteSettings(editableSettings);
    setSiteForm((current) => {
      if (section === "identity") {
        return {
          ...current,
          name: editableSettings.name,
          subtitle: editableSettings.subtitle,
          iconUrl: editableSettings.iconUrl
        };
      }

      if (section === "about") {
        return {
          ...current,
          aboutContent: editableSettings.aboutContent
        };
      }

      if (section === "privacy") {
        return {
          ...current,
          privacyContent: editableSettings.privacyContent
        };
      }

      if (section === "terms") {
        return {
          ...current,
          termsContent: editableSettings.termsContent
        };
      }

      if (section === "home") {
        return {
          ...current,
          homeHero: editableSettings.homeHero
        };
      }

      return {
        ...current,
        footer: editableSettings.footer
      };
    });

    if (section === "footer") {
      setFooterSocialLinksText(formatFooterJson(footer.socialLinks));
      setFooterGroupsText(formatFooterJson(footer.groups));
    }

    locallyAppliedSiteSettingsSignatureRef.current =
      createSiteSettingsSignature(settings);
    onSiteSettingsChange(settings);
  }

  function enqueueSiteSettingsMutation<T>(mutation: () => Promise<T>) {
    const result = siteSettingsMutationQueueRef.current.then(mutation, mutation);
    siteSettingsMutationQueueRef.current = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  useEffect(() => {
    setProxyForm((current) => ({
      ...current,
      baseUrl: proxySettings.baseUrl,
      mode: proxySettings.mode,
      scope: proxySettings.scope
    }));
  }, [proxySettings.baseUrl, proxySettings.mode, proxySettings.scope]);

  useEffect(() => {
    setAdminAiModel(adminAiSettings.model);
  }, [adminAiSettings.model]);

  useEffect(() => {
    if (!siteSettingsReady) {
      setSiteSettingsLoading(true);
      return;
    }

    setSiteSettingsLoading(false);
    setSiteSettingsError(siteSettingsLoadError);
  }, [siteSettingsLoadError, siteSettingsReady]);

  useEffect(() => {
    if (!proxySettingsReady) {
      setProxySettingsLoading(true);
      return;
    }

    setProxySettingsLoading(false);
    setProxySettingsError(proxySettingsLoadError);
  }, [proxySettingsLoadError, proxySettingsReady]);

  useEffect(() => {
    setSettingsTopbarTarget(
      document.getElementById("admin-system-settings-topbar-slot")
    );
  }, []);

  useEffect(() => {
    const signature = createSiteSettingsSignature(siteSettings);

    if (locallyAppliedSiteSettingsSignatureRef.current === signature) {
      locallyAppliedSiteSettingsSignatureRef.current = "";
      return;
    }

    syncSiteSettingsForm(siteSettings);
    setSiteIconFileName("");
  }, [siteSettings]);

  async function loadSourceSettingsCard() {
    const requestId = ++sourceSettingsLoadRequestRef.current;
    sourceSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    sourceSettingsLoadAbortRef.current = controller;
    setSourceSettingsLoading(true);

    try {
      const settings = await loadSourceSettings(token, {
        signal: controller.signal
      });
      if (sourceSettingsLoadRequestRef.current === requestId) {
        setSourceSettings(settings);
        setSourceSettingsError(null);
      }
    } catch (error) {
      if (
        sourceSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setSourceSettingsError(error);
      }
    } finally {
      if (sourceSettingsLoadRequestRef.current === requestId) {
        setSourceSettingsLoading(false);
        if (sourceSettingsLoadAbortRef.current === controller) {
          sourceSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadSiteSettingsCards() {
    const requestId = ++siteSettingsLoadRequestRef.current;
    siteSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    siteSettingsLoadAbortRef.current = controller;
    setSiteSettingsLoading(true);

    try {
      const settings = await loadSiteSettings({ signal: controller.signal });
      if (siteSettingsLoadRequestRef.current === requestId) {
        setSiteSettingsError(null);
        syncSiteSettingsForm(settings);
        locallyAppliedSiteSettingsSignatureRef.current =
          createSiteSettingsSignature(settings);
        onSiteSettingsChange(settings);
        setSiteIconFileName("");
      }
    } catch (error) {
      if (
        siteSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setSiteSettingsError(error);
      }
    } finally {
      if (siteSettingsLoadRequestRef.current === requestId) {
        setSiteSettingsLoading(false);
        if (siteSettingsLoadAbortRef.current === controller) {
          siteSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadProxySettingsCard() {
    const requestId = ++proxySettingsLoadRequestRef.current;
    proxySettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    proxySettingsLoadAbortRef.current = controller;
    setProxySettingsLoading(true);

    try {
      const settings = await loadProxySettings({ signal: controller.signal });
      const normalizedSettings = {
        enabled: settings.enabled,
        baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
        mode: normalizeProxyMode(settings.mode),
        scope: normalizeProxyScope(settings.scope)
      };

      if (proxySettingsLoadRequestRef.current === requestId) {
        setProxySettingsError(null);
        setProxyForm(normalizedSettings);
        onProxySettingsChange(normalizedSettings);
      }
    } catch (error) {
      if (
        proxySettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setProxySettingsError(error);
      }
    } finally {
      if (proxySettingsLoadRequestRef.current === requestId) {
        setProxySettingsLoading(false);
        if (proxySettingsLoadAbortRef.current === controller) {
          proxySettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  useEffect(() => {
    void loadSourceSettingsCard();

    return () => {
      sourceSettingsLoadAbortRef.current?.abort();
      sourceSettingsLoadRequestRef.current += 1;
    };
  }, [token]);

  useEffect(() => () => {
    siteSettingsLoadAbortRef.current?.abort();
    proxySettingsLoadAbortRef.current?.abort();
    siteSettingsLoadRequestRef.current += 1;
    proxySettingsLoadRequestRef.current += 1;
  }, []);

  useEffect(() => {
    function handlePopState() {
      setActiveSettingsGroup(getInitialAdminSystemSettingsGroup());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const nextPath = ADMIN_SYSTEM_SETTINGS_GROUP_PATHS[activeSettingsGroup];
    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.replaceState({}, "", nextPath);
    }
  }, [activeSettingsGroup]);

  useEffect(() => {
    document.title = formatAdminDocumentTitle(
      getAdminSystemSettingsGroupTitle(activeSettingsGroup, maintenanceText),
      getSiteDisplayName(siteSettings),
      t.nav.admin
    );
  }, [activeSettingsGroup, maintenanceText, siteSettings, t.nav.admin]);

  function selectSettingsGroup(group: AdminSystemSettingsGroup) {
    setActiveSettingsGroup(group);
    window.history.pushState({}, "", ADMIN_SYSTEM_SETTINGS_GROUP_PATHS[group]);
  }

  function handleSettingsGroupKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    groupIndex: number
  ) {
    let nextIndex = groupIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (groupIndex + 1) % ADMIN_SYSTEM_SETTINGS_GROUPS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (groupIndex - 1 + ADMIN_SYSTEM_SETTINGS_GROUPS.length) %
        ADMIN_SYSTEM_SETTINGS_GROUPS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ADMIN_SYSTEM_SETTINGS_GROUPS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextGroup = ADMIN_SYSTEM_SETTINGS_GROUPS[nextIndex];
    selectSettingsGroup(nextGroup);
    settingsGroupTabRefs.current[nextIndex]?.focus();
  }

  async function togglePublicSource() {
    if (!acquireSettingsWriteLock(`source`)) return;
    setSourceSettingsSaving(true);
    clearMessage();

    try {
      const settings = await saveSourceSettings(!(sourceSettings?.enabled ?? false), token);
      setSourceSettings(settings);
      setStatus(
        settings.enabled
          ? maintenanceText.publicEnabledMessage
          : maintenanceText.publicDisabledMessage
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseSettingsWriteLock(`source`);
      setSourceSettingsSaving(false);
    }
  }

  async function saveProxy(
    nextSettings: ProxySettings,
    syncFormAfterSave: boolean
  ) {
    if (proxySavingRef.current) {
      return;
    }

    const baseUrl = normalizeProxyBaseUrl(nextSettings.baseUrl);

    if (nextSettings.enabled && !baseUrl) {
      setStatus(
        nextSettings.baseUrl.trim()
          ? maintenanceText.proxyInvalid
          : maintenanceText.proxyRequired
      );
      return;
    }

    proxySavingRef.current = true;
    setProxySaving(true);
    clearMessage();

    try {
      const settings = await saveProxySettings(
        {
          enabled: nextSettings.enabled,
          baseUrl,
          mode: normalizeProxyMode(nextSettings.mode),
          scope: normalizeProxyScope(nextSettings.scope)
        },
        token
      );
      const normalizedSettings = {
        enabled: settings.enabled,
        baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
        mode: normalizeProxyMode(settings.mode),
        scope: normalizeProxyScope(settings.scope)
      };
      if (syncFormAfterSave) {
        setProxyForm(normalizedSettings);
      }
      onProxySettingsChange(normalizedSettings);
      setStatus(
        syncFormAfterSave
          ? maintenanceText.proxyUpdated
          : settings.enabled
            ? maintenanceText.proxyEnabledMessage
            : maintenanceText.proxyDisabledMessage
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      proxySavingRef.current = false;
      setProxySaving(false);
    }
  }

  function saveProxyForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveProxy(
      {
        enabled: proxySettings.enabled,
        baseUrl: proxyForm.baseUrl,
        mode: proxyForm.mode,
        scope: proxyForm.scope
      },
      true
    );
  }

  async function persistAdminAiSettings(
    enabled: boolean,
    model: AdminAiSettings["model"],
    successMessage: string
  ) {
    if (adminAiSettingsSaving || !acquireSettingsWriteLock("workers-ai")) return;
    setAdminAiSettingsSaving(true);
    clearMessage();

    try {
      const settings = await saveAdminAiSettings({ enabled, model }, token);
      onAdminAiSettingsChange(settings);
      setAdminAiModel(settings.model);
      setStatus(successMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseSettingsWriteLock("workers-ai");
      setAdminAiSettingsSaving(false);
    }
  }

  function saveAdminAiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persistAdminAiSettings(
      adminAiSettings.enabled,
      adminAiModel,
      maintenanceText.aiUpdated
    );
  }

  function toggleAdminAi() {
    const enabled = !adminAiSettings.enabled;
    void persistAdminAiSettings(
      enabled,
      adminAiSettings.model,
      enabled
        ? maintenanceText.aiEnabledMessage
        : maintenanceText.aiDisabledMessage
    );
  }

  function toggleProxy() {
    void saveProxy(
      {
        enabled: !proxySettings.enabled,
        baseUrl: proxySettings.baseUrl,
        mode: proxySettings.mode,
        scope: proxySettings.scope
      },
      false
    );
  }

  function updateFooterForm(patch: Partial<FooterSettings>) {
    setSiteForm((current) => ({
      ...current,
      footer: {
        ...getFooterFormValues(current),
        ...patch
      }
    }));
  }

  function parseFooterJson<T>(
    value: string,
    fallback: T,
    kind: "social" | "groups"
  ): T {
    if (!value.trim()) {
      return fallback;
    }

    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("footer JSON must be an array.");
    }

    const valid =
      kind === "social"
        ? parsed.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { label?: unknown }).label === "string" &&
              Boolean((item as { label: string }).label.trim()) &&
              typeof (item as { href?: unknown }).href === "string" &&
              Boolean((item as { href: string }).href.trim())
          )
        : parsed.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { title?: unknown }).title === "string" &&
              Boolean((item as { title: string }).title.trim()) &&
              Array.isArray((item as { links?: unknown }).links) &&
              (item as { links: unknown[] }).links.every(
                (link) =>
                  typeof link === "object" &&
                  link !== null &&
                  typeof (link as { label?: unknown }).label === "string" &&
                  Boolean((link as { label: string }).label.trim()) &&
                  typeof (link as { href?: unknown }).href === "string" &&
                  Boolean((link as { href: string }).href.trim())
              )
          );

    if (!valid) {
      throw new Error(
        kind === "social"
          ? "footer social links JSON is invalid."
          : "footer groups JSON is invalid."
      );
    }

    return parsed as T;
  }

  function buildFooterSettingsPayload(): FooterSettings {
    const footer = getSiteFooterSettings(siteForm);

    return {
      ...footer,
      authorName: DEFAULT_FOOTER_SETTINGS.authorName,
      authorUrl: DEFAULT_FOOTER_SETTINGS.authorUrl,
      copyright: DEFAULT_FOOTER_SETTINGS.copyright,
      socialLinks: parseFooterJson(
        footerSocialLinksText,
        DEFAULT_FOOTER_SETTINGS.socialLinks,
        "social"
      ),
      groups: parseFooterJson(
        footerGroupsText,
        DEFAULT_FOOTER_SETTINGS.groups,
        "groups"
      )
    };
  }

  function getHomeHeroFormContent(
    settings: SiteSettings,
    locale: "zh" | "en"
  ): HomeHeroContent {
    const content = getHomeHeroSettings(settings)[locale];
    const defaults = translations[locale].home;

    return {
      titleTop: content.titleTop || defaults.titleTop,
      titleBottom: content.titleBottom || defaults.titleBottom,
      description: content.description || defaults.description
    };
  }

  function updateHomeHeroForm(
    locale: "zh" | "en",
    patch: Partial<HomeHeroContent>
  ) {
    setSiteForm((current) => {
      const homeHero = getHomeHeroSettings(current);

      return {
        ...current,
        homeHero: {
          ...homeHero,
          [locale]: {
            ...homeHero[locale],
            ...patch
          }
        }
      };
    });
  }

  async function saveSiteIdentityForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-identity`)) return;
    setSiteSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "identity",
            name: siteForm.name,
            subtitle: siteForm.subtitle,
            iconUrl: siteForm.iconUrl
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "identity");
      setStatus(maintenanceText.siteUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-identity`);
      setSiteSaving(false);
    }
  }

  async function saveAboutPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-about`)) return;
    setAboutSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "about",
            aboutContent: siteForm.aboutContent
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "about");
      setStatus(maintenanceText.aboutUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-about`);
      setAboutSaving(false);
    }
  }

  async function savePrivacyPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-privacy`)) return;
    setPrivacySaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "privacy",
            privacyContent: siteForm.privacyContent ?? { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "privacy");
      setStatus(maintenanceText.privacyUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-privacy`);
      setPrivacySaving(false);
    }
  }

  async function saveTermsPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-terms`)) return;
    setTermsSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "terms",
            termsContent: siteForm.termsContent ?? { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "terms");
      setStatus(maintenanceText.termsUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-terms`);
      setTermsSaving(false);
    }
  }

  async function saveFooterSettingsForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessage();
    setFooterInvalidField(null);

    for (const [field, value, fallback, kind] of [
      ["social", footerSocialLinksText, DEFAULT_FOOTER_SETTINGS.socialLinks, "social"],
      ["groups", footerGroupsText, DEFAULT_FOOTER_SETTINGS.groups, "groups"]
    ] as const) {
      try {
        parseFooterJson(value, fallback, kind);
      } catch {
        setFooterInvalidField(field);
        setStatus(maintenanceText.footerJsonInvalid);
        event.currentTarget
          .querySelector<HTMLTextAreaElement>(`[data-footer-json="${field}"]`)
          ?.focus();
        return;
      }
    }

    if (!acquireSettingsWriteLock(`site-footer`)) return;

    setFooterSaving(true);

    try {
      const footer = buildFooterSettingsPayload();
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "footer",
            footer
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "footer");
      setStatus(maintenanceText.footerUpdated);
    } catch (error) {
      setStatus(
        error instanceof SyntaxError
          ? maintenanceText.footerJsonInvalid
          : getSiteSettingsErrorMessage(error)
      );
    } finally {
      releaseSettingsWriteLock(`site-footer`);
      setFooterSaving(false);
    }
  }

  async function saveHomeHeroForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-home`)) return;
    setHomeSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "home",
            homeHero: getHomeHeroSettings(siteForm)
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "home");
      setStatus(maintenanceText.homeUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-home`);
      setHomeSaving(false);
    }
  }

  async function resetHomeHeroSettings() {
    if (!acquireSettingsWriteLock(`site-home`)) return;
    setHomeResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "home",
            homeHero: DEFAULT_HOME_HERO_SETTINGS
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "home");
      setStatus(maintenanceText.homeResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-home`);
      setHomeResetting(false);
    }
  }

  async function resetSiteIdentity() {
    if (!acquireSettingsWriteLock(`site-identity`)) return;
    setSiteResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "identity",
            name: DEFAULT_SITE_SETTINGS.name,
            subtitle: DEFAULT_SITE_SETTINGS.subtitle,
            iconUrl: ""
          },
          token
        )
      );
      setSiteIconFileName("");
      applySiteSettingsResponse(settings, "identity");
      setStatus(maintenanceText.siteResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-identity`);
      setSiteResetting(false);
    }
  }

  async function resetAboutPage() {
    if (!acquireSettingsWriteLock(`site-about`)) return;
    setAboutResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "about",
            aboutContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "about");
      setStatus(maintenanceText.aboutResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-about`);
      setAboutResetting(false);
    }
  }

  async function resetFooterSettings() {
    if (!acquireSettingsWriteLock(`site-footer`)) return;
    setFooterResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "footer",
            footer: DEFAULT_FOOTER_SETTINGS
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "footer");
      setStatus(maintenanceText.footerResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-footer`);
      setFooterResetting(false);
    }
  }

  async function handleSiteIconFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setSiteIconFileInvalid(false);

    try {
      const iconUrl = await readSiteIconFile(file);
      setSiteIconFileName(file.name);
      setSiteForm((current) => ({
        ...current,
        iconUrl
      }));
    } catch (error) {
      setSiteIconFileName("");
      setSiteIconFileInvalid(true);
      const message = error instanceof Error ? error.message : "";

      if (message === "site icon file is too large.") {
        setStatus(maintenanceText.siteIconUploadTooLarge);
        return;
      }

      setStatus(maintenanceText.siteIconUploadInvalid);
    }
  }

  async function refreshSettingsAfterMaintenance() {
    const [source, proxy, configuration, telegram, ai] = await Promise.all([
      loadSourceSettings(token),
      loadProxySettings(),
      loadSiteConfiguration(),
      loadTelegramSettings(token),
      loadAdminAiSettings(token)
    ]);
    const normalizedProxy = {
      enabled: proxy.enabled,
      baseUrl: normalizeProxyBaseUrl(proxy.baseUrl),
      mode: normalizeProxyMode(proxy.mode),
      scope: normalizeProxyScope(proxy.scope)
    };

    setSourceSettings(source);
    setProxyForm(normalizedProxy);
    onProxySettingsChange(normalizedProxy);
    syncSiteSettingsForm(configuration.settings);
    locallyAppliedSiteSettingsSignatureRef.current =
      createSiteSettingsSignature(configuration.settings);
    onSiteSettingsChange(configuration.settings);
    setSettingsReloadKey((current) => current + 1);
    onTelegramSettingsChange(telegram);
    onAdminAiSettingsChange(ai);
  }

  async function factoryReset() {
    if (maintenanceMutationRef.current) {
      return;
    }

    maintenanceMutationRef.current = true;
    setFactoryResetting(true);
    clearMessage();

    try {
      const result = await resetFactorySettings(token);
      setPendingFactoryReset(false);
      setBackupFileName("");
      setBackupPayload(null);
      const settingsResult = await refreshSettingsAfterMaintenance().then(
        () => "success" as const,
        () => "failed" as const
      );
      await onDataRestored(maintenanceText.resetDone(result), settingsResult);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      maintenanceMutationRef.current = false;
      setFactoryResetting(false);
    }
  }

  async function resetPrivacyPage() {
    if (!acquireSettingsWriteLock(`site-privacy`)) return;
    setPrivacyResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "privacy",
            privacyContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "privacy");
      setStatus(maintenanceText.privacyResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-privacy`);
      setPrivacyResetting(false);
    }
  }

  async function resetTermsPage() {
    if (!acquireSettingsWriteLock(`site-terms`)) return;
    setTermsResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "terms",
            termsContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "terms");
      setStatus(maintenanceText.termsResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-terms`);
      setTermsResetting(false);
    }
  }

  async function exportBackup() {
    if (backupExportingRef.current) {
      return;
    }

    backupExportingRef.current = true;
    setBackupExporting(true);
    clearMessage();

    try {
      const backup = readBackupPayload(
        await exportBackupData(token),
        maintenanceText
      );
      downloadTextFile(
        createDatedExportFilename("backup", "json"),
        JSON.stringify(backup, null, 2),
        "application/json;charset=utf-8"
      );
      setStatus(maintenanceText.backupExported(backup.counts));
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      backupExportingRef.current = false;
      setBackupExporting(false);
    }
  }

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setBackupFileInvalid(false);

    try {
      validateBackupFileSize(file, maintenanceText);
      const payload = JSON.parse(await file.text()) as unknown;
      const backup = readBackupPayload(payload, maintenanceText);
      setBackupFileName(file.name);
      setBackupPayload(backup);
      setStatus(maintenanceText.backupReady(file.name, backup.counts));
    } catch (error) {
      setBackupFileName("");
      setBackupPayload(null);
      setBackupFileInvalid(true);
      setStatus(
        error instanceof Error && error.message === maintenanceText.backupTooLarge
          ? maintenanceText.backupTooLarge
          : maintenanceText.backupInvalid
      );
    }
  }

  async function restoreBackup() {
    if (!backupPayload) {
      setStatus(maintenanceText.backupEmpty);
      return;
    }

    if (maintenanceMutationRef.current) {
      return;
    }

    maintenanceMutationRef.current = true;
    setBackupRestoring(true);
    clearMessage();

    try {
      const result = await restoreBackupData(backupPayload, token);
      setPendingBackupRestore(false);
      setBackupFileName("");
      setBackupPayload(null);
      const settingsResult = await refreshSettingsAfterMaintenance().then(
        () => "success" as const,
        () => "failed" as const
      );
      await onDataRestored(maintenanceText.backupRestoreSummary(result), settingsResult);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      maintenanceMutationRef.current = false;
      setBackupRestoring(false);
    }
  }

  const publicSourceEnabled = sourceSettings?.enabled ?? false;
  const publicSourceUrl =
    sourceSettings?.sourceUrl ?? new URL("/api/htools.json", window.location.origin).toString();
  const proxyEnabled = proxySettings.enabled;
  const hasSavedProxyConfig = Boolean(normalizeProxyBaseUrl(proxySettings.baseUrl));
  const footerForm = getFooterFormValues(siteForm);
  const persistedFooterForm = getFooterFormValues(persistedSiteSettings);
  const homeHeroForm = {
    zh: getHomeHeroFormContent(siteForm, "zh"),
    en: getHomeHeroFormContent(siteForm, "en")
  };
  const persistedHomeHeroForm = {
    zh: getHomeHeroFormContent(persistedSiteSettings, "zh"),
    en: getHomeHeroFormContent(persistedSiteSettings, "en")
  };
  const privacyForm = siteForm.privacyContent ?? { zh: "", en: "" };
  const termsForm = siteForm.termsContent ?? { zh: "", en: "" };
  const aboutForm = siteForm.aboutContent;
  const persistedFooter = getSiteFooterSettings(persistedSiteSettings);
  const siteIdentityDirty =
    siteForm.name !== persistedSiteSettings.name ||
    siteForm.subtitle !== persistedSiteSettings.subtitle ||
    siteForm.iconUrl !== persistedSiteSettings.iconUrl;
  const aboutPageDirty =
    JSON.stringify(siteForm.aboutContent) !==
    JSON.stringify(persistedSiteSettings.aboutContent);
  const privacyPageDirty =
    JSON.stringify(siteForm.privacyContent) !==
    JSON.stringify(persistedSiteSettings.privacyContent);
  const termsPageDirty =
    JSON.stringify(siteForm.termsContent) !==
    JSON.stringify(persistedSiteSettings.termsContent);
  const footerSettingsDirty =
    JSON.stringify(footerForm) !== JSON.stringify(persistedFooterForm) ||
    footerSocialLinksText !== formatFooterJson(persistedFooter.socialLinks) ||
    footerGroupsText !== formatFooterJson(persistedFooter.groups);
  const homeHeroDirty =
    JSON.stringify(homeHeroForm) !== JSON.stringify(persistedHomeHeroForm);
  const proxySettingsDirty =
    normalizeProxyBaseUrl(proxyForm.baseUrl) !==
      normalizeProxyBaseUrl(proxySettings.baseUrl) ||
    normalizeProxyMode(proxyForm.mode) !== normalizeProxyMode(proxySettings.mode) ||
    normalizeProxyScope(proxyForm.scope) !== normalizeProxyScope(proxySettings.scope);
  const adminAiSettingsDirty = adminAiModel !== adminAiSettings.model;
  const hasUnsavedSettings =
    siteIdentityDirty ||
    aboutPageDirty ||
    privacyPageDirty ||
    termsPageDirty ||
    homeHeroDirty ||
    footerSettingsDirty ||
    githubSettingsDirty ||
    proxySettingsDirty ||
    umamiSettingsDirty ||
    imageBedSettingsDirty ||
    rssHubSettingsDirty ||
    telegramSettingsDirty ||
    adminAiSettingsDirty ||
    securitySettingsDirty;

  function requestBackupRestore() {
    if (hasUnsavedSettings) {
      setPendingDiscardAction("backup");
      return;
    }

    setPendingBackupRestore(true);
  }

  function requestFactoryReset() {
    setPendingFactoryReset(true);
  }
  const siteIdentityBusy = siteSaving || siteResetting;
  const aboutPageBusy = aboutSaving || aboutResetting;
  const privacyPageBusy = privacySaving || privacyResetting;
  const termsPageBusy = termsSaving || termsResetting;
  const footerSettingsBusy = footerSaving || footerResetting;
  const homeHeroBusy = homeSaving || homeResetting;
  const showSiteSettingsSkeleton = useLoadingSkeleton(siteSettingsLoading, 0);
  const showProxySettingsSkeleton = useLoadingSkeleton(proxySettingsLoading, 0);
  const showSourceSettingsSkeleton = useLoadingSkeleton(sourceSettingsLoading, 0);
  const showSecuritySettingsSkeleton = useLoadingSkeleton(securitySettingsLoading, 0);

  const settingsGroups: Array<{
    id: AdminSystemSettingsGroup;
    label: string;
  }> = [
    {
      id: "site",
      label: maintenanceText.systemGroupGeneral
    },
    {
      id: "services",
      label: maintenanceText.systemGroupIntegrations
    },
    {
      id: "management",
      label: maintenanceText.systemGroupSecurity
    }
  ];

  const settingsTabs = (
    <div
      className="admin-segmented-toggle system-settings-tabs"
      role="tablist"
      aria-label={maintenanceText.systemTitle}
    >
      {settingsGroups.map((group, index) => {
        const selected = activeSettingsGroup === group.id;

        return (
          <button aria-controls={`system-settings-panel-${group.id}`}
            aria-selected={selected}
            className={`admin-segmented-toggle-option system-settings-tab ${
              selected ? "is-active" : ""
            }`}
            id={`system-settings-tab-${group.id}`}
            key={group.id}
            onClick={() => {
              if (!selected) {
                selectSettingsGroup(group.id);
              }
            }}
            onKeyDown={(event) => handleSettingsGroupKeyDown(event, index)}
            ref={(element) => {
              settingsGroupTabRefs.current[index] = element;
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {settingsTopbarTarget
        ? createPortal(settingsTabs, settingsTopbarTarget)
        : null}
      <section
        className="admin-system-settings"
        aria-label={maintenanceText.systemTitle}
      >
      <div
        className={`system-settings-grid is-${activeSettingsGroup}`}
      >
        <div
          aria-labelledby="system-settings-tab-site"
          className="system-settings-column system-settings-primary system-settings-group-panel"
          hidden={activeSettingsGroup !== "site"}
          id="system-settings-panel-site"
          role="tabpanel"
        >
          {siteSettingsError ? (
            <article className="source-public-card settings-load-error-card">
              <AdminSettingsLoadError
                isRetrying={siteSettingsLoading}
                message={getLocalizedErrorMessage(siteSettingsError, t)}
                onRetry={() => void loadSiteSettingsCards()}
                retryLabel={maintenanceText.systemRetry}
                title={maintenanceText.systemGroupGeneral}
              />
            </article>
          ) : (
          <>
          <article className="source-public-card site-identity-card" {...getAdminLoadingProps(siteSettingsLoading, showSiteSettingsSkeleton)}>
          <div>
            <h3>{maintenanceText.siteTitle}</h3>
            <p id="site-identity-description">{maintenanceText.siteDescription}</p>
          </div>
          <form aria-describedby="site-identity-description" className="proxy-settings-form" onSubmit={saveSiteIdentityForm}>
            <div className="settings-grid">
              <label className="source-url-field">
                {maintenanceText.siteNameLabel}
                <input
                  disabled={siteIdentityBusy}
                  maxLength={40}
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,
                      name: event.target.value
                    })
                  }
                  placeholder={DEFAULT_SITE_SETTINGS.name}
                  value={siteForm.name}
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.siteSubtitleLabel}
                <input
                  disabled={siteIdentityBusy}
                  maxLength={60}
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,
                      subtitle: event.target.value
                    })
                  }
                  placeholder={DEFAULT_SITE_SETTINGS.subtitle}
                  value={siteForm.subtitle}
                />
              </label>
            </div>
            <label className="source-url-field">
              {maintenanceText.siteIconLabel}
              <input
                aria-describedby="site-icon-help"
                disabled={siteIdentityBusy}
                inputMode="url"
                onChange={(event) => {
                  setSiteIconFileName("");
                  setSiteIconFileInvalid(false);
                  setSiteForm({
                    ...siteForm,
                    iconUrl: event.target.value
                  });
                }}
                placeholder={maintenanceText.siteIconPlaceholder}
                type="url"
                value={isSiteIconDataUrl(siteForm.iconUrl) ? "" : siteForm.iconUrl}
              />
            </label>
            <p className="site-icon-choice-help" id="site-icon-help">
              {maintenanceText.siteIconChoiceHelp}
            </p>
            <div className="site-identity-footer">
              <div className="site-identity-preview-shell">
                <div className="site-identity-preview">
                  <SiteBrandMark className="compact-mark" iconUrl={siteForm.iconUrl} />
                  <span>
                    <strong>{siteForm.name.trim() || DEFAULT_SITE_SETTINGS.name}</strong>
                    <small>{siteForm.subtitle.trim() || DEFAULT_SITE_SETTINGS.subtitle}</small>
                  </span>
                </div>
                <label
                  aria-describedby="site-icon-help site-icon-upload-status global-operation-status"
                  aria-label={maintenanceText.siteIconUpload}
                  className="icon-button backup-file-picker site-icon-upload-trigger"
                  title={
                    siteIconFileName
                      ? `${maintenanceText.siteIconUploaded}: ${siteIconFileName}`
                      : maintenanceText.siteIconUpload
                  }
                >
                  <Upload size={17} />
                  <input
                    accept={SITE_ICON_UPLOAD_ACCEPT}
                    aria-describedby="site-icon-help site-icon-upload-status global-operation-status"
                    aria-invalid={siteIconFileInvalid}
                    disabled={siteIdentityBusy}
                    type="file"
                    onChange={handleSiteIconFile}
                  />
                </label>
                <span aria-live="polite" className="visually-hidden" id="site-icon-upload-status">
                  {siteIconFileName
                    ? `${maintenanceText.siteIconUploaded}: ${siteIconFileName}`
                    : ""}
                </span>
              </div>
              <div className="site-identity-actions">
                <button className="primary-button" disabled={siteIdentityBusy || !siteIdentityDirty}
                  type="submit"
                >
                  {maintenanceText.siteSave}
                </button>
                <button className="ghost-button settings-reset-button"
                  disabled={siteIdentityBusy}
                  type="button"
                  onClick={() => void resetSiteIdentity()}
                >
                  {maintenanceText.siteReset}
                </button>
              </div>
            </div>
          </form>
          <AdminSkeletonLines loading={siteSettingsLoading} visible={showSiteSettingsSkeleton} />
          </article>

          <article className="source-public-card home-copy-settings-card" {...getAdminLoadingProps(siteSettingsLoading, showSiteSettingsSkeleton)}>
          <div>
            <h3>{maintenanceText.homeSettingsTitle}</h3>
            <p id="home-copy-settings-description">{maintenanceText.homeSettingsDescription}</p>
          </div>
          <form aria-describedby="home-copy-settings-description" className="home-copy-settings-form" onSubmit={saveHomeHeroForm}>
            <div className="home-copy-language-group">
              <h4>{maintenanceText.homeChinese}</h4>
              <label className="source-url-field">
                {maintenanceText.homeTitleTop}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.zh.titleTop}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { titleTop: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.homeTitleBottom}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.zh.titleBottom}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { titleBottom: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field home-copy-description-field">
                {maintenanceText.homeDescription}
                <textarea
                  disabled={homeHeroBusy}
                  maxLength={240}
                  rows={3}
                  value={homeHeroForm.zh.description}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { description: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="home-copy-language-group">
              <h4>{maintenanceText.homeEnglish}</h4>
              <label className="source-url-field">
                {maintenanceText.homeTitleTop}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.en.titleTop}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { titleTop: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.homeTitleBottom}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.en.titleBottom}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { titleBottom: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field home-copy-description-field">
                {maintenanceText.homeDescription}
                <textarea
                  disabled={homeHeroBusy}
                  maxLength={240}
                  rows={3}
                  value={homeHeroForm.en.description}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { description: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="source-public-actions">
              <button className="primary-button" disabled={homeHeroBusy || !homeHeroDirty}
                type="submit"
              >
                {maintenanceText.homeSave}
              </button>
              <button className="ghost-button settings-reset-button"
                disabled={homeHeroBusy}
                type="button"
                onClick={() => void resetHomeHeroSettings()}
              >
                {maintenanceText.homeReset}
              </button>
            </div>
          </form>
          <AdminSkeletonLines loading={siteSettingsLoading} visible={showSiteSettingsSkeleton} />
          </article>

          <article className="source-public-card footer-settings-card" {...getAdminLoadingProps(siteSettingsLoading, showSiteSettingsSkeleton)}>
          <div>
            <h3>{maintenanceText.footerTitle}</h3>
            <p id="footer-settings-description">{maintenanceText.footerDescription}</p>
          </div>
          <form aria-describedby="footer-settings-description footer-json-help" className="footer-settings-form" onSubmit={saveFooterSettingsForm}>
            <label className="source-url-field">
              {maintenanceText.footerIntroLabel}
              <input
                disabled={footerSettingsBusy}
                maxLength={180}
                placeholder={DEFAULT_FOOTER_SETTINGS.description}
                value={footerForm.description}
                onChange={(event) =>
                  updateFooterForm({ description: event.target.value })
                }
              />
            </label>
            <div className="footer-settings-pair">
              <label className="source-url-field">
                {maintenanceText.footerSponsorLabel}
                <input
                  disabled={footerSettingsBusy}
                  maxLength={48}
                  placeholder={DEFAULT_FOOTER_SETTINGS.sponsorLabel}
                  value={footerForm.sponsorLabel}
                  onChange={(event) =>
                    updateFooterForm({ sponsorLabel: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.footerSponsorUrl}
                <input
                  disabled={footerSettingsBusy}
                  inputMode="url"
                  placeholder={DEFAULT_FOOTER_SETTINGS.sponsorUrl}
                  value={footerForm.sponsorUrl}
                  onChange={(event) =>
                    updateFooterForm({ sponsorUrl: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="source-url-field footer-social-links-field">
              {maintenanceText.footerSocialLinks}
              <textarea
                aria-describedby={footerInvalidField === "social" ? "footer-json-help global-operation-status" : "footer-json-help"}
                aria-invalid={footerInvalidField === "social"}
                data-footer-json="social"
                disabled={footerSettingsBusy}
                rows={6}
                value={footerSocialLinksText}
                onChange={(event) => {
                  setFooterSocialLinksText(event.target.value);
                  if (footerInvalidField === "social") setFooterInvalidField(null);
                }}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.footerGroups}
              <textarea
                aria-describedby={footerInvalidField === "groups" ? "footer-json-help global-operation-status" : "footer-json-help"}
                aria-invalid={footerInvalidField === "groups"}
                data-footer-json="groups"
                disabled={footerSettingsBusy}
                rows={8}
                value={footerGroupsText}
                onChange={(event) => {
                  setFooterGroupsText(event.target.value);
                  if (footerInvalidField === "groups") setFooterInvalidField(null);
                }}
              />
            </label>
            <p className="site-icon-choice-help" id="footer-json-help">{maintenanceText.footerJsonHelp}</p>
            <div className="source-public-actions">
              <button className="primary-button" disabled={footerSettingsBusy || !footerSettingsDirty}
                type="submit"
              >
                {maintenanceText.footerSave}
              </button>
              <button className="ghost-button settings-reset-button"
                disabled={footerSettingsBusy}
                type="button"
                onClick={() => void resetFooterSettings()}
              >
                {maintenanceText.footerReset}
              </button>
            </div>
          </form>
          <AdminSkeletonLines loading={siteSettingsLoading} visible={showSiteSettingsSkeleton} />
          </article>
          <LegalSettingsCard
            busy={aboutPageBusy}
            loading={siteSettingsLoading}
            visible={showSiteSettingsSkeleton}
            chineseLabel={maintenanceText.legalChinese}
            content={aboutForm}
            description={maintenanceText.aboutSettingsDescription}
            dirty={aboutPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="about-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                aboutContent: { ...aboutForm, [locale]: value }
              })
            }
            onReset={() => void resetAboutPage()}
            onSubmit={saveAboutPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.aboutSave}
            text={t.markdownEditor}
            title={maintenanceText.aboutSettingsTitle}
          />

          <LegalSettingsCard
            busy={privacyPageBusy}
            loading={siteSettingsLoading}
            visible={showSiteSettingsSkeleton}
            chineseLabel={maintenanceText.legalChinese}
            content={privacyForm}
            description={maintenanceText.privacySettingsDescription}
            dirty={privacyPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="privacy-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                privacyContent: { ...privacyForm, [locale]: value }
              })
            }
            onReset={() => void resetPrivacyPage()}
            onSubmit={savePrivacyPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.privacySave}
            text={t.markdownEditor}
            title={maintenanceText.privacySettingsTitle}
          />

          <LegalSettingsCard
            busy={termsPageBusy}
            loading={siteSettingsLoading}
            visible={showSiteSettingsSkeleton}
            chineseLabel={maintenanceText.legalChinese}
            content={termsForm}
            description={maintenanceText.termsSettingsDescription}
            dirty={termsPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="terms-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                termsContent: { ...termsForm, [locale]: value }
              })
            }
            onReset={() => void resetTermsPage()}
            onSubmit={saveTermsPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.termsSave}
            text={t.markdownEditor}
            title={maintenanceText.termsSettingsTitle}
          />
          </>
          )}
        </div>

        <div
          aria-labelledby="system-settings-tab-services"
          className="system-settings-column system-settings-secondary system-settings-group-panel"
          hidden={activeSettingsGroup !== "services"}
          id="system-settings-panel-services"
          role="tabpanel"
        >
          <div className="integration-settings-stack">
          <article className="source-public-card public-source-card" {...getAdminLoadingProps(sourceSettingsLoading && !sourceSettingsError, showSourceSettingsSkeleton)}>
          {sourceSettingsError ? (
            <AdminSettingsLoadError
              isRetrying={sourceSettingsLoading}
              message={getLocalizedErrorMessage(sourceSettingsError, t)}
              onRetry={() => void loadSourceSettingsCard()}
              retryLabel={maintenanceText.systemRetry}
              title={maintenanceText.publicTitle}
            />
          ) : (
          <>
          <div className="source-card-heading">
            <h3>{maintenanceText.publicTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="public-source-description"
              disabled={sourceSettingsLoading || sourceSettingsSaving}
              disabledLabel={maintenanceText.publicDisabled}
              enabled={publicSourceEnabled}
              enabledLabel={maintenanceText.publicEnabled}
              onChange={() => void togglePublicSource()}
            />
            <p id="public-source-description">{maintenanceText.publicDescription}</p>
          </div>
          <label className="source-url-field">
            <span>{maintenanceText.publicSourceUrlLabel}</span>
            <input
              aria-describedby="public-source-description"
              readOnly
              type="url"
              value={publicSourceUrl}
            />
          </label>
          </>
          )}
          <AdminSkeletonLines loading={sourceSettingsLoading && !sourceSettingsError} visible={showSourceSettingsSkeleton} />
          </article>

          <article className="source-public-card github-submission-card">
            <GitHubSettingsForm
              maintenanceText={maintenanceText}
              onDirtyChange={setGitHubSettingsDirty}
              onStatus={setStatus}
              reloadKey={settingsReloadKey}
              token={token}
              t={t}
            />
          </article>

          <UmamiSettingsCard
            maintenanceText={maintenanceText}
            onDirtyChange={setUmamiSettingsDirty}
            onSettingsChange={onUmamiSettingsChange}
            reloadKey={settingsReloadKey}
            setStatus={setStatus}
            t={t}
            token={token}
          />

          <ImageBedSettingsCard
            maintenanceText={maintenanceText}
            onDirtyChange={setImageBedSettingsDirty}
            reloadKey={settingsReloadKey}
            setStatus={setStatus}
            t={t}
            token={token}
          />

          </div>

          <div className="integration-settings-proxy">
          <TurnstileSettingsCard
            maintenanceText={maintenanceText}
            reloadKey={settingsReloadKey}
            setStatus={setStatus}
            t={t}
            token={token}
          />
          <RssHubSettingsCard
            maintenanceText={maintenanceText}
            onDirtyChange={setRssHubSettingsDirty}
            reloadKey={settingsReloadKey}
            setStatus={setStatus}
            t={t}
            token={token}
          />
          <article className="source-public-card ai-settings-card" {...getAdminLoadingProps(adminAiSettingsLoading && !adminAiSettingsLoadError)}>
          {adminAiSettingsLoadError ? (
            <AdminSettingsLoadError
              isRetrying={adminAiSettingsLoading}
              message={getLocalizedErrorMessage(adminAiSettingsLoadError, t)}
              onRetry={() => void onReloadAdminAiSettings()}
              retryLabel={maintenanceText.systemRetry}
              title={maintenanceText.aiTitle}
            />
          ) : (
            <>
              <div className="source-card-heading">
                <h3>{maintenanceText.aiTitle}</h3>
                <SettingsStatusBadge
                  ariaDescribedBy="ai-settings-description ai-settings-configuration"
                  disabled={adminAiSettingsSaving || !adminAiSettings.available}
                  disabledLabel={adminAiSettings.available
                    ? maintenanceText.aiDisabled
                    : maintenanceText.serviceUnavailable}
                  enabled={adminAiSettings.enabled}
                  enabledLabel={maintenanceText.aiEnabled}
                  onChange={toggleAdminAi}
                />
                <p id="ai-settings-description">{maintenanceText.aiDescription}</p>
                <div className="turnstile-config-help" id="ai-settings-configuration">
                  <span><code>AI</code>{` = ${maintenanceText.aiBindingLabel}`}</span>
                </div>
              </div>
              <form
                aria-describedby="ai-settings-description ai-settings-configuration"
                className="proxy-settings-form"
                onSubmit={saveAdminAiForm}
              >
                <label className="source-url-field">
                  {maintenanceText.aiModelLabel}
                  <select
                    disabled={adminAiSettingsSaving || !adminAiSettings.available}
                    onChange={(event) => setAdminAiModel(
                      event.target.value as AdminAiSettings["model"]
                    )}
                    value={adminAiModel}
                  >
                    {ADMIN_AI_MODELS.map((model, index) => (
                      <option key={model} value={model}>
                        {index === 0
                          ? maintenanceText.aiModelDefault
                          : maintenanceText.aiModelLlama}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="source-public-actions">
                  <button className="ghost-button" disabled={adminAiSettingsSaving || !adminAiSettingsDirty}
                    type="submit"
                  >
                    {maintenanceText.aiSave}
                  </button>
                </div>
              </form>
            </>
          )}
          <AdminSkeletonLines loading={adminAiSettingsLoading && !adminAiSettingsLoadError} />
          </article>
          <TelegramSettingsCard
            locale={locale}
            maintenanceText={maintenanceText}
            onDirtyChange={setTelegramSettingsDirty}
            onReload={onReloadTelegramSettings}
            onSettingsChange={onTelegramSettingsChange}
            setStatus={setStatus}
            settings={telegramSettings}
            settingsError={telegramSettingsLoadError}
            loading={telegramSettingsLoading}
            t={t}
            token={token}
          />
          <article className="source-public-card proxy-settings-card" {...getAdminLoadingProps(proxySettingsLoading && !proxySettingsError, showProxySettingsSkeleton)}>
          {proxySettingsError ? (
            <AdminSettingsLoadError
              isRetrying={proxySettingsLoading}
              message={getLocalizedErrorMessage(proxySettingsError, t)}
              onRetry={() => void loadProxySettingsCard()}
              retryLabel={maintenanceText.systemRetry}
              title={maintenanceText.proxyTitle}
            />
          ) : (
          <>
          <div className="source-card-heading">
            <h3>{maintenanceText.proxyTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="proxy-settings-description proxy-settings-help"
              disabled={
                proxySaving ||
                (!proxyEnabled && !hasSavedProxyConfig)
              }
              disabledLabel={hasSavedProxyConfig
                ? maintenanceText.proxyDisabled
                : maintenanceText.serviceUnavailable}
              enabled={proxyEnabled}
              enabledLabel={maintenanceText.proxyEnabled}
              onChange={toggleProxy}
            />
            <p id="proxy-settings-description">{maintenanceText.proxyDescription}</p>
          </div>
          <form
            aria-describedby="proxy-settings-description proxy-settings-help"
            className="proxy-settings-form"
            onSubmit={saveProxyForm}
          >
            <label className="source-url-field">
              {maintenanceText.proxyUrlLabel}
              <input
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    baseUrl: event.target.value
                  })
                }
                placeholder={maintenanceText.proxyPlaceholder}
                type="url"
                value={proxyForm.baseUrl}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.proxyScopeLabel}
              <select
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    scope: normalizeProxyScope(event.target.value)
                  })
                }
                value={normalizeProxyScope(proxyForm.scope)}
              >
                <option value="all">{maintenanceText.proxyScopeAll}</option>
                <option value="images">{maintenanceText.proxyScopeImages}</option>
              </select>
            </label>
            <label className="source-url-field">
              {maintenanceText.proxyModeLabel}
              <select
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    mode: normalizeProxyMode(event.target.value)
                  })
                }
                value={normalizeProxyMode(proxyForm.mode)}
              >
                <option value="prefix">{maintenanceText.proxyModePrefix}</option>
                <option value="edgeone-proxy">
                  {maintenanceText.proxyModeEdgeOneProxy}
                </option>
                <option value="edgeone-advanced">
                  {maintenanceText.proxyModeEdgeOneAdvanced}
                </option>
              </select>
            </label>
            <div className="proxy-settings-help" id="proxy-settings-help">
              <p>{maintenanceText.proxyHelp}</p>
              <a
                className="proxy-project-link"
                href={EDGEONE_PROXY_PROJECT_URL}
                rel="noreferrer"
                target="_blank"
              >
                {maintenanceText.proxyProjectLink}
              </a>
            </div>
            <div className="source-public-actions">
              <button className="ghost-button" disabled={proxySaving || !proxySettingsDirty}
                type="submit"
              >
                {maintenanceText.proxySave}
              </button>
            </div>
          </form>
          </>
          )}
          <AdminSkeletonLines loading={proxySettingsLoading && !proxySettingsError} visible={showProxySettingsSkeleton} />
          </article>
          </div>
        </div>

        <div
          aria-labelledby="system-settings-tab-management"
          className="system-settings-column system-settings-secondary system-settings-group-panel"
          hidden={activeSettingsGroup !== "management"}
          id="system-settings-panel-management"
          role="tabpanel"
        >
          <div className="security-settings-stack">
          <SecuritySettingsCard
            maintenanceText={maintenanceText}
            onDirtyChange={setSecuritySettingsDirty}
            onLoadingChange={setSecuritySettingsLoading}
            onTokenChange={onTokenChange}
            reloadKey={settingsReloadKey}
            setStatus={setStatus}
            t={t}
            token={token}
          />

          <article className="source-public-card factory-reset-card" {...getAdminLoadingProps(securitySettingsLoading, showSecuritySettingsSkeleton)}>
          <div>
            <h3>{maintenanceText.resetTitle}</h3>
            <p id="factory-reset-description">{maintenanceText.resetDescription}</p>
            <p id="factory-reset-warning">{maintenanceText.resetWarning}</p>
          </div>
          <div className="source-public-actions">
            <button aria-describedby="factory-reset-description factory-reset-warning"
              className="primary-button" disabled={factoryResetting}
              type="button"
              onClick={requestFactoryReset}
            >
              {maintenanceText.resetButton}
            </button>
          </div>
          <AdminSkeletonLines loading={securitySettingsLoading} visible={showSecuritySettingsSkeleton} />
          </article>
          </div>

          <div className="security-settings-backup">
          <article className="source-public-card backup-restore-card" {...getAdminLoadingProps(securitySettingsLoading, showSecuritySettingsSkeleton)}>
          <div>
            <h3>{maintenanceText.backupTitle}</h3>
            <p id="backup-settings-description">{maintenanceText.backupDescription}</p>
            <p id="backup-settings-help">{maintenanceText.backupHelp}</p>
          </div>
          {backupFileName ? <code>{backupFileName}</code> : null}
          <span aria-live="polite" className="visually-hidden" id="backup-file-status">
            {backupFileName}
          </span>
          <div className="source-public-actions">
            <button aria-describedby="backup-settings-description backup-settings-help"
              className="primary-button" disabled={backupExporting || backupRestoring}
              type="button"
              onClick={() => void exportBackup()}
            >
              {maintenanceText.backupExport}
            </button>
            <label aria-describedby="backup-settings-description backup-settings-help backup-file-status global-operation-status" className="ghost-button backup-file-picker">
              {maintenanceText.backupChoose}
              <input
                accept="application/json,.json"
                aria-describedby="backup-settings-description backup-settings-help backup-file-status global-operation-status"
                aria-invalid={backupFileInvalid}
                type="file"
                onChange={handleBackupFile}
              />
            </label>
            <button aria-describedby="backup-settings-description backup-settings-help"
              className="ghost-button" disabled={!backupPayload || backupExporting || backupRestoring}
              type="button"
              onClick={() => {
                if (!backupPayload) {
                  setStatus(maintenanceText.backupEmpty);
                  return;
                }

                requestBackupRestore();
              }}
            >
              {maintenanceText.backupRestore}
            </button>
          </div>
          <AdminSkeletonLines loading={securitySettingsLoading} visible={showSecuritySettingsSkeleton} />
          </article>
          </div>
        </div>
      </div>

      {pendingDiscardAction ? (
        <AdminConfirmDialog
          cancelLabel={maintenanceText.unsavedStay}
          closeLabel={t.actions.close}
          confirmLabel={maintenanceText.unsavedLeave}
          descriptionId="unsaved-settings-dialog-description"
          description={maintenanceText.unsavedDescription}
          title={maintenanceText.unsavedTitle}
          onCancel={() => setPendingDiscardAction(null)}
          onConfirm={() => {
            setPendingDiscardAction(null);
            setPendingBackupRestore(true);
          }}
        />
      ) : null}

      {pendingBackupRestore ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="backup-restore-dialog-description"
          description={
            backupPayload
              ? maintenanceText.backupRestoreConfirm(backupPayload.counts)
              : maintenanceText.backupEmpty
          }
          title={maintenanceText.backupTitle}
          disabled={backupRestoring}
          onCancel={() => {
            if (!backupRestoring) {
              setPendingBackupRestore(false);
            }
          }}
          onConfirm={() => void restoreBackup()}
        />
      ) : null}

      {pendingFactoryReset ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="factory-reset-dialog-description"
          description={maintenanceText.resetConfirm}
          title={maintenanceText.resetTitle}
          disabled={factoryResetting}
          onCancel={() => {
            if (!factoryResetting) {
              setPendingFactoryReset(false);
            }
          }}
          onConfirm={() => void factoryReset()}
        />
      ) : null}
      </section>
    </>
  );
}

type AdminMaintenanceSection = "import-export" | "link-check";

function AdminLinkCheckPanel({
  isLoadingTools,
  maintenanceText,
  onReloadTools,
  proxySettings,
  section,
  setStatus,
  t,
  token,
  tools
}: {
  isLoadingTools: boolean;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onReloadTools: (resultMessage?: string) => Promise<AdminRefreshResult>;
  proxySettings: ProxySettings;
  section: AdminMaintenanceSection;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
  tools: Tool[];
}) {
  const [timeoutSeconds, setTimeoutSeconds] = useState(6);
  const [batchSize, setBatchSize] = useState(4);
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SOURCE_URL);
  const [sourceMode, setSourceMode] = useState<ToolImportMode>("skip");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceItems, setSourceItems] = useState<unknown[] | null>(null);
  const [checkedSourceKey, setCheckedSourceKey] = useState("");
  const [sourceChecking, setSourceChecking] = useState(false);
  const [sourceImporting, setSourceImporting] = useState(false);
  const [sourceExporting, setSourceExporting] = useState(false);
  const [results, setResults] = useState<LinkCheckResult[]>([]);
  const [activeFilter, setActiveFilter] = useState("abnormal");
  const [checking, setChecking] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const stopRequested = useRef(false);

  const targets = useMemo(() => buildLinkCheckTargets(tools), [tools]);
  const toolById = useMemo(
    () => new Map(tools.map((tool) => [tool.id, tool])),
    [tools]
  );
  const sourcePreview = useMemo(
    () =>
      sourceItems
        ? createSourcePreview(sourceItems, tools, sourceMode, maintenanceText)
        : null,
    [maintenanceText, sourceItems, sourceMode, tools]
  );
  const displayedSourcePreview = sourcePreview ?? {
    total: 0,
    valid: 0,
    duplicateInSource: 0,
    duplicateInSite: 0,
    invalid: 0,
    willCreate: 0,
    willUpdate: 0,
    willSkip: 0
  };
  const totalCount = targets.length;
  const checkedCount = results.length;
  const normalCount = results.filter((result) => result.ok).length;
  const abnormalCount = results.filter((result) => !result.ok).length;
  const networkErrorCount = results.filter((result) => result.status === 0).length;
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;
  const completed = totalCount > 0 && checkedCount === totalCount && !checking;
  const statusItems = useMemo(() => {
    const counts = new Map<number, number>();

    for (const result of results.filter((item) => !item.ok)) {
      counts.set(result.status, (counts.get(result.status) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([left], [right]) => left - right)
      .map(([status, count]) => ({
        status,
        count,
        value: `status:${status}`
      }));
  }, [results]);
  const filteredResults = useMemo(() => {
    if (activeFilter === "all") {
      return results;
    }

    if (activeFilter === "abnormal") {
      return results.filter((result) => !result.ok);
    }

    if (activeFilter.startsWith("status:")) {
      const status = Number(activeFilter.replace("status:", ""));
      return results.filter((result) => result.status === status);
    }

    return results;
  }, [activeFilter, results]);
  const emptyMessage = !results.length
    ? t.linkCheck.emptyNotStarted
    : completed && activeFilter === "abnormal" && abnormalCount === 0
      ? t.linkCheck.emptyNoBrokenLinks
      : t.linkCheck.emptyNoMatchingResults;
  const showToolsLoadingSkeleton = useLoadingSkeleton(isLoadingTools);

  function getSourceFileKey(file: File) {
    return `file:${file.name}:${file.size}:${file.lastModified}`;
  }

  function getSourceOriginLabel() {
    return sourceFile
      ? maintenanceText.sourceFileOrigin(sourceFile.name)
      : maintenanceText.sourceUrlOrigin;
  }

  async function readSelectedSource(url = sourceUrl) {
    if (sourceFile) {
      return {
        items: await readToolSourceFile(sourceFile, maintenanceText),
        key: getSourceFileKey(sourceFile),
        url: ""
      };
    }

    const nextUrl = normalizeSourceUrl(url);
    return {
      items: await fetchToolSource(nextUrl, maintenanceText),
      key: `url:${nextUrl}`,
      url: nextUrl
    };
  }

  async function checkSource(url = sourceUrl) {
    setSourceChecking(true);
    setStatus("");

    try {
      const selected = await readSelectedSource(url);
      const preview = createSourcePreview(selected.items, tools, sourceMode, maintenanceText);
      if (selected.url) setSourceUrl(selected.url);
      setSourceItems(selected.items);
      setCheckedSourceKey(selected.key);
      setStatus(maintenanceText.sourceChecked(getSourceOriginLabel(), preview.total));
    } catch (error) {
      setStatus(getSourceErrorMessage(error, maintenanceText, t));
      setSourceItems(null);
      setCheckedSourceKey("");
    } finally {
      setSourceChecking(false);
    }
  }

  async function importSource() {
    setSourceImporting(true);
    setStatus("");

    try {
      const activeKey = sourceFile
        ? getSourceFileKey(sourceFile)
        : `url:${normalizeSourceUrl(sourceUrl)}`;
      const selected = sourceItems && checkedSourceKey === activeKey
        ? { items: sourceItems, key: activeKey, url: sourceFile ? "" : normalizeSourceUrl(sourceUrl) }
        : await readSelectedSource();
      const items = selected.items;
      const result = await importTools(items, sourceMode, token);
      if (selected.url) setSourceUrl(selected.url);
      setSourceItems(items);
      setCheckedSourceKey(selected.key);
      await onReloadTools(maintenanceText.sourceImportSummary(getSourceOriginLabel(), result));
    } catch (error) {
      setStatus(getSourceErrorMessage(error, maintenanceText, t));
    } finally {
      setSourceImporting(false);
    }
  }

  async function selectSourceFile(file: File) {
    setSourceChecking(true);
    setStatus("");

    try {
      const items = await readToolSourceFile(file, maintenanceText);
      const preview = createSourcePreview(items, tools, sourceMode, maintenanceText);
      setSourceFile(file);
      setSourceItems(items);
      setCheckedSourceKey(getSourceFileKey(file));
      setStatus(maintenanceText.sourceFileChecked(file.name, preview.total));
    } catch (error) {
      setSourceFile(null);
      setSourceItems(null);
      setCheckedSourceKey("");
      setStatus(getSourceErrorMessage(error, maintenanceText, t));
    } finally {
      setSourceChecking(false);
    }
  }

  function clearSourceFile() {
    setSourceFile(null);
    setSourceItems(null);
    setCheckedSourceKey("");
    setStatus("");
  }

  async function exportSource() {
    setSourceExporting(true);
    setStatus("");

    try {
      const source = await exportToolSourceData(token);
      downloadTextFile(
        createDatedExportFilename("tools", "json"),
        JSON.stringify(source, null, 2),
        "application/json;charset=utf-8"
      );
      setStatus(maintenanceText.sourceExported(source.length));
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setSourceExporting(false);
    }
  }

  async function reloadLinks() {
    if (checking) {
      return;
    }

    setLoadingLinks(true);
    setStatus("");

    try {
      if (await onReloadTools() !== "success") return;
      setResults([]);
      setWasStopped(false);
      setActiveFilter("abnormal");
      setStatus(t.linkCheck.messages.reloaded);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setLoadingLinks(false);
    }
  }

  async function startCheck() {
    if (checking) {
      return;
    }

    const nextTimeout = clampInteger(timeoutSeconds, 1, 9, 6);
    const nextBatchSize = clampInteger(batchSize, 1, 10, 4);

    setTimeoutSeconds(nextTimeout);
    setBatchSize(nextBatchSize);

    if (!targets.length) {
      setStatus(t.linkCheck.messages.empty);
      return;
    }

    setChecking(true);
    setWasStopped(false);
    setResults([]);
    setActiveFilter("abnormal");
    setStatus("");
    stopRequested.current = false;

    try {
      for (let index = 0; index < targets.length; index += nextBatchSize) {
        if (stopRequested.current) {
          break;
        }

        const batch = targets.slice(index, index + nextBatchSize);

        try {
          const response = await checkLinks(batch, nextTimeout, token);
          setResults((current) => [...current, ...response.results]);
        } catch (error) {
          setResults((current) => [
            ...current,
            ...buildFailedLinkCheckResults(
              batch,
              error,
              getLocalizedErrorMessage(error, t)
            )
          ]);

          if (getErrorMessage(error).toLowerCase().includes("unauthorized")) {
            break;
          }
        }
      }

      const stopped = stopRequested.current;
      setWasStopped(stopped);
      setStatus(stopped ? t.linkCheck.messages.stopped : t.linkCheck.messages.completed);
    } finally {
      setChecking(false);
      stopRequested.current = false;
    }
  }

  function stopCheck() {
    stopRequested.current = true;
  }

  function clearResults() {
    setResults([]);
    setWasStopped(false);
    setActiveFilter("abnormal");
  }

  function exportResults() {
    const rows = results.filter((result) => !result.ok);

    if (!rows.length) {
      return;
    }

    const csv = createCsv([
      [
        "tool",
        "type",
        "url",
        "status",
        "result",
        "error",
        "duration",
        "checkedAt"
      ],
      ...rows.map((result) => [
        result.name,
        result.kind === "demoUrl"
          ? t.linkCheck.linkTypeDemo
          : t.linkCheck.linkTypeOfficial,
        result.url,
        result.status,
        getLinkCheckResultText(result, t),
        result.error ?? "",
        result.duration,
        result.checkedAt
      ])
    ]);
    downloadTextFile(
      createDatedExportFilename("link-check", "csv"),
      `\ufeff${csv}`,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <section
      className="admin-link-check"
      aria-label={
        section === "import-export"
          ? maintenanceText.importExportTab
          : maintenanceText.linkCheckTab
      }
    >
      {section === "import-export" ? (
        <section className="admin-maintenance-panel">
          <section className="source-import-panel">
        <div className="source-import-main" {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <div className="link-check-heading">
            <h2>{maintenanceText.sourceTitle}</h2>
            <p>{maintenanceText.sourceDescription}</p>
          </div>

          <label className="source-url-field">
            <span>{maintenanceText.sourceUrl}</span>
            <input
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);
                setSourceFile(null);
                setSourceItems(null);
                setCheckedSourceKey("");
                setStatus("");
              }}
              placeholder={maintenanceText.sourcePlaceholder}
            />
          </label>

          <div className="source-mode-row source-file-field">
            <span>{maintenanceText.sourceFileLabel}</span>
            <div className="source-action-row source-file-actions">
              <label className="ghost-button backup-file-picker">
                {sourceFile
                  ? maintenanceText.sourceFileReplace
                  : maintenanceText.sourceFileChoose}
                <input
                  accept="application/json,.json"
                  disabled={sourceChecking || sourceImporting || sourceExporting}
                  type="file"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void selectSourceFile(file);
                  }}
                />
              </label>
              {sourceFile ? (
                <button className="ghost-button" disabled={sourceChecking || sourceImporting || sourceExporting}
                  type="button"
                  onClick={clearSourceFile}
                >
                  {maintenanceText.sourceFileRemove}
                </button>
              ) : null}
            </div>
            <small>
              {sourceFile
                ? maintenanceText.sourceFileSelected(sourceFile.name)
                : maintenanceText.sourceFileHelp}
            </small>
          </div>

          <div className="source-mode-row" aria-label={maintenanceText.sourceMode}>
            <span>{maintenanceText.sourceMode}</span>
            <BooleanSegmentedToggle
              enabledLabel={maintenanceText.sourceModeSkip}
              disabledLabel={maintenanceText.sourceModeUpsert}
              value={sourceMode === "skip"}
              onChange={(skip) => setSourceMode(skip ? "skip" : "upsert")}
            />
            <small>{maintenanceText.sourceModeHelp}</small>
          </div>

          <div className="source-action-row">
            <button className="ghost-button" disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void checkSource()}
            >
              {maintenanceText.sourceDetect}
            </button>
            <button className="primary-button" disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void importSource()}
            >
              {maintenanceText.sourceImport}
            </button>
          </div>

          <div className="source-report-grid" aria-live="polite">
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceTotal}</span>
              <strong>{displayedSourcePreview.total}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceValid}</span>
              <strong>{displayedSourcePreview.valid}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceDuplicate}</span>
              <strong>{displayedSourcePreview.duplicateInSource}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceExisting}</span>
              <strong>{displayedSourcePreview.duplicateInSite}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceMissing}</span>
              <strong>{displayedSourcePreview.invalid}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceWillCreate}</span>
              <strong>{displayedSourcePreview.willCreate}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceWillUpdate}</span>
              <strong>{displayedSourcePreview.willUpdate}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceWillSkip}</span>
              <strong>{displayedSourcePreview.willSkip}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
          </div>

          {sourcePreview?.errors.length ? (
            <div className="source-error-list">
              <strong>{maintenanceText.sourceErrors}</strong>
              {sourcePreview.errors
                .slice(0, SOURCE_PREVIEW_ERROR_LIMIT)
                .map((error) => (
                  <span key={`${error.index}-${error.message}`}>
                    {maintenanceText.sourceErrorItem(error.index, error.message)}
                  </span>
                ))}
            </div>
          ) : null}

          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} />
        </div>

        <div className="source-import-main source-export-card" {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <div className="link-check-heading">
            <h2>{maintenanceText.sourceExportTitle}</h2>
            <p>{maintenanceText.sourceExportDescription}</p>
          </div>
          <div className="source-report-grid source-export-summary">
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceExportCount}</span>
              <strong>{tools.length}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceExportFormat}</span>
              <strong>JSON</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
            <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
              <span>{maintenanceText.sourceExportScope}</span>
              <strong>{maintenanceText.sourceExportScopeAll}</strong>
              <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
            </div>
          </div>
          <div className="source-action-row">
            <button className="primary-button" disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void exportSource()}
            >
              {maintenanceText.sourceExport}
            </button>
          </div>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} />
        </div>
      </section>

        </section>
      ) : (
        <section className="admin-maintenance-panel admin-maintenance-link-panel">

      <div className="link-check-hero" {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
        <div className="link-check-heading">
          <h2>{maintenanceText.linkModuleTitle}</h2>
          <p>{maintenanceText.linkModuleDescription}</p>
        </div>

        <div className="link-check-config">
          <label className="link-check-field">
            <span>{t.linkCheck.timeout}</span>
            <input
              disabled={checking}
              max={9}
              min={1}
              onChange={(event) => setTimeoutSeconds(event.target.valueAsNumber)}
              step={1}
              type="number"
              value={Number.isFinite(timeoutSeconds) ? timeoutSeconds : ""}
            />
            <small>{t.linkCheck.timeoutHelp}</small>
          </label>
          <label className="link-check-field">
            <span>{t.linkCheck.batchSize}</span>
            <input
              disabled={checking}
              max={10}
              min={1}
              onChange={(event) => setBatchSize(event.target.valueAsNumber)}
              step={1}
              type="number"
              value={Number.isFinite(batchSize) ? batchSize : ""}
            />
            <small>{t.linkCheck.batchSizeHelp}</small>
          </label>
        </div>

        <div className="link-check-actions">
          <button className="primary-button" disabled={checking || loadingLinks || totalCount === 0}
            onClick={() => void startCheck()}
            type="button"
          >
            {t.linkCheck.start}
          </button>
          <button className="ghost-button danger-action"
            disabled={!checking}
            onClick={stopCheck}
            type="button"
          >
            {t.linkCheck.stop}
          </button>
          <button className="ghost-button" disabled={checking || loadingLinks}
            onClick={() => void reloadLinks()}
            type="button"
          >
            {t.linkCheck.reload}
          </button>
          <button className="ghost-button" disabled={checking || !results.length}
            onClick={clearResults}
            type="button"
          >
            {t.linkCheck.clear}
          </button>
          <button className="ghost-button" disabled={checking || abnormalCount === 0}
            onClick={exportResults}
            type="button"
          >
            {t.linkCheck.exportCsv}
          </button>
        </div>
        <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} />
      </div>

      <div className="link-check-stats" aria-label={t.linkCheck.progressTitle}>
        <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <span>{t.linkCheck.total}</span>
          <strong>{totalCount}</strong>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
        </div>
        <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <span>{t.linkCheck.checked}</span>
          <strong>{checkedCount}</strong>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
        </div>
        <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <span>{t.linkCheck.normal}</span>
          <strong>{normalCount}</strong>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
        </div>
        <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <span>{t.linkCheck.abnormal}</span>
          <strong>{abnormalCount}</strong>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
        </div>
        <div {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
          <span>{t.linkCheck.networkError}</span>
          <strong>{networkErrorCount}</strong>
          <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} compact />
        </div>
      </div>

      <section className="link-check-progress" {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
        <div className="link-check-progress-head">
          <div>
            <h3>{t.linkCheck.progressTitle}</h3>
            <p>
              {wasStopped
                ? t.linkCheck.progressStopped
                : t.linkCheck.progressText(checkedCount, totalCount)}
            </p>
          </div>
          <strong>{progress}%</strong>
        </div>
        <div className="link-check-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} />
      </section>

      <section className="link-check-results" {...getAdminLoadingProps(isLoadingTools, showToolsLoadingSkeleton)}>
        <div className="link-check-results-head">
          <div>
            <h3>{t.linkCheck.resultsTitle}</h3>
            <p>{t.linkCheck.resultsDescription}</p>
          </div>
        </div>

        <div className="link-check-tabs" role="group" aria-label={t.linkCheck.resultsTitle}>
          <button aria-pressed={activeFilter === "abnormal"} className={activeFilter === "abnormal" ? "is-active" : ""}
            onClick={() => setActiveFilter("abnormal")}
            type="button"
          >
            {t.linkCheck.tabsAbnormal(abnormalCount)}
          </button>
          {statusItems.map((item) => (
            <button aria-pressed={activeFilter === item.value} className={activeFilter === item.value ? "is-active" : ""}
              key={item.value}
              onClick={() => setActiveFilter(item.value)}
              type="button"
            >
              {t.linkCheck.tabsStatus(item.status, item.count)}
            </button>
          ))}
          <button aria-pressed={activeFilter === "all"} className={activeFilter === "all" ? "is-active" : ""}
            onClick={() => setActiveFilter("all")}
            type="button"
          >
            {t.linkCheck.tabsAll(results.length)}
          </button>
        </div>

        {filteredResults.length === 0 ? (
          <div aria-busy={checking} className="link-check-empty-state">
            {emptyMessage}
          </div>
        ) : (
          <div aria-busy={checking} className="link-check-table-wrap">
            <table className="link-check-table">
            <thead>
              <tr>
                <th>{t.linkCheck.tableTool}</th>
                <th>{t.linkCheck.tableType}</th>
                <th>{t.linkCheck.tableUrl}</th>
                <th>{t.linkCheck.tableStatusCode}</th>
                <th>{t.linkCheck.tableResult}</th>
                <th>{t.linkCheck.tableDuration}</th>
                <th>{t.linkCheck.tableError}</th>
                <th>{t.linkCheck.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => {
                  const relatedTool = toolById.get(result.id);
                  const relatedToolUrl = relatedTool?.url ?? "";
                  const targetLabel =
                    result.kind === "demoUrl"
                      ? maintenanceText.demoUrlLabel
                      : maintenanceText.urlLabel;
                  const secondaryTargetLabel = maintenanceText.urlLabel;
                  const showToolUrl =
                    result.kind === "demoUrl" &&
                    Boolean(relatedToolUrl) &&
                    normalizeUrlForImport(relatedToolUrl) !==
                      normalizeUrlForImport(result.url);

                  return (
                    <tr key={`${result.id}-${result.kind}-${result.checkedAt}-${index}`}>
                      <td>
                        <strong>{result.name || result.id}</strong>
                      </td>
                      <td>
                        <span className="link-check-type-label">
                          {result.kind === "demoUrl"
                            ? t.linkCheck.linkTypeDemo
                            : t.linkCheck.linkTypeOfficial}
                        </span>
                      </td>
                      <td>
                        <span className="link-check-url" title={result.url}>
                          {result.url || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={getLinkCheckPillClass(result)}>
                          {result.status}
                        </span>
                      </td>
                      <td>
                        <span className={getLinkCheckPillClass(result)}>
                          {getLinkCheckResultText(result, t)}
                        </span>
                      </td>
                      <td>
                        <span className="link-check-duration">
                          {t.linkCheck.durationMs(result.duration)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="link-check-error-text"
                          title={getLinkCheckErrorText(result, t)}
                        >
                          {getLinkCheckErrorText(result, t)}
                        </span>
                      </td>
                      <td>
                        <div className="link-check-action-buttons">
                          {showToolUrl ? (
                            <a className="ghost-button link-check-open-link"
                              href={proxifyUrl(relatedToolUrl, proxySettings)}
                              aria-label={secondaryTargetLabel}
                              rel="noreferrer"
                              target="_blank"
                              title={secondaryTargetLabel}
                            >
                              <span>{secondaryTargetLabel}</span>
                            </a>
                          ) : null}
                          {result.url ? (
                            <a className="ghost-button link-check-open-link"
                              href={proxifyUrl(result.url, proxySettings)}
                              aria-label={targetLabel}
                              rel="noreferrer"
                              target="_blank"
                              title={targetLabel}
                            >
                              <span>{targetLabel}</span>
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            </table>
          </div>
        )}
        <AdminSkeletonLines loading={isLoadingTools} visible={showToolsLoadingSkeleton} />
      </section>
        </section>
      )}
    </section>
  );
}

function getLinkCheckResultText(result: LinkCheckResult, t: Messages) {
  if (result.status === 0) {
    return t.linkCheck.resultNetworkError;
  }

  return result.ok ? t.linkCheck.resultNormal : t.linkCheck.resultAbnormal;
}

function getLinkCheckErrorText(result: LinkCheckResult, t: Messages) {
  if (!result.error) return "-";
  return result.status === 0 ? t.errors.networkError : result.error;
}

function getLinkCheckPillClass(result: LinkCheckResult) {
  if (result.status === 0) {
    return "link-check-result-pill is-network";
  }

  return result.ok
    ? "link-check-result-pill is-ok"
    : "link-check-result-pill is-error";
}
