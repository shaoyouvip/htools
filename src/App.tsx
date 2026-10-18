import {
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  Boxes,
  CircleAlert,
  Clock3,
  Coffee,
  FileText,
  Facebook,
  Github,
  House,
  Instagram,
  LayoutDashboard,
  Link2,
  Linkedin,
  LogIn,
  Mail,
  Menu,
  MessageCircle,
  PackagePlus,
  PanelLeft,
  Rss,
  Search,
  Send,
  Sparkles,
  Star,
  Twitter,
  UserRound,
  Wrench,
  X,
  Youtube
} from "lucide-react";
import {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  ReactNode,
  Suspense,
  createContext,
  lazy,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  cleanArticleDisplayText,
  getArticleDisplayTitle,
  getArticleText
} from "./article-helpers";
import {
  createToolPreviewSource,
  getCategoryLabel,
  getToolInitials,
  isValidHttpUrl,
  normalizeHttpUrlInput,
  parseArticleTagsInput,
  usesGitHubOpenGraphPreview
} from "./tool-helpers";
import { useLoadingSkeleton } from "./useLoadingSkeleton";
import { useOverlayFocusManagement } from "./useOverlayFocusManagement";
import { useVisualViewportKeyboard } from "./useVisualViewportKeyboard";
import { useUtilityMenuKeyboard } from "./useUtilityMenuKeyboard";
import { usePointerFocusRelease } from "./usePointerFocusRelease";
import {
  CompactTagRow,
  PublicGlowAction,
  SiteBrandIdentity,
  SiteSettingsContext,
  SkeletonVisibility,
  useSiteSettings
} from "./shared-ui";
import UtilityMenuControls, {
  type UtilityMenuController
} from "./components/UtilityMenuControls";
import ArticleDetailContent, {
  ArticleBodySkeleton,
  ArticleDetailContentSkeleton
} from "./components/ArticleDetailContent";
import { CategoryRail, DirectoryPagination } from "./components/PublicDirectoryControls";
import { PublicLoadError } from "./components/PublicLoadError";
import { createEmptyCategoryIconSettings, normalizeCategoryIconSettings, type CategoryIconSettings } from "./category-icon-settings";
import {
  DEFAULT_SITE_SETTINGS,
  createArticleStructuredData,
  createWebsiteStructuredData,
  formatPublicDocumentTitle,
  getAboutContentSettings,
  getEditableSiteSettings,
  getLocalizedErrorMessage,
  getLocalizedFooterSettings,
  getLocalizedHomeHeroContent,
  getLegalContentSettings,
  getSiteDisplayName,
  getSiteDocumentTitle,
  syncDocumentMetadata,
  syncDocumentRobots,
  syncSiteFavicon
} from "./site-helpers";
import {
  loadArticle,
  loadArticles,
  loadPublicCategoryData,
  loadProxySettings,
  loadSiteConfiguration,
  loadTools,
  searchPublicArticles,
  searchPublicTools
} from "./public-api";
import {
  getLocaleOption,
  resolveLocale,
  translations,
  type Locale,
  type Messages
} from "./i18n";
import type { LegalPageKind } from "./legal-content";
import {
  DEFAULT_PROXY_MODE,
  DEFAULT_PROXY_SCOPE,
  normalizeProxyBaseUrl,
  normalizeProxyMode,
  normalizeProxyScope,
  proxifyUrl
} from "./proxy";
import type {
  AdminCategorySettings,
  Article,
  ArticleSummary,
  ProxySettings,
  SiteSettings,
  Tool,
  UmamiSettings
} from "./types";
import {
  ADMIN_FEATURED_CATEGORY,
  formatAdminDate,
  getAdminPath,
  initialAdminCategorySettings,
  isAllCategoryValue,
  isFeaturedCategoryValue,
  normalizeAdminCategoryValue,
  normalizeUrlForImport,
  sortCategoriesBySettings,
  type ThemeMode,
  type ToastInput
} from "./admin-helpers";
import SubmitPageContent from "./SubmitPage";
import { ToastContext } from "./toast-context";

const MarkdownContent = lazy(() => import("./components/MarkdownContent"));
const AdminApp = lazy(() => import("./AdminApp"));

const UMAMI_SCRIPT_SELECTOR = 'script[data-htools-umami="true"]';
const NO_INDEX_ROBOTS = "noindex, nofollow, noarchive";
const INDEX_ROBOTS = "index,follow";
const DISABLED_UMAMI_SETTINGS: UmamiSettings = {
  enabled: false,
  scriptUrl: "",
  websiteId: ""
};

type ToastTone = "success" | "error" | "info";

type GlobalToast = {
  id: number;
  message: string;
  tone: ToastTone;
};

function preventCardDrag(event: ReactDragEvent<HTMLElement>) {
  event.preventDefault();
}

function blurActivatedLink(event: ReactMouseEvent<HTMLAnchorElement>) {
  event.currentTarget.blur();
}

const SITE_SETTINGS_CACHE_KEY = "htools_site_settings_cache";
function readCachedSiteSettings() {
  try {
    const value = localStorage.getItem(SITE_SETTINGS_CACHE_KEY);

    if (!value) {
      return null;
    }

    return getEditableSiteSettings(JSON.parse(value) as SiteSettings);
  } catch {
    return null;
  }
}

function writeCachedSiteSettings(settings: SiteSettings) {
  try {
    localStorage.setItem(
      SITE_SETTINGS_CACHE_KEY,
      JSON.stringify(getEditableSiteSettings(settings))
    );
  } catch {
    // Cache is only used to prevent first-paint layout jumps.
  }
}

const submissionCategories = [
  "Web Framework",
  "Browser Extension",
  "Database",
  "UI Framework",
  "Prototype",
  "Authentication",
  "Payment",
  "Ideas Creativity",
  "SEO Opt",
  "Ads",
  "I18N",
  "AI Tools",
  "Image Hosting",
  "Email",
  "Analytics",
  "Tunnel",
  "Acceleration",
  "Speed Test",
  "Monitoring",
  "Developer Tools",
  "Customer Support",
  "Docs Tools",
  "Deploy Service",
  "Domain Service",
  "Project Management",
  "Product Launch",
  "Other Tools"
];

const CATEGORY_PAGE_SIZE = 16;
const PUBLIC_LIST_REQUEST_TIMEOUT_MS = 15_000;
const NAV_BURST_PARTICLE_COUNT = 12;
const NAV_BURST_NAVIGATION_DELAY_MS = 220;
const MOBILE_NAV_EXIT_MS = 240;
const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  enabled: false,
  baseUrl: "",
  mode: DEFAULT_PROXY_MODE,
  scope: DEFAULT_PROXY_SCOPE
};
const ProxySettingsContext = createContext<ProxySettings>(DEFAULT_PROXY_SETTINGS);

function useProxySettings() {
  return useContext(ProxySettingsContext);
}

type PublicPage = "home" | "category" | "articles" | "submit" | "about";

function resolveThemeMode(mode: ThemeMode) {
  if (mode !== "system") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveStoredThemeMode(value?: string | null): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function createArticleHref(slug: string) {
  return `/articles/${encodeURIComponent(slug)}`;
}

function scrollPageToTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function spawnNavClickBurst(clientX: number, clientY: number) {
  const burst = document.createElement("span");
  burst.className = "nav-particle-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${clientX}px`;
  burst.style.top = `${clientY}px`;

  for (let index = 0; index < NAV_BURST_PARTICLE_COUNT; index += 1) {
    const particle = document.createElement("span");
    const angle =
      (Math.PI * 2 * index) / NAV_BURST_PARTICLE_COUNT +
      (index % 2 === 0 ? 0.12 : -0.08);
    const distance = 24 + (index % 4) * 5;

    particle.className = "nav-particle";
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--delay", `${(index % 3) * 8}ms`);
    burst.appendChild(particle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 360);
}

function LoadingSkeleton({ children }: { children: ReactNode }) {
  const showSkeleton = useLoadingSkeleton(true);

  return <SkeletonVisibility visible={showSkeleton}>{children}</SkeletonVisibility>;
}

export function App() {
  const cachedSiteSettings = readCachedSiteSettings();
  const [tools, setTools] = useState<Tool[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToolsLoadingMore, setIsToolsLoadingMore] = useState(false);
  const [toolHasMore, setToolHasMore] = useState(false);
  const [toolPage, setToolPage] = useState(1);
  const [toolCategoryCounts, setToolCategoryCounts] = useState<Record<string, number> | null>(
    null
  );
  const [categoryRequestStatus, setCategoryRequestStatus] = useState<"loading" | "ready" | "error">("loading");
  const [categoryRetryCount, setCategoryRetryCount] = useState(0);
  const [featuredToolTotal, setFeaturedToolTotal] = useState(0);
  const [isArticlesLoading, setIsArticlesLoading] = useState(true);
  const [isArticlesLoadingMore, setIsArticlesLoadingMore] = useState(false);
  const [articleHasMore, setArticleHasMore] = useState(false);
  const [articlePage, setArticlePage] = useState(1);
  const [articleCategoryCounts, setArticleCategoryCounts] = useState<
    Record<string, number>
  >({});
  const [toolLoadError, setToolLoadError] = useState("");
  const [articleLoadError, setArticleLoadError] = useState("");
  const [toolRetryCount, setToolRetryCount] = useState(0);
  const [articleRetryCount, setArticleRetryCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeArticleCategory, setActiveArticleCategory] = useState("All");
  const [proxySettings, setProxySettings] = useState<ProxySettings>(
    DEFAULT_PROXY_SETTINGS
  );
  const [proxySettingsRequestSettled, setProxySettingsRequestSettled] =
    useState(false);
  const [proxySettingsRequestError, setProxySettingsRequestError] =
    useState<unknown>(null);
  const [publicCategorySettings, setPublicCategorySettings] =
    useState<AdminCategorySettings>(initialAdminCategorySettings);
  const [publicCategoryIcons, setPublicCategoryIcons] =
    useState<CategoryIconSettings>(createEmptyCategoryIconSettings);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    cachedSiteSettings ?? DEFAULT_SITE_SETTINGS
  );
  const [siteSettingsRequestSettled, setSiteSettingsRequestSettled] =
    useState(false);
  const [siteSettingsRequestError, setSiteSettingsRequestError] =
    useState<unknown>(null);
  const [siteSettingsRetryCount, setSiteSettingsRetryCount] = useState(0);
  const siteSettingsLoadingRef = useRef(true);
  const [umamiSettings, setUmamiSettings] = useState<UmamiSettings>(
    DISABLED_UMAMI_SETTINGS
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    resolveStoredThemeMode(localStorage.getItem("htools_theme"))
  );
  const [locale, setLocale] = useState<Locale>(() =>
    resolveLocale(localStorage.getItem("htools_locale") ?? navigator.language)
  );
  const toastIdRef = useRef(0);
  const activeToastKeysRef = useRef(new Set<string>());
  const publicToolsRequestIdRef = useRef(0);
  const publicToolsAbortRef = useRef<AbortController | null>(null);
  const publicToolsLoadingMoreRef = useRef(false);
  const publicArticlesRequestIdRef = useRef(0);
  const publicArticlesAbortRef = useRef<AbortController | null>(null);
  const publicArticlesLoadingMoreRef = useRef(false);
  const [toasts, setToasts] = useState<GlobalToast[]>([]);
  const pathname = window.location.pathname;
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const routeSearchParams = new URLSearchParams(window.location.search);
  const isAdminRoute =
    normalizedPathname === "/admin" || normalizedPathname.startsWith("/admin/");
  const isCategoryRoute =
    normalizedPathname === "/tools" || normalizedPathname.startsWith("/tools/");
  const isSubmitRoute = normalizedPathname === "/submit";
  const isArticlesRoute =
    normalizedPathname === "/articles" || normalizedPathname.startsWith("/articles/");
  const articleSlug = isArticlesRoute
    ? decodeURIComponent(pathname.split("/").filter(Boolean).slice(1).join("/"))
    : "";
  const isArticleDetailRoute = Boolean(articleSlug);
  const isAboutRoute = normalizedPathname === "/about";
  const isPrivacyRoute = normalizedPathname === "/privacy";
  const isTermsRoute = normalizedPathname === "/terms";
  const isHomeRoute =
    !isAdminRoute &&
    !isCategoryRoute &&
    !isSubmitRoute &&
    !isArticlesRoute &&
    !isAboutRoute &&
    !isPrivacyRoute &&
    !isTermsRoute;
  const isUnknownPublicRoute = isHomeRoute && normalizedPathname !== "/";
  const isPreviewRoute =
    isArticleDetailRoute &&
    (routeSearchParams.has("preview") || routeSearchParams.has("contentItem"));
  const shouldLoadPublicTools = isHomeRoute || isCategoryRoute;
  const shouldLoadPublicArticles =
    isHomeRoute || (isArticlesRoute && !isArticleDetailRoute);
  const shouldLoadPublicCategories =
    shouldLoadPublicTools || shouldLoadPublicArticles;
  const shouldLoadFullSiteSettings =
    isAboutRoute || isPrivacyRoute || isTermsRoute || isAdminRoute;
  const t = translations[locale];
  const localeOption = getLocaleOption(locale);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const toastKey = `${toast.tone}\u0000${toast.message}`;
    if (activeToastKeysRef.current.has(toastKey)) return;

    activeToastKeysRef.current.add(toastKey);
    const id = ++toastIdRef.current;
    const nextToast = { ...toast, id };

    setToasts((current) => [...current, nextToast].slice(-3));
    window.setTimeout(() => {
      activeToastKeysRef.current.delete(toastKey);
      dismissToast(id);
    }, 4200);
  }, [dismissToast]);

  useEffect(() => {
    if (!shouldLoadPublicTools) {
      setIsLoading(false);
      return;
    }

    const requestId = publicToolsRequestIdRef.current + 1;
    publicToolsRequestIdRef.current = requestId;
    publicToolsAbortRef.current?.abort();
    const controller = new AbortController();
    publicToolsAbortRef.current = controller;
    const timeout = window.setTimeout(
      () => controller.abort(),
      PUBLIC_LIST_REQUEST_TIMEOUT_MS
    );
    const featured = isCategoryRoute && isFeaturedCategoryValue(activeCategory);
    const category =
      isCategoryRoute && !featured && !isAllCategoryValue(activeCategory)
        ? normalizeAdminCategoryValue(activeCategory)
        : "";

    setToolHasMore(false);
    setToolPage(1);
    publicToolsLoadingMoreRef.current = false;
    setIsToolsLoadingMore(false);
    setIsLoading(true);

    void loadTools({
      category: category || undefined,
      featured,
      includeCounts: false,
      limit: isHomeRoute ? 8 : CATEGORY_PAGE_SIZE,
      page: 1,
      signal: controller.signal
    }).then((page) => {
      if (publicToolsRequestIdRef.current !== requestId) return;
      setTools(page.tools);
      setToolHasMore(page.hasMore);
      setToolLoadError("");
      if (page.categoryCounts) setToolCategoryCounts(page.categoryCounts);
      if (page.featuredTotal !== null) setFeaturedToolTotal(page.featuredTotal);
    }).catch((error) => {
      if (publicToolsRequestIdRef.current !== requestId) return;
      setTools([]);
      setToolLoadError(getLocalizedErrorMessage(error, t));
    }).finally(() => {
      window.clearTimeout(timeout);
      if (publicToolsRequestIdRef.current === requestId) {
        publicToolsAbortRef.current = null;
        setIsLoading(false);
      }
    });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activeCategory, isCategoryRoute, isHomeRoute, shouldLoadPublicTools, toolRetryCount]);

  useEffect(() => {
    if (!shouldLoadPublicArticles) {
      setIsArticlesLoading(false);
      return;
    }

    const requestId = publicArticlesRequestIdRef.current + 1;
    publicArticlesRequestIdRef.current = requestId;
    publicArticlesAbortRef.current?.abort();
    const controller = new AbortController();
    publicArticlesAbortRef.current = controller;
    const timeout = window.setTimeout(
      () => controller.abort(),
      PUBLIC_LIST_REQUEST_TIMEOUT_MS
    );
    const category =
      isArticlesRoute && !isArticleDetailRoute &&
      !isAllCategoryValue(activeArticleCategory)
        ? normalizeAdminCategoryValue(activeArticleCategory)
        : "";
    const limit = isHomeRoute ? 4 : 20;

    setArticleHasMore(false);
    setArticlePage(1);
    publicArticlesLoadingMoreRef.current = false;
    setIsArticlesLoadingMore(false);
    setIsArticlesLoading(true);

    void loadArticles({
      category: category || undefined,
      includeCounts: !isHomeRoute,
      limit,
      page: 1,
      signal: controller.signal
    })
      .then((page) => {
        if (publicArticlesRequestIdRef.current !== requestId) return;
        setArticles(page.articles);
        setArticleHasMore(page.hasMore);
        setArticleLoadError("");
        if (page.categoryCounts) setArticleCategoryCounts(page.categoryCounts);
      })
      .catch((error) => {
        if (publicArticlesRequestIdRef.current !== requestId) return;
        setArticles([]);
        setArticleLoadError(getLocalizedErrorMessage(error, t));
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (publicArticlesRequestIdRef.current === requestId) {
          publicArticlesAbortRef.current = null;
          setIsArticlesLoading(false);
        }
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    activeArticleCategory,
    isArticleDetailRoute,
    isArticlesRoute,
    isHomeRoute,
    shouldLoadPublicArticles,
    articleRetryCount
  ]);

  useEffect(() => {
    if (!shouldLoadPublicCategories) return;

    let active = true;
    const controller = new AbortController();
    setCategoryRequestStatus("loading");

    async function refreshCategorySettings() {
      try {
        const data = await loadPublicCategoryData({ signal: controller.signal });

        if (active) {
          setPublicCategorySettings(data.settings);
          setPublicCategoryIcons(normalizeCategoryIconSettings(data.icons));
          setToolCategoryCounts(
            Object.fromEntries(
              data.categories.map((row) => [row.category, Number(row.total ?? 0)])
            )
          );
          setFeaturedToolTotal(
            data.categories.reduce(
              (sum, row) => sum + Number(row.featured_total ?? 0),
              0
            )
          );
          setCategoryRequestStatus("ready");
        }
      } catch {
        if (active) {
          setCategoryRequestStatus("error");
        }
      }
    }

    void refreshCategorySettings();

    return () => {
      active = false;
      controller.abort();
    };
  }, [shouldLoadPublicCategories, categoryRetryCount]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    siteSettingsLoadingRef.current = true;
    setSiteSettingsRequestSettled(false);

    async function refreshSiteSettings() {
      try {
        const { settings, umami } = await loadSiteConfiguration({
          includeFullContent: shouldLoadFullSiteSettings,
          signal: controller.signal
        });

        if (active) {
          setUmamiSettings(umami);
          if (shouldLoadFullSiteSettings) {
            setSiteSettings(settings);
            writeCachedSiteSettings(settings);
          } else {
            setSiteSettings((current) => {
              const nextSettings = {
                ...settings,
                aboutContent: current.aboutContent,
                privacyContent: current.privacyContent,
                termsContent: current.termsContent
              };
              writeCachedSiteSettings(nextSettings);
              return nextSettings;
            });
          }
          siteSettingsLoadingRef.current = false;
          setSiteSettingsRequestError(null);
          setSiteSettingsRequestSettled(true);
        }
      } catch (error) {
        if (active) {
          setUmamiSettings(DISABLED_UMAMI_SETTINGS);
          if (!cachedSiteSettings) {
            setSiteSettings(DEFAULT_SITE_SETTINGS);
          }
          siteSettingsLoadingRef.current = false;
          setSiteSettingsRequestError(error);
          setSiteSettingsRequestSettled(true);
        }
      }
    }

    void refreshSiteSettings();

    return () => {
      active = false;
      controller.abort();
    };
  }, [shouldLoadFullSiteSettings, siteSettingsRetryCount]);

  function retrySiteSettings() {
    if (siteSettingsLoadingRef.current) return;
    siteSettingsLoadingRef.current = true;
    setSiteSettingsRequestSettled(false);
    setSiteSettingsRetryCount((count) => count + 1);
  }

  useEffect(() => {
    if (
      isAdminRoute ||
      !umamiSettings.enabled ||
      !umamiSettings.scriptUrl ||
      !umamiSettings.websiteId
    ) {
      return;
    }

    document.querySelectorAll(UMAMI_SCRIPT_SELECTOR).forEach((script) => {
      script.remove();
    });

    const script = document.createElement("script");
    script.defer = true;
    script.src = umamiSettings.scriptUrl;
    script.dataset.websiteId = umamiSettings.websiteId;
    script.dataset.htoolsUmami = "true";
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isAdminRoute, umamiSettings]);

  useEffect(() => {
    let active = true;
    setProxySettingsRequestSettled(false);
    setProxySettingsRequestError(null);

    async function refreshProxySettings() {
      try {
        const settings = await loadProxySettings();

        if (active) {
          setProxySettings({
            enabled: settings.enabled,
            baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
            mode: normalizeProxyMode(settings.mode),
            scope: normalizeProxyScope(settings.scope)
          });
          setProxySettingsRequestError(null);
          setProxySettingsRequestSettled(true);
        }
      } catch (error) {
        if (active) {
          setProxySettings(DEFAULT_PROXY_SETTINGS);
          setProxySettingsRequestError(error);
          setProxySettingsRequestSettled(true);
        }
      }
    }

    void refreshProxySettings();

    return () => {
      active = false;
    };
  }, []);

  function retryPublicTools() {
    if (publicToolsAbortRef.current || publicToolsLoadingMoreRef.current) return;
    publicToolsLoadingMoreRef.current = true;
    setIsLoading(true);
    setToolRetryCount((count) => count + 1);
  }

  function retryPublicArticles() {
    if (publicArticlesAbortRef.current || publicArticlesLoadingMoreRef.current) return;
    publicArticlesLoadingMoreRef.current = true;
    setIsArticlesLoading(true);
    setArticleRetryCount((count) => count + 1);
  }

  function handlePublicArticleCategoryChange(category: string) {
    const normalized = normalizeAdminCategoryValue(category);
    if (normalized === activeArticleCategory) return;

    publicArticlesRequestIdRef.current += 1;
    publicArticlesLoadingMoreRef.current = false;
    setIsArticlesLoadingMore(false);
    setArticleHasMore(false);
    setArticlePage(1);
    setArticleLoadError("");
    setActiveArticleCategory(normalized);
  }

  function handlePublicToolCategoryChange(category: string) {
    const normalized = normalizeAdminCategoryValue(category);
    if (normalized === activeCategory) return;

    publicToolsRequestIdRef.current += 1;
    publicToolsLoadingMoreRef.current = false;
    setIsToolsLoadingMore(false);
    setToolHasMore(false);
    setToolPage(1);
    setToolLoadError("");
    setActiveCategory(normalized);
  }

  async function changePublicToolPage(targetPage: number) {
    if (targetPage < 1 || targetPage === toolPage || publicToolsLoadingMoreRef.current) {
      return;
    }

    const requestId = publicToolsRequestIdRef.current + 1;
    publicToolsRequestIdRef.current = requestId;
    publicToolsAbortRef.current?.abort();
    const controller = new AbortController();
    publicToolsAbortRef.current = controller;
    const timeout = window.setTimeout(
      () => controller.abort(),
      PUBLIC_LIST_REQUEST_TIMEOUT_MS
    );
    publicToolsLoadingMoreRef.current = true;
    setIsToolsLoadingMore(true);
    setToolLoadError("");
    const featured = isFeaturedCategoryValue(activeCategory);
    const category =
      featured || isAllCategoryValue(activeCategory)
        ? ""
        : normalizeAdminCategoryValue(activeCategory);

    try {
      const page = await loadTools({
        category: category || undefined,
        featured,
        includeCounts: false,
        limit: CATEGORY_PAGE_SIZE,
        page: targetPage,
        signal: controller.signal
      });
      if (publicToolsRequestIdRef.current !== requestId) return;
      setTools(page.tools);
      setToolPage(targetPage);
      setToolHasMore(page.hasMore);
      scrollPageToTop();
    } catch (error) {
      if (publicToolsRequestIdRef.current === requestId) {
        const message = getLocalizedErrorMessage(error, t);
        setToolLoadError(message);
        notify({ tone: "error", message });
      }
    } finally {
      window.clearTimeout(timeout);
      if (publicToolsRequestIdRef.current === requestId) {
        publicToolsAbortRef.current = null;
        publicToolsLoadingMoreRef.current = false;
        setIsToolsLoadingMore(false);
      }
    }
  }

  async function changePublicArticlePage(targetPage: number) {
    if (targetPage < 1 || targetPage === articlePage || publicArticlesLoadingMoreRef.current) {
      return;
    }

    const requestId = publicArticlesRequestIdRef.current + 1;
    publicArticlesRequestIdRef.current = requestId;
    publicArticlesAbortRef.current?.abort();
    const controller = new AbortController();
    publicArticlesAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), PUBLIC_LIST_REQUEST_TIMEOUT_MS);
    publicArticlesLoadingMoreRef.current = true;
    setIsArticlesLoadingMore(true);
    setArticleLoadError("");
    const category = isAllCategoryValue(activeArticleCategory)
      ? ""
      : normalizeAdminCategoryValue(activeArticleCategory);

    try {
      const page = await loadArticles({
        category: category || undefined,
        includeCounts: false,
        limit: 20,
        page: targetPage,
        signal: controller.signal
      });
      if (publicArticlesRequestIdRef.current !== requestId) return;

      setArticles(page.articles);
      setArticlePage(targetPage);
      setArticleHasMore(page.hasMore);
      scrollPageToTop();
    } catch (error) {
      if (publicArticlesRequestIdRef.current === requestId) {
        const message = getLocalizedErrorMessage(error, t);
        setArticleLoadError(message);
        notify({ tone: "error", message });
      }
    } finally {
      window.clearTimeout(timeout);
      if (publicArticlesRequestIdRef.current === requestId) {
        publicArticlesAbortRef.current = null;
        publicArticlesLoadingMoreRef.current = false;
        setIsArticlesLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme = resolveThemeMode(themeMode);
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
      document.documentElement.style.backgroundColor =
        resolvedTheme === "dark" ? "#09090b" : "#fff";
    };
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    applyTheme();
    localStorage.setItem("htools_theme", themeMode);

    if (themeMode === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.lang = localeOption.htmlLang;
    localStorage.setItem("htools_locale", locale);
  }, [locale, localeOption.htmlLang]);

  useEffect(() => {
    if (isArticleDetailRoute && !isPreviewRoute) {
      return;
    }

    syncDocumentRobots(
      isAdminRoute || isUnknownPublicRoute || isPreviewRoute
        ? NO_INDEX_ROBOTS
        : INDEX_ROBOTS
    );
  }, [isAdminRoute, isArticleDetailRoute, isPreviewRoute, isUnknownPublicRoute]);

  useEffect(() => {
    if (isAdminRoute || isArticleDetailRoute) {
      return;
    }

    let pageTitle = "";
    let description = getLocalizedHomeHeroContent(
      siteSettings,
      locale,
      t
    ).description;

    if (isCategoryRoute) {
      const categoryTitle = isAllCategoryValue(activeCategory)
        ? ""
        : getCategoryLabel(activeCategory, t);
      pageTitle = categoryTitle
        ? `${categoryTitle} · ${t.hero.title}`
        : t.hero.title;
      description = t.hero.description;
    } else if (isArticlesRoute) {
      const categoryTitle = isAllCategoryValue(activeArticleCategory)
        ? ""
        : getCategoryLabel(activeArticleCategory, t);
      pageTitle = categoryTitle
        ? `${categoryTitle} · ${t.articlesPage.title}`
        : t.articlesPage.title;
      description = t.articlesPage.description;
    } else if (isSubmitRoute) {
      pageTitle = t.submitPage.title;
      description = t.submitPage.description;
    } else if (isAboutRoute) {
      pageTitle = t.home.about;
      description = t.publicMeta.aboutDescription;
    } else if (isPrivacyRoute) {
      pageTitle = t.home.privacy;
      description = t.publicMeta.privacyDescription;
    } else if (isTermsRoute) {
      pageTitle = t.home.terms;
      description = t.publicMeta.termsDescription;
    }

    syncDocumentMetadata({
      title: pageTitle
        ? formatPublicDocumentTitle(pageTitle, siteSettings)
        : getSiteDocumentTitle(siteSettings),
      description,
      robots: isUnknownPublicRoute ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
      structuredData:
        isHomeRoute && pathname === "/"
          ? createWebsiteStructuredData({ settings: siteSettings, locale, description })
          : null
    });
  }, [
    activeArticleCategory,
    activeCategory,
    isAboutRoute,
    isAdminRoute,
    isArticleDetailRoute,
    isArticlesRoute,
    isCategoryRoute,
    isHomeRoute,
    isPrivacyRoute,
    isSubmitRoute,
    isTermsRoute,
    isUnknownPublicRoute,
    locale,
    siteSettings,
    t
  ]);

  useEffect(() => {
    return syncSiteFavicon(siteSettings.iconUrl);
  }, [siteSettings.iconUrl]);

  const hasFeaturedTools = featuredToolTotal > 0;
  const categories = useMemo(() => {
    const names = sortCategoriesBySettings(
      Object.keys(toolCategoryCounts ?? {}).filter(
        (category) => Number(toolCategoryCounts?.[category] ?? 0) > 0
      ),
      publicCategorySettings.tools,
      t
    );
    return hasFeaturedTools ? ["All", ADMIN_FEATURED_CATEGORY, ...names] : ["All", ...names];
  }, [hasFeaturedTools, publicCategorySettings.tools, t, toolCategoryCounts]);

  useEffect(() => {
    if (toolCategoryCounts !== null && !hasFeaturedTools && isFeaturedCategoryValue(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, hasFeaturedTools, toolCategoryCounts]);

  const totalPublicToolCount = toolCategoryCounts === null ? null : Object.values(toolCategoryCounts).reduce(
    (sum, count) => sum + Number(count ?? 0),
    0
  );
  const activeToolTotal = toolCategoryCounts === null ? null : isFeaturedCategoryValue(activeCategory)
    ? featuredToolTotal
    : isAllCategoryValue(activeCategory)
      ? totalPublicToolCount
      : Number(toolCategoryCounts[normalizeAdminCategoryValue(activeCategory)] ?? 0);
  const articleCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      Object.keys(articleCategoryCounts).filter(
        (category) => Number(articleCategoryCounts[category] ?? 0) > 0
      ),
      publicCategorySettings.articles,
      t
    );

    return ["All", ...names];
  }, [articleCategoryCounts, publicCategorySettings.articles, t]);

  useEffect(() => {
    const normalizedArticleCategory =
      normalizeAdminCategoryValue(activeArticleCategory);

    if (activeArticleCategory !== normalizedArticleCategory) {
      setActiveArticleCategory(normalizedArticleCategory);
      return;
    }

    if (!articleCategories.includes(normalizedArticleCategory)) {
      setActiveArticleCategory("All");
    }
  }, [activeArticleCategory, articleCategories]);

  const totalPublicArticleCount = Object.values(articleCategoryCounts).reduce(
    (sum, count) => sum + Number(count ?? 0),
    0
  );
  const activeArticleTotal = isAllCategoryValue(activeArticleCategory)
    ? totalPublicArticleCount
    : Number(articleCategoryCounts[normalizeAdminCategoryValue(activeArticleCategory)] ?? 0);
  const isInitialToolsLoading = isLoading && tools.length === 0;
  const showInitialToolSkeletons = useLoadingSkeleton(isInitialToolsLoading);
  const showPublicArticleSkeletons = useLoadingSkeleton(
    isArticlesLoading && articles.length === 0
  );
  const siteSettingsErrorMessage = siteSettingsRequestError
    ? getLocalizedErrorMessage(siteSettingsRequestError, t)
    : "";
  function updateSiteSettings(settings: SiteSettings) {
    setSiteSettings(settings);
    setSiteSettingsRequestError(null);
    setSiteSettingsRequestSettled(true);
    writeCachedSiteSettings(settings);
  }

  function updateProxySettings(settings: ProxySettings) {
    setProxySettings(settings);
    setProxySettingsRequestError(null);
    setProxySettingsRequestSettled(true);
  }

  const categoryNotice = categoryRequestStatus === "error" ||
    (categoryRetryCount > 0 && categoryRequestStatus === "loading") ? (
    <div className="public-category-notice" role="status">
      <span>{t.empty.categoriesUnavailable}</span>
      <button
        className="ghost-button"
        disabled={categoryRequestStatus === "loading"}
        onClick={() => setCategoryRetryCount((count) => count + 1)}
        type="button"
      >
        {t.actions.retry}
      </button>
    </div>
  ) : null;

  const page = isAdminRoute ? (
    <Suspense
      fallback={<div className="admin-shell auth-shell" aria-busy="true" />}
    >
      <AdminApp
        locale={locale}
        onBackHome={() => (window.location.href = "/")}
        onLocaleChange={setLocale}
        onNotify={notify}
        onProxySettingsChange={updateProxySettings}
        onSiteSettingsChange={updateSiteSettings}
        onUmamiSettingsChange={setUmamiSettings}
        onThemeChange={setThemeMode}
        proxySettings={proxySettings}
        proxySettingsLoadError={proxySettingsRequestError}
        proxySettingsReady={proxySettingsRequestSettled}
        siteSettings={siteSettings}
        siteSettingsLoadError={siteSettingsRequestError}
        siteSettingsReady={siteSettingsRequestSettled}
        t={t}
        themeMode={themeMode}
      />
    </Suspense>
  ) : isSubmitRoute ? (
    <div className="home-shell">
      <HomeHeader
        activePage="submit"
        locale={locale}
        onLocaleChange={setLocale}
        onThemeChange={setThemeMode}
        searchArticles={articles}
        searchTools={tools}
        t={t}
        themeMode={themeMode}
      />
      <SubmitPageContent
        categories={submissionCategories.map((value) => ({
          value,
          label: getCategoryLabel(value, t)
        }))}
        locale={locale}
        normalizeUrl={normalizeHttpUrlInput}
        notify={notify}
        parseTags={parseArticleTagsInput}
        t={t}
      />
      <HomeFooter t={t} />
    </div>
  ) : isArticleDetailRoute ? (
    <ArticleDetailPage
      articleSlug={articleSlug}
      locale={locale}
      onLocaleChange={setLocale}
      onThemeChange={setThemeMode}
      searchArticles={articles}
      searchTools={tools}
      t={t}
      themeMode={themeMode}
    />
  ) : isArticlesRoute ? (
    <ArticlesPage
      activeCategory={activeArticleCategory}
      categoryIcons={publicCategoryIcons.articles}
      articles={articles}
      categories={articleCategories}
      categoryNotice={categoryNotice}
      currentPage={articlePage}
      error={articleLoadError}
      hasMore={articleHasMore}
      isLoading={isArticlesLoading && articles.length === 0}
      isLoadingMore={isArticlesLoadingMore}
      isRefreshing={(isArticlesLoading && articles.length > 0) || isArticlesLoadingMore}
      locale={locale}
      onLocaleChange={setLocale}
      onThemeChange={setThemeMode}
      onPageChange={changePublicArticlePage}
      onRetry={retryPublicArticles}
      setActiveCategory={handlePublicArticleCategoryChange}
      searchArticles={articles}
      searchTools={tools}
      showSkeletons={showPublicArticleSkeletons}
      totalArticleCount={activeArticleTotal}
      t={t}
      themeMode={themeMode}
    />
  ) : isAboutRoute ? (
    <AboutPage
      error={siteSettingsErrorMessage}
      locale={locale}
      onLocaleChange={setLocale}
      onRetry={retrySiteSettings}
      onThemeChange={setThemeMode}
      searchArticles={articles}
      searchTools={tools}
      siteSettingsLoaded={siteSettingsRequestSettled}
      t={t}
      themeMode={themeMode}
    />
  ) : isPrivacyRoute || isTermsRoute ? (
    <LegalPage
      error={siteSettingsErrorMessage}
      kind={isPrivacyRoute ? "privacy" : "terms"}
      locale={locale}
      onLocaleChange={setLocale}
      onRetry={retrySiteSettings}
      onThemeChange={setThemeMode}
      searchArticles={articles}
      searchTools={tools}
      siteSettingsLoaded={siteSettingsRequestSettled}
      t={t}
      themeMode={themeMode}
    />
  ) : isCategoryRoute ? (
    <CategoryPage
      activeCategory={activeCategory}
      categoryIcons={publicCategoryIcons.tools}
      categories={categories}
      categoryNotice={categoryNotice}
      hasMore={toolHasMore}
      currentPage={toolPage}
      isLoading={isInitialToolsLoading}
      isLoadingMore={isToolsLoadingMore}
      isRefreshing={(isLoading && tools.length > 0) || isToolsLoadingMore}
      locale={locale}
      onLocaleChange={setLocale}
      onThemeChange={setThemeMode}
      proxySettings={proxySettings}
      searchArticles={articles}
      searchTools={tools}
      onPageChange={changePublicToolPage}
      onRetry={retryPublicTools}
      setActiveCategory={handlePublicToolCategoryChange}
      showSkeletons={showInitialToolSkeletons}
      t={t}
      themeMode={themeMode}
      toolLoadError={toolLoadError}
      totalToolCount={activeToolTotal}
      tools={tools}
    />
  ) : (
    <HomePage
      articles={articles}
      articleError={articleLoadError}
      categoryNotice={categoryNotice}
      isArticlesLoading={isArticlesLoading}
      isLoading={isInitialToolsLoading}
      onRetryArticles={retryPublicArticles}
      onRetryTools={retryPublicTools}
      locale={locale}
      onLocaleChange={setLocale}
      onThemeChange={setThemeMode}
      proxySettings={proxySettings}
      searchArticles={articles}
      searchTools={tools}
      showArticleSkeletons={showPublicArticleSkeletons}
      showToolSkeletons={showInitialToolSkeletons}
      t={t}
      themeMode={themeMode}
      toolLoadError={toolLoadError}
      toolCategoryCount={toolCategoryCounts === null ? null : Object.keys(toolCategoryCounts).length}
      totalToolCount={totalPublicToolCount}
      tools={tools}
    />
  );

  return (
    <ToastContext.Provider value={notify}>
      <SiteSettingsContext.Provider value={siteSettings}>
        <ProxySettingsContext.Provider value={proxySettings}>
          {page}
          <GlobalToasts toasts={toasts} />
        </ProxySettingsContext.Provider>
      </SiteSettingsContext.Provider>
    </ToastContext.Provider>
  );
}

function GlobalToasts({
  toasts
}: {
  toasts: GlobalToast[];
}) {
  if (!toasts.length) {
    return null;
  }

  return createPortal(
    <div className="global-toast-region" id="global-operation-status" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`global-toast is-${toast.tone}`} key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

function HomePage({
  articleError,
  articles,
  categoryNotice,
  isLoading,
  isArticlesLoading,
  locale,
  onLocaleChange,
  onRetryArticles,
  onRetryTools,
  onThemeChange,
  proxySettings,
  searchArticles,
  searchTools,
  showArticleSkeletons,
  showToolSkeletons,
  t,
  themeMode,
  toolLoadError,
  toolCategoryCount,
  totalToolCount,
  tools
}: {
  articleError: string;
  articles: ArticleSummary[];
  categoryNotice: ReactNode;
  isLoading: boolean;
  isArticlesLoading: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onRetryArticles: () => void;
  onRetryTools: () => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  proxySettings: ProxySettings;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  showArticleSkeletons: boolean;
  showToolSkeletons: boolean;
  t: Messages;
  themeMode: ThemeMode;
  toolLoadError: string;
  toolCategoryCount: number | null;
  totalToolCount: number | null;
  tools: Tool[];
}) {
  const latestTools = tools.slice(0, 8);
  const latestArticles = articles.slice(0, 4);
  const articleText = getArticleText(locale);
  const siteSettings = useSiteSettings();
  const homeHero = getLocalizedHomeHeroContent(siteSettings, locale, t);

  return (
    <div className="home-shell home-page-shell">
      <HomeHeader
        activePage="home"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        showSearch={false}
        t={t}
        themeMode={themeMode}
      />

      <main>
        <section className="home-hero">
          <div className="hero-content">
            <a className="hero-pill" href="/tools">
              <Sparkles size={16} />
              {toolCategoryCount === null ? t.home.exploreAll : t.home.browseCategories(toolCategoryCount)}
              <ArrowUpRight size={18} />
            </a>
            <div className="home-hero-copy">
              <h1>
                <span className="hero-title-line">{homeHero.titleTop}</span>
                <span className="hero-title-accent">{homeHero.titleBottom}</span>
              </h1>
              <p>{homeHero.description}</p>
            </div>
            <div className="hero-actions">
              <PublicGlowAction href="/tools">
                {t.home.exploreAll}
              </PublicGlowAction>
              <a className="ghost-button hero-ghost" href="/submit">
                {t.actions.submitTool}
              </a>
            </div>
          </div>
        </section>

        <section className="home-section" id="latest-tools">
          {categoryNotice}
          <SectionTitle icon={<PackagePlus size={25} />} title={t.home.latestTools} />
          <div className="home-tool-grid">
            {toolLoadError && latestTools.length === 0 ? (
              <PublicLoadError busy={isLoading} message={toolLoadError} onRetry={onRetryTools} t={t} />
            ) : isLoading ? (
              <SkeletonVisibility visible={showToolSkeletons}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <ToolCardSkeleton home key={index} />
                ))}
              </SkeletonVisibility>
            ) : latestTools.length > 0 ? (
              latestTools.map((tool, index) => (
                <HomeToolCard
                  key={tool.id}
                  priority={index < 4}
                  proxySettings={proxySettings}
                  tool={tool}
                  t={t}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">
                  <PanelLeft size={24} />
                  <h2>
                    {totalToolCount === 0
                        ? t.empty.libraryTitle
                        : t.empty.title}
                  </h2>
                </div>
                <p>
                  {totalToolCount === 0
                      ? t.empty.libraryDescription
                      : t.empty.description}
                </p>
                {totalToolCount === 0 ? (
                  <a
                    className="primary-button empty-state-action"
                    href={getAdminPath("import-export")}
                  >
                    {t.empty.libraryAction}
                    <ArrowUpRight size={15} />
                  </a>
                ) : null}
              </div>
            )}
          </div>
          <div className="section-action">
            <PublicGlowAction href="/tools">
              {t.home.moreTools}
            </PublicGlowAction>
          </div>
        </section>

        <section className="home-section" id="latest-articles">
          <SectionTitle icon={<FileText size={25} />} title={t.home.latestArticles} />
          <div className="article-list">
            {articleError && latestArticles.length === 0 ? (
              <PublicLoadError busy={isArticlesLoading} message={articleError} onRetry={onRetryArticles} t={t} />
            ) : isArticlesLoading ? (
              <SkeletonVisibility visible={showArticleSkeletons}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <ArticleItemSkeleton key={index} />
                ))}
              </SkeletonVisibility>
            ) : latestArticles.length > 0 ? (
              latestArticles.map((article) => (
                <ArticleListItem
                  article={article}
                  articleText={articleText}
                  key={article.id}
                />
              ))
            ) : (
              <div className="empty-state article-empty-state">
                <div className="empty-state-title">
                  <FileText size={24} />
                  <h2>{articleText.publicEmptyTitle}</h2>
                </div>
                <p>
                  {articleText.publicEmptyDescription}
                </p>
              </div>
            )}
          </div>
          <div className="section-action">
            <PublicGlowAction href="/articles">
              {t.home.moreArticles}
            </PublicGlowAction>
          </div>
        </section>
      </main>

      <HomeFooter t={t} />
    </div>
  );
}

function CategoryPage({
  activeCategory,
  categories,
  categoryIcons,
  categoryNotice,
  currentPage,
  hasMore,
  isLoading,
  isLoadingMore,
  isRefreshing,
  locale,
  onPageChange,
  onRetry,
  onLocaleChange,
  onThemeChange,
  proxySettings,
  searchArticles,
  searchTools,
  setActiveCategory,
  showSkeletons,
  t,
  themeMode,
  toolLoadError,
  totalToolCount,
  tools
}: {
  activeCategory: string;
  categories: string[];
  categoryIcons: CategoryIconSettings["tools"];
  categoryNotice: ReactNode;
  currentPage: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  locale: Locale;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  proxySettings: ProxySettings;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  setActiveCategory: (category: string) => void;
  showSkeletons: boolean;
  t: Messages;
  themeMode: ThemeMode;
  toolLoadError: string;
  totalToolCount: number | null;
  tools: Tool[];
}) {
  const totalPages = totalToolCount === null ? null : Math.max(1, Math.ceil(totalToolCount / CATEGORY_PAGE_SIZE));
  function handleCategorySelect(category: string) {
    setActiveCategory(category);
    scrollPageToTop();
  }

  return (
    <div className="home-shell">
      <HomeHeader
        activePage="category"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        t={t}
        themeMode={themeMode}
      />

      <main className="category-page">
        <section className="category-page-hero">
          <div>
            <h1>{t.nav.category}</h1>
            <p>{t.hero.description}</p>
          </div>
          <PublicGlowAction href="/submit">
            {t.actions.submitTool}
          </PublicGlowAction>
        </section>

        <section className="directory-layout category-directory" id="category">
          <CategoryRail
            activeCategory={activeCategory}
            categories={categories}
            categoryIcons={categoryIcons}
            isLoading={isLoading}
            onSelect={handleCategorySelect}
            showSkeletons={showSkeletons}
            skeletonItems={12}
            t={t}
          />

          <div
            aria-busy={isRefreshing}
            className={`category-results${isRefreshing ? " is-refreshing" : ""}`}
          >
            {categoryNotice}
            {isRefreshing ? <span className="results-refresh-indicator" aria-hidden="true" /> : null}
            <div className="tool-grid" id="tools">
              {toolLoadError && tools.length === 0 ? (
                <PublicLoadError busy={isLoading} message={toolLoadError} onRetry={onRetry} t={t} />
              ) : isLoading ? (
                <SkeletonVisibility visible={showSkeletons}>
                  {Array.from({ length: CATEGORY_PAGE_SIZE }).map((_, index) => (
                    <ToolCardSkeleton key={index} />
                  ))}
                </SkeletonVisibility>
              ) : tools.length > 0 ? (
                tools.map((tool, index) => (
                  <ToolCard
                    key={tool.id}
                    priority={index < 8}
                    proxySettings={proxySettings}
                    tool={tool}
                    t={t}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-title">
                    <PanelLeft size={24} />
                    <h2>
                      {totalToolCount === 0
                          ? t.empty.libraryTitle
                          : t.empty.title}
                    </h2>
                  </div>
                  <p>
                    {totalToolCount === 0
                        ? t.empty.libraryDescription
                        : t.empty.description}
                  </p>
                  {totalToolCount === 0 ? (
                    <a
                      className="primary-button empty-state-action"
                      href={getAdminPath("import-export")}
                    >
                      {t.empty.libraryAction}
                      <ArrowUpRight size={15} />
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            {currentPage > 1 || (tools.length > 0 && (hasMore || (totalPages ?? 1) > 1)) ? (
              <DirectoryPagination
                currentPage={currentPage}
                hasNextPage={hasMore}
                isLoading={isLoadingMore}
                onPageChange={onPageChange}
                t={t}
                totalPages={totalPages}
              />
            ) : null}
          </div>
        </section>
      </main>

      <HomeFooter t={t} />
    </div>
  );
}

function ArticlesPage({
  activeCategory,
  articles,
  categories,
  categoryIcons,
  categoryNotice,
  currentPage,
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  isRefreshing,
  locale,
  onLocaleChange,
  onPageChange,
  onRetry,
  onThemeChange,
  searchArticles,
  searchTools,
  setActiveCategory,
  showSkeletons,
  totalArticleCount,
  t,
  themeMode
}: {
  activeCategory: string;
  articles: ArticleSummary[];
  categories: string[];
  categoryIcons: CategoryIconSettings["articles"];
  categoryNotice: ReactNode;
  currentPage: number;
  error: string;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  setActiveCategory: (category: string) => void;
  showSkeletons: boolean;
  totalArticleCount: number;
  t: Messages;
  themeMode: ThemeMode;
}) {
  const articleText = getArticleText(locale);
  const totalPages = Math.max(1, Math.ceil(totalArticleCount / 20));

  function handleCategorySelect(category: string) {
    setActiveCategory(category);
    scrollPageToTop();
  }

  return (
    <div className="home-shell">
      <HomeHeader
        activePage="articles"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        t={t}
        themeMode={themeMode}
      />

      <main className="category-page articles-page">
        <section className="category-page-hero">
          <div>
            <h1>{t.articlesPage.title}</h1>
            <p>{t.articlesPage.description}</p>
          </div>
        </section>

        <section className="directory-layout category-directory article-directory">
          <CategoryRail
            activeCategory={activeCategory}
            categories={categories}
            categoryIcons={categoryIcons}
            isLoading={isLoading}
            onSelect={handleCategorySelect}
            showSkeletons={showSkeletons}
            skeletonItems={6}
            t={t}
          />

          <div
            aria-busy={isRefreshing}
            className={`category-results article-results${isRefreshing ? " is-refreshing" : ""}`}
          >
            {categoryNotice}
            {isRefreshing ? <span className="results-refresh-indicator" aria-hidden="true" /> : null}
            <section className="article-page-list" aria-label={t.articlesPage.title}>
              {error && articles.length === 0 ? (
                <PublicLoadError busy={isLoading} message={error} onRetry={onRetry} t={t} />
              ) : isLoading ? (
                <SkeletonVisibility visible={showSkeletons}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <ArticleItemSkeleton key={index} />
                  ))}
                </SkeletonVisibility>
              ) : articles.length > 0 ? (
                articles.map((article) => (
                  <ArticleListItem
                    article={article}
                    articleText={articleText}
                    key={article.id}
                  />
                ))
              ) : (
                <div className="empty-state article-empty-state">
                  <div className="empty-state-title">
                    <FileText size={24} />
                    <h2>
                      {totalArticleCount === 0
                          ? articleText.publicEmptyTitle
                          : articleText.noMatchTitle}
                    </h2>
                  </div>
                  <p>
                    {totalArticleCount === 0
                        ? articleText.publicEmptyDescription
                        : articleText.noMatchDescription}
                  </p>
                </div>
              )}
            </section>
            {currentPage > 1 || (articles.length > 0 && totalPages > 1) ? (
              <DirectoryPagination
                currentPage={currentPage}
                hasNextPage={hasMore && currentPage < totalPages}
                isLoading={isLoadingMore}
                onPageChange={onPageChange}
                t={t}
                totalPages={totalPages}
              />
            ) : null}
          </div>
        </section>
      </main>

      <HomeFooter t={t} />
    </div>
  );
}

function ArticleDetailPage({
  articleSlug,
  locale,
  onLocaleChange,
  onThemeChange,
  searchArticles,
  searchTools,
  t,
  themeMode
}: {
  articleSlug: string;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  t: Messages;
  themeMode: ThemeMode;
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestPendingRef = useRef(false);
  const articleText = getArticleText(locale);
  const notFound = error instanceof Error && "status" in error && error.status === 404;
  const loadErrorMessage = error ? getLocalizedErrorMessage(error, t) : "";
  const siteSettings = useSiteSettings();
  const proxySettings = useProxySettings();
  const showSkeleton = useLoadingSkeleton(isLoading);
  const articleSearchParams = new URLSearchParams(window.location.search);
  const isPreview = articleSearchParams.get("preview") === "1";
  const previewContentItemId = articleSearchParams.get("contentItem") ?? "";
  const isPreviewDocument =
    articleSearchParams.has("preview") || articleSearchParams.has("contentItem");
  const articleDisplayTitle = article ? getArticleDisplayTitle(article) : "";
  const articleDisplaySummary = article
    ? cleanArticleDisplayText(article.summary)
    : "";
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function refreshArticle() {
      requestPendingRef.current = true;
      setIsLoading(true);

      try {
        const previewToken = isPreview || previewContentItemId
          ? localStorage.getItem("htools_token") ?? ""
          : "";
        let nextArticle: Article;

        if (previewContentItemId) {
          if (!previewToken) {
            throw new Error("Unauthorized.");
          }

          const { loadContentItemArticlePreview } = await import("./admin-api");
          nextArticle = await loadContentItemArticlePreview(
            previewContentItemId,
            previewToken,
            { signal: controller.signal }
          );
        } else if (isPreview && previewToken) {
          const { loadArticlePreview } = await import("./admin-api");
          nextArticle = await loadArticlePreview(articleSlug, previewToken, { signal: controller.signal });
        } else {
          nextArticle = await loadArticle(articleSlug, { signal: controller.signal });
        }

        if (active) {
          setArticle(nextArticle);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setArticle(null);
          setError(loadError);
        }
      } finally {
        if (active) {
          requestPendingRef.current = false;
          setIsLoading(false);
        }
      }
    }

    void refreshArticle();

    return () => {
      active = false;
      controller.abort();
    };
  }, [articleSlug, isPreview, previewContentItemId, retryCount]);

  function retryArticle() {
    if (requestPendingRef.current) return;
    requestPendingRef.current = true;
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    if (isLoading) {
      syncDocumentMetadata({
        title: formatPublicDocumentTitle(t.articlesPage.title, siteSettings),
        description: t.articlesPage.description,
        robots: NO_INDEX_ROBOTS
      });
      return;
    }

    if (article) {
      syncDocumentMetadata({
        title: formatPublicDocumentTitle(articleDisplayTitle, siteSettings),
        description: articleDisplaySummary || t.articlesPage.description,
        robots: isPreviewDocument ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
        type: "article",
        image: article.coverImage,
        imageAlt: articleDisplayTitle,
        structuredData:
          isPreviewDocument
            ? null
            : createArticleStructuredData({
                settings: siteSettings,
                locale,
                title: articleDisplayTitle,
                description: articleDisplaySummary || t.articlesPage.description,
                image: article.coverImage,
                publishedAt:
                  article.published_at ??
                  article.publishedAt ??
                  article.created_at ??
                  article.updated_at,
                modifiedAt:
                  article.updated_at ??
                  article.published_at ??
                  article.publishedAt ??
                  article.created_at
              })
      });
      return;
    }

    syncDocumentMetadata({
      title: formatPublicDocumentTitle(notFound ? articleText.notFoundTitle : t.empty.connectionTitle, siteSettings),
      description: notFound ? articleText.notFoundDescription : loadErrorMessage,
      robots: NO_INDEX_ROBOTS
    });
  }, [
    article,
    articleDisplaySummary,
    articleDisplayTitle,
    articleText.notFoundDescription,
    articleText.notFoundTitle,
    isLoading,
    loadErrorMessage,
    notFound,
    isPreview,
    isPreviewDocument,
    locale,
    previewContentItemId,
    siteSettings,
    t.articlesPage.description,
    t.articlesPage.title,
    t.empty.connectionTitle
  ]);

  return (
    <div className="home-shell">
      <HomeHeader
        activePage="articles"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        t={t}
        themeMode={themeMode}
      />

      <main className="content-page article-detail-page">
        {Boolean(error) && !notFound ? (
          <PublicLoadError busy={isLoading} message={loadErrorMessage} onRetry={retryArticle} t={t}>
            <a className="ghost-button empty-state-action" href="/articles">
              {articleText.backToArticles}
              <ArrowUpRight size={15} />
            </a>
          </PublicLoadError>
        ) : isLoading ? (
          <SkeletonVisibility visible={showSkeleton}>
            <ArticleDetailContentSkeleton
              backLink={{ href: "/articles", label: articleText.backToArticles }}
            />
          </SkeletonVisibility>
        ) : article ? (
          <ArticleDetailContent
            article={article}
            backLink={{ href: "/articles", label: articleText.backToArticles }}
            locale={locale}
            proxySettings={proxySettings}
          />
        ) : (
          <section className="empty-state article-empty-state">
            <div className="empty-state-title">
              <CircleAlert size={24} />
              <h2>{articleText.notFoundTitle}</h2>
            </div>
            <p>{articleText.notFoundDescription}</p>
            <a className="primary-button empty-state-action" href="/articles">
              {articleText.backToArticles}
              <ArrowUpRight size={15} />
            </a>
          </section>
        )}
      </main>

      <HomeFooter t={t} />
    </div>
  );
}

function ArticleListItem({
  article,
  articleText
}: {
  article: ArticleSummary;
  articleText: ReturnType<typeof getArticleText>;
}) {
  const displayDate = formatAdminDate(article.published_at ?? article.updated_at);
  const displayTitle = getArticleDisplayTitle(article);
  const displaySummary = cleanArticleDisplayText(article.summary);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressResetTimerRef = useRef<number | null>(null);
  const ignoreNextClickRef = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (longPressResetTimerRef.current !== null) {
        window.clearTimeout(longPressResetTimerRef.current);
      }
    };
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function scheduleLongPressReset() {
    if (!ignoreNextClickRef.current) {
      return;
    }

    if (longPressResetTimerRef.current !== null) {
      window.clearTimeout(longPressResetTimerRef.current);
    }

    longPressResetTimerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = false;
      longPressResetTimerRef.current = null;
    }, 700);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === "mouse") {
      return;
    }

    clearLongPressTimer();
    ignoreNextClickRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = true;
    }, 520);
  }

  function handlePointerEnd() {
    clearLongPressTimer();
    scheduleLongPressReset();
  }

  function handleArticleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!ignoreNextClickRef.current) {
      return;
    }

    event.preventDefault();
    ignoreNextClickRef.current = false;
  }

  function handleArticleContextMenu(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!ignoreNextClickRef.current) {
      return;
    }

    event.preventDefault();
    clearLongPressTimer();
    scheduleLongPressReset();
  }

  return (
    <a
      className="article-item"
      href={createArticleHref(article.slug)}
      draggable={false}
      onClick={handleArticleClick}
      onContextMenu={handleArticleContextMenu}
      onDragStart={preventCardDrag}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerEnd}
      onPointerUp={handlePointerEnd}
    >
      <div>
        <span className="article-date">
          <Clock3 size={16} />
          {displayDate ? articleText.publishedOn(displayDate) : article.category}
        </span>
        <h3>{displayTitle}</h3>
        <p>{displaySummary}</p>
        <CompactTagRow fallbackCategory={article.category} tags={article.tags} />
      </div>
    </a>
  );
}

function ArticleItemSkeleton() {
  return (
    <div className="article-item article-item-skeleton" aria-hidden="true">
      <div>
        <span className="article-date">
          <span className="skeleton-shimmer skeleton-line is-short" />
        </span>
        <h3><span className="skeleton-shimmer skeleton-line is-medium" /></h3>
        <p><span className="skeleton-shimmer skeleton-line is-long" /></p>
        <div className="tag-row-shell">
          <div className="tag-row">
            <span className="skeleton-shimmer skeleton-line is-short" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage({
  error,
  locale,
  onLocaleChange,
  onRetry,
  onThemeChange,
  searchArticles,
  searchTools,
  siteSettingsLoaded,
  t,
  themeMode
}: {
  error: string;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onRetry: () => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  siteSettingsLoaded: boolean;
  t: Messages;
  themeMode: ThemeMode;
}) {
  const siteSettings = useSiteSettings();
  const proxySettings = useProxySettings();
  const showSettingsSkeleton = useLoadingSkeleton(!siteSettingsLoaded);
  const aboutContent = getAboutContentSettings(siteSettings)[locale];

  return (
    <div className="home-shell">
      <HomeHeader
        activePage="about"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        t={t}
        themeMode={themeMode}
      />

      <main className="category-page public-page about-page">
        <section className="public-page-body public-page-body-prose">
          <article className={`about-content ${!siteSettingsLoaded && !error ? "is-loading" : ""}`}>
            {error ? (
              <PublicLoadError busy={!siteSettingsLoaded} message={error} onRetry={onRetry} t={t} />
            ) : siteSettingsLoaded ? (
              <Suspense
                fallback={
                  <LoadingSkeleton>
                    <AboutContentSkeleton />
                  </LoadingSkeleton>
                }
              >
                <MarkdownContent
                  content={aboutContent}
                  locale={locale}
                  proxySettings={proxySettings}
                />
              </Suspense>
            ) : (
              <SkeletonVisibility visible={showSettingsSkeleton}>
                <AboutContentSkeleton />
              </SkeletonVisibility>
            )}
          </article>
        </section>
      </main>

      <HomeFooter t={t} />
    </div>
  );
}

function AboutContentSkeleton() {
  return <ArticleBodySkeleton />;
}

function LegalPage({
  error,
  kind,
  locale,
  onLocaleChange,
  onRetry,
  onThemeChange,
  searchArticles,
  searchTools,
  siteSettingsLoaded,
  t,
  themeMode
}: {
  error: string;
  kind: LegalPageKind;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onRetry: () => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  searchArticles: ArticleSummary[];
  searchTools: Tool[];
  siteSettingsLoaded: boolean;
  t: Messages;
  themeMode: ThemeMode;
}) {
  const siteSettings = useSiteSettings();
  const proxySettings = useProxySettings();
  const showSettingsSkeleton = useLoadingSkeleton(!siteSettingsLoaded);
  const content = getLegalContentSettings(siteSettings, kind)[locale];

  return (
    <div className="home-shell">
      <HomeHeader
        activePage="about"
        locale={locale}
        onLocaleChange={onLocaleChange}
        onThemeChange={onThemeChange}
        searchArticles={searchArticles}
        searchTools={searchTools}
        t={t}
        themeMode={themeMode}
      />

      <main className="category-page public-page legal-page">
        <section className="public-page-body public-page-body-prose">
          <article className="about-content">
            {error ? (
              <PublicLoadError busy={!siteSettingsLoaded} message={error} onRetry={onRetry} t={t} />
            ) : siteSettingsLoaded ? (
              <Suspense
                fallback={
                  <LoadingSkeleton>
                    <AboutContentSkeleton />
                  </LoadingSkeleton>
                }
              >
                <MarkdownContent
                  content={content}
                  locale={locale}
                  proxySettings={proxySettings}
                />
              </Suspense>
            ) : (
              <SkeletonVisibility visible={showSettingsSkeleton}>
                <AboutContentSkeleton />
              </SkeletonVisibility>
            )}
          </article>
        </section>
      </main>

      <HomeFooter t={t} />
    </div>
  );
}


function HomeHeader({
  activePage,
  locale,
  onLocaleChange,
  onThemeChange,
  searchArticles = [],
  searchTools = [],
  showSearch = true,
  t,
  themeMode
}: {
  activePage: PublicPage;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  searchArticles?: ArticleSummary[];
  searchTools?: Tool[];
  showSearch?: boolean;
  t: Messages;
  themeMode: ThemeMode;
}) {
  usePointerFocusRelease();
  const {
    closeMenu: closePublicUtilityMenu,
    getMenuId: getPublicUtilityMenuId,
    handleMenuKeyDown: handlePublicUtilityMenuKeyDown,
    handleTriggerKeyDown: handlePublicUtilityMenuTriggerKeyDown,
    openMenu,
    setOpenMenu,
    toggleMenu: togglePublicUtilityMenu
  } = useUtilityMenuKeyboard<"locale" | "theme">("public");
  const publicUtilityMenuController: UtilityMenuController = {
    closeMenu: closePublicUtilityMenu,
    getMenuId: getPublicUtilityMenuId,
    handleMenuKeyDown: handlePublicUtilityMenuKeyDown,
    handleTriggerKeyDown: handlePublicUtilityMenuTriggerKeyDown,
    openMenu,
    toggleMenu: togglePublicUtilityMenu
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileNavClosing, setIsMobileNavClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteArticleSearch, setRemoteArticleSearch] = useState<{
    query: string;
    articles: ArticleSummary[];
  } | null>(null);
  const [isRemoteArticleSearchLoading, setIsRemoteArticleSearchLoading] =
    useState(false);
  const [remoteToolSearch, setRemoteToolSearch] = useState<{
    query: string;
    tools: Tool[];
  } | null>(null);
  const [isRemoteToolSearchLoading, setIsRemoteToolSearchLoading] =
    useState(false);
  const searchShortcutLabel = "⌘ K";
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileNavCloseRef = useRef<HTMLButtonElement>(null);
  const mobileNavCloseTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const articleSearchRequestIdRef = useRef(0);
  const toolSearchRequestIdRef = useRef(0);
  const siteSettings = useSiteSettings();
  const proxySettings = useProxySettings();
  const siteName = getSiteDisplayName(siteSettings);
  const isMobileNavVisible = isMobileNavOpen || isMobileNavClosing;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const localToolSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return searchTools
      .filter((tool) => {
        const haystack = [
          tool.name,
          tool.description,
          tool.category,
          getCategoryLabel(tool.category, t),
          ...tool.tags
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearchQuery);
      })
      .slice(0, 8);
  }, [normalizedSearchQuery, searchTools, t]);
  const searchResults =
    remoteToolSearch?.query === normalizedSearchQuery
      ? remoteToolSearch.tools
      : localToolSearchResults;
  const localArticleSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return searchArticles
      .filter((article) => {
        const displayTitle = getArticleDisplayTitle(article);
        const haystack = [
          displayTitle,
          article.title,
          article.summary,
          article.category,
          getCategoryLabel(article.category, t),
          ...article.tags
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearchQuery);
      })
      .slice(0, 6);
  }, [normalizedSearchQuery, searchArticles, t]);
  const articleSearchResults =
    remoteArticleSearch?.query === normalizedSearchQuery
      ? remoteArticleSearch.articles
      : localArticleSearchResults;
  const canOpenGlobalSearch = showSearch || activePage === "home";
  const isSearchOverlayOpen = canOpenGlobalSearch && isSearchOpen;
  const shouldLockBodyScroll = isSearchOverlayOpen || isMobileNavVisible;
  const searchOverlayFocus = useOverlayFocusManagement({
    active: isSearchOverlayOpen,
    containerRef: searchPanelRef,
    initialFocusRef: searchInputRef,
    onEscape: closeSearch,
    returnFocusRef: searchTriggerRef
  });
  useVisualViewportKeyboard({
    active: isSearchOverlayOpen,
    containerRef: searchPanelRef
  });
  const mobileNavFocus = useOverlayFocusManagement({
    active: isMobileNavOpen,
    containerRef: mobileDrawerRef,
    initialFocusRef: mobileNavCloseRef,
    onEscape: closeMobileNav,
    returnFocusRef: mobileMenuTriggerRef
  });

  function openMobileNav() {
    if (mobileNavCloseTimerRef.current !== null) {
      window.clearTimeout(mobileNavCloseTimerRef.current);
      mobileNavCloseTimerRef.current = null;
    }

    setOpenMenu(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsMobileNavClosing(false);
    setIsMobileNavOpen(true);
  }

  function updateMobileNavClosed(immediate: boolean) {
    if (!isMobileNavOpen && !isMobileNavClosing) {
      return;
    }

    if (mobileNavCloseTimerRef.current !== null) {
      window.clearTimeout(mobileNavCloseTimerRef.current);
    }

    setOpenMenu(null);
    setIsMobileNavOpen(false);

    if (immediate) {
      setIsMobileNavClosing(false);
      mobileNavCloseTimerRef.current = null;
      return;
    }

    setIsMobileNavClosing(true);
    mobileNavCloseTimerRef.current = window.setTimeout(() => {
      setIsMobileNavClosing(false);
      mobileNavCloseTimerRef.current = null;
    }, MOBILE_NAV_EXIT_MS);
  }

  function closeMobileNav() {
    updateMobileNavClosed(false);
  }

  function closeMobileNavImmediately() {
    updateMobileNavClosed(true);
  }

  useEffect(() => {
    if (!normalizedSearchQuery) {
      toolSearchRequestIdRef.current += 1;
      setRemoteToolSearch(null);
      setIsRemoteToolSearchLoading(false);
      return;
    }

    const requestId = toolSearchRequestIdRef.current + 1;
    toolSearchRequestIdRef.current = requestId;
    setIsRemoteToolSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const tools = await searchPublicTools(normalizedSearchQuery);
        if (toolSearchRequestIdRef.current === requestId) {
          setRemoteToolSearch({ query: normalizedSearchQuery, tools });
        }
      } catch {
        // Keep any currently loaded page matches when remote search fails.
      } finally {
        if (toolSearchRequestIdRef.current === requestId) {
          setIsRemoteToolSearchLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [normalizedSearchQuery]);

  useEffect(() => {
    if (!normalizedSearchQuery) {
      articleSearchRequestIdRef.current += 1;
      setRemoteArticleSearch(null);
      setIsRemoteArticleSearchLoading(false);
      return;
    }

    const requestId = articleSearchRequestIdRef.current + 1;
    articleSearchRequestIdRef.current = requestId;
    setIsRemoteArticleSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const articles = await searchPublicArticles(normalizedSearchQuery);

        if (articleSearchRequestIdRef.current === requestId) {
          setRemoteArticleSearch({
            query: normalizedSearchQuery,
            articles
          });
        }
      } catch {
        // Keep the local title/summary results when remote full-text search fails.
      } finally {
        if (articleSearchRequestIdRef.current === requestId) {
          setIsRemoteArticleSearchLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [normalizedSearchQuery]);

  useEffect(() => {
    return () => {
      if (mobileNavCloseTimerRef.current !== null) {
        window.clearTimeout(mobileNavCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if (!canOpenGlobalSearch) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    }

    document.addEventListener("keydown", handleSearchShortcut);

    return () => {
      document.removeEventListener("keydown", handleSearchShortcut);
    };
  }, [canOpenGlobalSearch, isMobileNavClosing, isMobileNavOpen]);

  useEffect(() => {
    if (!shouldLockBodyScroll) {
      return;
    }

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousOverlayScrollOffset =
      document.documentElement.style.getPropertyValue("--overlay-scroll-offset");

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.setProperty(
      "--overlay-scroll-offset",
      `${scrollY}px`
    );
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.left = "0";
    document.body.style.right = "0";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      if (previousOverlayScrollOffset) {
        document.documentElement.style.setProperty(
          "--overlay-scroll-offset",
          previousOverlayScrollOffset
        );
      } else {
        document.documentElement.style.removeProperty("--overlay-scroll-offset");
      }
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      });
    };
  }, [shouldLockBodyScroll]);

  function openSearch() {
    setOpenMenu(null);
    closeMobileNavImmediately();
    setSearchQuery("");
    setIsSearchOpen(true);
  }

  function closeSearch() {
    setSearchQuery("");
    setIsSearchOpen(false);
  }

  function handleSearchInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    if (normalizedSearchQuery && searchResults[0]) {
      event.preventDefault();
      window.open(
        proxifyUrl(searchResults[0].url, proxySettings),
        "_blank",
        "noopener,noreferrer"
      );
      closeSearch();
      return;
    }

    if (normalizedSearchQuery && articleSearchResults[0]) {
      event.preventDefault();
      window.location.href = createArticleHref(articleSearchResults[0].slug);
      return;
    }

    if (visibleCommandActions[0]) {
      event.preventDefault();
      window.location.href = visibleCommandActions[0].href;
    }
  }

  function closeOnBackdropMouseDown(
    event: ReactMouseEvent<HTMLElement>,
    onClose: () => void
  ) {
    if (event.currentTarget === event.target) {
      onClose();
    }
  }

  function handleNavClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    spawnNavClickBurst(event.clientX, event.clientY);

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const targetUrl = new URL(event.currentTarget.href);
    const currentUrl = new URL(window.location.href);
    event.preventDefault();

    if (
      targetUrl.pathname === currentUrl.pathname &&
      targetUrl.search === currentUrl.search &&
      targetUrl.hash === currentUrl.hash
    ) {
      return;
    }

    window.setTimeout(() => {
      window.location.href = targetUrl.href;
    }, NAV_BURST_NAVIGATION_DELAY_MS);
  }

  const publicNavLinks: Array<{
    href: string;
    Icon: typeof Boxes;
    label: string;
    page: Exclude<PublicPage, "home">;
  }> = [
    { href: "/tools", Icon: Wrench, label: t.nav.category, page: "category" },
    { href: "/articles", Icon: FileText, label: t.nav.articles, page: "articles" },
    { href: "/submit", Icon: PackagePlus, label: t.actions.submitTool, page: "submit" },
    { href: "/about", Icon: BadgeCheck, label: t.nav.about, page: "about" }
  ];
  const mobileNavLinks: Array<{
    href: string;
    Icon: typeof Boxes;
    label: string;
    page: PublicPage;
  }> = [
    { href: "/", Icon: House, label: t.actions.home, page: "home" },
    ...publicNavLinks
  ];
  const searchCommandText =
    locale === "zh"
      ? {
          actionsTitle: "常用操作",
          resultsTitle: "工具结果",
          articleResultsTitle: "文章结果",
          noResultsTitle: "没有找到结果",
          noResultsDescription: "换个关键词，或者直接打开常用入口。",
          browseTools: "浏览全部工具和分类",
          readArticles: "阅读文章与资源整理",
          submitTool: "推荐一个新的开源项目",
          about: "了解本站和项目背景",
          admin: "进入后台管理"
        }
      : {
          actionsTitle: "Quick actions",
          resultsTitle: "Tool results",
          articleResultsTitle: "Article results",
          noResultsTitle: "No results",
          noResultsDescription: "Try another keyword or open a common destination.",
          browseTools: "Browse all tools and categories",
          readArticles: "Read articles and resource notes",
          submitTool: "Recommend a new open-source project",
          about: "Learn about this site and project",
          admin: "Open the admin console"
        };
  const commandActions = [
    {
      href: "/tools",
      Icon: Wrench,
      label: t.nav.category,
      description: searchCommandText.browseTools
    },
    {
      href: "/articles",
      Icon: FileText,
      label: t.nav.articles,
      description: searchCommandText.readArticles
    },
    {
      href: "/submit",
      Icon: PackagePlus,
      label: t.actions.submitTool,
      description: searchCommandText.submitTool
    },
    {
      href: "/about",
      Icon: BadgeCheck,
      label: t.nav.about,
      description: searchCommandText.about
    },
    {
      href: "/admin",
      Icon: LayoutDashboard,
      label: t.nav.admin,
      description: searchCommandText.admin
    }
  ];
  const visibleCommandActions = (
    normalizedSearchQuery
      ? commandActions.filter((action) =>
          `${action.label} ${action.description}`
            .toLowerCase()
            .includes(normalizedSearchQuery)
        )
      : commandActions
  ).slice(0, 5);
  const shouldRenderSearchTrigger = canOpenGlobalSearch;
  const shouldRenderTopbarMenus = !isMobileNavVisible;
  const searchTriggerClassName = `search-box topbar-search search-trigger${
    showSearch ? "" : " mobile-only-search"
  }`;
  const mobileNavOverlay =
    typeof document !== "undefined" && isMobileNavVisible
      ? createPortal(
          <div
            className={`mobile-nav-layer ${
              isMobileNavClosing ? "is-closing" : "is-open"
            }`}
            onMouseDown={(event) => closeOnBackdropMouseDown(event, closeMobileNav)}
          >
            <aside
              ref={mobileDrawerRef}
              className="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              aria-hidden={isMobileNavClosing}
              inert={isMobileNavClosing}
              tabIndex={-1}
              onKeyDown={mobileNavFocus.handleKeyDown}
            >
              <div className="mobile-nav-head">
                <a
                  className="mobile-drawer-brand"
                  href="/"
                  onClick={closeMobileNav}
                >
                  <SiteBrandIdentity showSubtitle />
                </a>
                <button
                  ref={mobileNavCloseRef}
                  className="mobile-nav-close"
                  type="button"
                  aria-label={t.actions.close}
                  onClick={closeMobileNav}
                >
                  <X size={26} />
                </button>
              </div>

              <nav className="mobile-nav-list" aria-label="Mobile primary">
                <span className="mobile-nav-section">{t.nav.tools}</span>
                {mobileNavLinks.map((item) => {
                  const Icon = item.Icon;

                  return (
                    <a
                      className={`mobile-nav-link ${
                        activePage === item.page ? "is-active" : ""
                      }`}
                      href={item.href}
                      key={item.page}
                      onClick={(event) => {
                        closeMobileNav();
                        handleNavClick(event);
                      }}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="mobile-nav-bottom">
                <UtilityMenuControls
                  className="mobile-nav-utility"
                  controller={publicUtilityMenuController}
                  iconSize={18}
                  locale={locale}
                  localeControlClassName="mobile-utility-menu"
                  onLocaleChange={onLocaleChange}
                  onThemeChange={onThemeChange}
                  t={t}
                  themeControlClassName="mobile-utility-menu"
                  themeMode={themeMode}
                />

                <div className="mobile-admin-card">
                  <span className="mobile-admin-card-copy">
                    <strong>{t.actions.login}</strong>
                    <small>{locale === "zh" ? "进入控制台" : "Enter console"}</small>
                  </span>
                  <a
                    className="icon-button"
                    href="/admin"
                    aria-label={t.actions.login}
                    onClick={closeMobileNav}
                  >
                    <LogIn size={18} />
                  </a>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <header
        className={`home-topbar ${
          isMobileNavVisible ? "is-mobile-nav-visible" : ""
        }`}
      >
        <button
          ref={mobileMenuTriggerRef}
          className="mobile-menu-button"
          type="button"
          aria-label="Open menu"
          aria-expanded={isMobileNavOpen}
          onClick={openMobileNav}
        >
          <Menu size={25} />
        </button>

        <a className="brand" href="/" aria-label={`${siteName} home`}>
          <SiteBrandIdentity />
        </a>

        <nav className="desktop-nav home-nav" aria-label="Primary">
          {publicNavLinks.map((item) => (
            <a
              className={`nav-link ${activePage === item.page ? "is-active" : ""}`}
              href={item.href}
              key={item.page}
              onClick={handleNavClick}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div
          className={`home-topbar-actions ${showSearch ? "" : "no-search"}`}
        >
          {shouldRenderSearchTrigger ? (
            <button
              ref={searchTriggerRef}
              className={searchTriggerClassName}
              type="button"
              aria-label={t.search.trigger}
              aria-expanded={isSearchOpen}
              onClick={openSearch}
            >
              <Search size={19} />
              <span className="search-trigger-label">{t.search.placeholder}</span>
              <kbd className="search-trigger-shortcut">{searchShortcutLabel}</kbd>
            </button>
          ) : null}
          <UtilityMenuControls
            className="home-topbar-utility-menus"
            controller={publicUtilityMenuController}
            iconSize={18}
            locale={locale}
            localeControlClassName="locale-control"
            onLocaleChange={onLocaleChange}
            onThemeChange={onThemeChange}
            showMenus={shouldRenderTopbarMenus}
            t={t}
            themeControlClassName="theme-control"
            themeMode={themeMode}
          />
          <a className="login-button" href="/admin">
            <UserRound className="login-icon" size={21} />
            <span className="login-label">{t.actions.login}</span>
          </a>
        </div>
      </header>

      {mobileNavOverlay}

      {isSearchOverlayOpen ? (
        <div
          className="global-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.search.placeholder}
          onMouseDown={(event) => closeOnBackdropMouseDown(event, closeSearch)}
        >
          <div
            ref={searchPanelRef}
            className="global-search-panel"
            tabIndex={-1}
            onKeyDown={searchOverlayFocus.handleKeyDown}
          >
            <div className="global-search-input-row">
              <Search size={22} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                placeholder={t.search.placeholder}
                type="text"
              />
              <kbd className="global-search-shortcut">{searchShortcutLabel}</kbd>
              <button
                className="global-search-close"
                type="button"
                aria-label={t.actions.close}
                onClick={closeSearch}
              >
                <X size={22} />
              </button>
            </div>

            <div className="global-search-body">
              {visibleCommandActions.length > 0 ? (
                <section className="global-search-section">
                  <div className="global-search-section-title">
                    {searchCommandText.actionsTitle}
                  </div>
                  <div className="global-search-results">
                    {visibleCommandActions.map((action) => {
                      const Icon = action.Icon;

                      return (
                        <a
                          className="global-search-result is-command"
                          href={action.href}
                          key={action.href}
                          onClick={closeSearch}
                        >
                          <Icon className="global-search-result-icon" size={20} />
                          <div className="global-search-result-copy">
                            <strong>{action.label}</strong>
                            <span>{action.description}</span>
                          </div>
                          <ArrowUpRight size={18} />
                        </a>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {normalizedSearchQuery && searchResults.length > 0 ? (
                <section className="global-search-section">
                  <div className="global-search-section-title">
                    {searchCommandText.resultsTitle}
                  </div>
                  <div className="global-search-results">
                    {searchResults.map((tool) => (
                      <a
                        className="global-search-result"
                        href={proxifyUrl(tool.url, proxySettings)}
                        key={tool.id}
                        target="_blank"
                        rel="noreferrer"
                        onClick={closeSearch}
                      >
                        <Wrench className="global-search-result-icon" size={20} />
                        <div className="global-search-result-copy">
                          <strong>{tool.name}</strong>
                          <span>{tool.description}</span>
                          <div className="global-search-tags">
                            <CompactTagRow
                              fallbackCategory={tool.category}
                              tags={tool.tags}
                            />
                          </div>
                        </div>
                        <ArrowUpRight size={18} />
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {normalizedSearchQuery && articleSearchResults.length > 0 ? (
                <section className="global-search-section">
                  <div className="global-search-section-title">
                    {searchCommandText.articleResultsTitle}
                  </div>
                  <div className="global-search-results">
                    {articleSearchResults.map((article) => (
                      <a
                        className="global-search-result"
                        href={createArticleHref(article.slug)}
                        key={article.id}
                        onClick={closeSearch}
                      >
                        <FileText className="global-search-result-icon" size={20} />
                        <div className="global-search-result-copy">
                          <strong>{getArticleDisplayTitle(article)}</strong>
                          <span>{cleanArticleDisplayText(article.summary)}</span>
                          <div className="global-search-tags">
                            <CompactTagRow
                              fallbackCategory={article.category}
                              tags={article.tags}
                            />
                          </div>
                        </div>
                        <ArrowUpRight size={18} />
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {normalizedSearchQuery &&
              !isRemoteToolSearchLoading &&
              !isRemoteArticleSearchLoading &&
              searchResults.length === 0 &&
              articleSearchResults.length === 0 &&
              visibleCommandActions.length === 0 ? (
                <div className="global-search-empty">
                  <h2>{searchCommandText.noResultsTitle}</h2>
                  <p>{searchCommandText.noResultsDescription}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="home-section-title">
      {icon}
      {title}
    </h2>
  );
}

function getToolDemoHref(tool: Tool) {
  const demoUrl = normalizeHttpUrlInput(tool.demoUrl);

  if (!demoUrl || !isValidHttpUrl(demoUrl)) {
    return "";
  }

  const officialUrl = normalizeHttpUrlInput(tool.url);

  if (officialUrl && normalizeUrlForImport(demoUrl) === normalizeUrlForImport(officialUrl)) {
    return "";
  }

  return demoUrl;
}

function ToolCardSkeleton({ home = false }: { home?: boolean }) {
  return (
    <article aria-hidden="true" className={`tool-card tool-card-skeleton${home ? " home-tool-card" : ""}`}>
      <div className="tool-card-media">
        <div className="tool-preview-shell">
          <div className="tool-image-link tool-card-skeleton-media" />
        </div>
      </div>
      <div className="tool-body">
        {home ? (
          <h3><span className="skeleton-shimmer skeleton-line is-medium" /></h3>
        ) : (
          <div className="tool-heading">
            <h2><span className="skeleton-shimmer skeleton-line is-medium" /></h2>
          </div>
        )}
        <p>
          <span className="skeleton-shimmer skeleton-line" />
          <span className="skeleton-shimmer skeleton-line is-long" />
        </p>
        <div className="tool-card-footer">
          <div className="tag-row-shell">
            <div className="tag-row">
              <span className="skeleton-shimmer skeleton-line is-short" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ToolPreviewActions({
  demoHref,
  isGitHubPreview,
  priority,
  proxySettings,
  t,
  tool
}: {
  demoHref: string;
  isGitHubPreview: boolean;
  priority?: boolean;
  proxySettings: ProxySettings;
  t: Messages;
  tool: Tool;
}) {
  const hasDemo = Boolean(demoHref);
  const projectHref = proxifyUrl(tool.url, proxySettings);
  const proxiedDemoHref = proxifyUrl(demoHref, proxySettings);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastPointerTypeRef = useRef("");
  const suppressNextClickRef = useRef(false);
  const [isTouchSplitActive, setIsTouchSplitActive] = useState(false);
  const [isInteractionDismissed, setIsInteractionDismissed] = useState(false);

  function blurPreviewFocus() {
    const root = rootRef.current;
    const activeElement = document.activeElement;

    if (root && activeElement instanceof HTMLElement && root.contains(activeElement)) {
      activeElement.blur();
    }
  }

  useEffect(() => {
    if (!isTouchSplitActive) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;

      if (root && !root.contains(event.target as Node)) {
        setIsTouchSplitActive(false);
        setIsInteractionDismissed(false);
        blurPreviewFocus();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isTouchSplitActive]);

  useEffect(() => {
    setIsTouchSplitActive(false);
    setIsInteractionDismissed(false);
  }, [demoHref, tool.url]);

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLAnchorElement>) {
    lastPointerTypeRef.current = event.pointerType;
  }

  function openPreviewAction(anchor: HTMLAnchorElement) {
    window.open(anchor.href, "_blank", "noopener,noreferrer");
  }

  function handlePreviewActionTouchEnd(event: ReactTouchEvent<HTMLAnchorElement>) {
    if (!hasDemo) {
      return;
    }

    if (!isTouchSplitActive) {
      event.preventDefault();
      suppressNextClickRef.current = true;
      setIsTouchSplitActive(true);
      setIsInteractionDismissed(false);
      event.currentTarget.blur();
      lastPointerTypeRef.current = "";
      return;
    }

    event.preventDefault();
    suppressNextClickRef.current = true;
    setIsTouchSplitActive(false);
    setIsInteractionDismissed(true);
    event.currentTarget.blur();
    lastPointerTypeRef.current = "";
    openPreviewAction(event.currentTarget);
  }

  function handlePreviewActionClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      suppressNextClickRef.current = false;
      return;
    }

    if (!hasDemo) {
      setIsInteractionDismissed(true);
      blurActivatedLink(event);
      return;
    }

    if (event.detail === 0) {
      setIsTouchSplitActive(false);
      setIsInteractionDismissed(true);
      blurActivatedLink(event);
      return;
    }

    const pointerType = lastPointerTypeRef.current;
    const isCoarsePointer =
      pointerType === "" &&
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const isTouchPointer =
      pointerType === "touch" || pointerType === "pen" || isCoarsePointer;

    if (isTouchPointer && !isTouchSplitActive) {
      event.preventDefault();
      setIsTouchSplitActive(true);
      setIsInteractionDismissed(false);
      event.currentTarget.blur();
      lastPointerTypeRef.current = "";
      return;
    }

    setIsTouchSplitActive(false);
    setIsInteractionDismissed(true);
    blurActivatedLink(event);
    lastPointerTypeRef.current = "";
  }

  return (
    <div
      className={`tool-preview-shell ${hasDemo ? "has-demo" : ""} ${
        isTouchSplitActive ? "is-touch-active" : ""
      } ${isInteractionDismissed ? "is-action-dismissed" : ""}`}
      ref={rootRef}
      onFocus={() => setIsInteractionDismissed(false)}
      onPointerLeave={() => {
        setIsTouchSplitActive(false);
        setIsInteractionDismissed(false);
      }}
    >
      <div className={`tool-image-link ${isGitHubPreview ? "is-github-preview" : ""}`}>
        <ToolPreviewImage priority={priority} proxySettings={proxySettings} tool={tool} t={t} />
        <span
          className={`tool-card-overlay ${hasDemo ? "is-split" : ""}`}
          aria-hidden="true"
        >
          {hasDemo ? (
            <>
              <span className="tool-card-overlay-segment">
                {t.actions.visit}
                <ArrowUpRight size={20} />
              </span>
              <span className="tool-card-overlay-segment">
                {t.actions.demo}
                <ArrowUpRight size={20} />
              </span>
            </>
          ) : (
            <>
              {t.actions.viewDetails}
              <ArrowUpRight size={24} />
            </>
          )}
        </span>
      </div>
      <div className={`tool-preview-action-grid ${hasDemo ? "has-demo" : ""}`}>
        <a
          className="tool-preview-action is-project"
          href={projectHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t.actions.visit}: ${tool.name}`}
          draggable={false}
          onDragStart={preventCardDrag}
          onPointerDown={handlePreviewPointerDown}
          onTouchEnd={handlePreviewActionTouchEnd}
          onClick={handlePreviewActionClick}
        />
        {hasDemo ? (
          <a
            className="tool-preview-action is-demo"
            href={proxiedDemoHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`${t.form.demoUrl}: ${tool.name}`}
            draggable={false}
            onDragStart={preventCardDrag}
            onPointerDown={handlePreviewPointerDown}
            onTouchEnd={handlePreviewActionTouchEnd}
            onClick={handlePreviewActionClick}
          />
        ) : null}
      </div>
    </div>
  );
}

function ToolPreviewImage({
  priority = false,
  proxySettings,
  t,
  tool
}: {
  priority?: boolean;
  proxySettings: ProxySettings;
  t: Messages;
  tool: Tool;
}) {
  const source = proxifyUrl(createToolPreviewSource(tool), proxySettings, {
    resourceType: "image"
  });
  const isGitHubPreview = usesGitHubOpenGraphPreview(tool);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [source]);

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [source]);

  if (!source || failed) {
    return (
      <span className="tool-image-fallback" aria-label={t.tool.previewAlt(tool.name)}>
        <strong>{getToolInitials(tool.name)}</strong>
        <small>{tool.name}</small>
      </span>
    );
  }

  return (
    <>
      <span className="tool-image-fallback" aria-hidden="true">
        <strong>{getToolInitials(tool.name)}</strong>
        <small>{tool.name}</small>
      </span>
      <img
        className={`tool-image ${isGitHubPreview ? "is-github-preview" : ""} ${
          loaded ? "is-loaded" : ""
        }`}
        ref={imageRef}
        src={source}
        alt={t.tool.previewAlt(tool.name)}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onDragStart={preventCardDrag}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}

function HomeToolCard({
  priority = false,
  proxySettings,
  tool,
  t
}: {
  priority?: boolean;
  proxySettings: ProxySettings;
  tool: Tool;
  t: Messages;
}) {
  const demoHref = getToolDemoHref(tool);
  const isGitHubPreview = usesGitHubOpenGraphPreview(tool);
  const toolHref = proxifyUrl(tool.url, proxySettings);

  return (
    <article className="tool-card home-tool-card">
      <div className="tool-card-media">
        <ToolPreviewActions
          demoHref={demoHref}
          isGitHubPreview={isGitHubPreview}
          priority={priority}
          proxySettings={proxySettings}
          tool={tool}
          t={t}
        />
      </div>
      <div className="tool-body">
        <h3>
          <a
            className="tool-title-link"
            href={toolHref}
            target="_blank"
            rel="noreferrer"
            draggable={false}
            onDragStart={preventCardDrag}
            onClick={blurActivatedLink}
          >
            {tool.name}
          </a>
        </h3>
        <p>{tool.description}</p>
        <div className="tool-card-footer">
          <CompactTagRow fallbackCategory={tool.category} tags={tool.tags} />
        </div>
      </div>
    </article>
  );
}

type FooterLink = {
  label: string;
  href: string;
};

function HomeFooter({ t }: { t: Messages }) {
  const siteSettings = useSiteSettings();
  const proxySettings = useProxySettings();
  const footerSettings = getLocalizedFooterSettings(siteSettings, t);
  const footerCopyrightSuffix =
    t === translations.en
      ? ". All rights reserved."
      : " \u7248\u6743\u6240\u6709\uff0c\u4fdd\u7559\u6240\u6709\u6743\u5229\u3002";

  return (
    <footer className="home-footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <a className="brand" href="/">
            <SiteBrandIdentity markClassName="compact-mark" />
          </a>
          <p>{footerSettings.description}</p>
          <div className="footer-socials">
            {footerSettings.socialLinks.map((link) => (
              <FooterIconLink
                key={`${link.label}-${link.href}`}
                link={link}
                proxySettings={proxySettings}
              />
            ))}
            {footerSettings.sponsorUrl ? (
              <a
                className="coffee-button"
                href={proxifyUrl(footerSettings.sponsorUrl, proxySettings)}
                target="_blank"
                rel="noreferrer"
              >
                <Coffee size={17} />
                {footerSettings.sponsorLabel}
              </a>
            ) : null}
          </div>
        </div>

        {footerSettings.groups.map((group) => (
          <FooterColumn
            key={`${group.title}-${group.links.length}`}
            links={group.links}
            proxySettings={proxySettings}
            title={group.title}
          />
        ))}
      </div>

      <div className="footer-bottom">
        <span>
          &copy; 2026{" "}
          <a
            href={proxifyUrl(footerSettings.authorUrl, proxySettings)}
            target="_blank"
            rel="noreferrer"
          >
            {footerSettings.authorName}
          </a>
          {footerCopyrightSuffix}
        </span>
      </div>
    </footer>
  );
}

function FooterIconLink({
  link,
  proxySettings
}: {
  link: FooterLink;
  proxySettings: ProxySettings;
}) {
  const Icon = getFooterLinkIcon(link);
  const isExternal = link.href.startsWith("http");

  return (
    <a
      href={isExternal ? proxifyUrl(link.href, proxySettings) : link.href}
      aria-label={link.label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      <Icon size={18} />
    </a>
  );
}

function getFooterLinkIcon(link: FooterLink) {
  const label = link.label.trim().toLowerCase();
  const href = link.href.trim().toLowerCase();
  const host = getFooterLinkHost(link.href);
  const text = `${label} ${host} ${href}`;

  if (href.startsWith("mailto:") || matchesFooterKeyword(text, ["email", "mail", "邮箱"])) {
    return Mail;
  }

  if (matchesFooterKeyword(text, ["github", "github.com"])) {
    return Github;
  }

  if (label === "x" || host === "x.com" || host.endsWith(".x.com")) {
    return X;
  }

  if (matchesFooterKeyword(text, ["twitter", "twitter.com"])) {
    return Twitter;
  }

  if (matchesFooterKeyword(text, ["telegram", "t.me", "telegram.me"])) {
    return Send;
  }

  if (matchesFooterKeyword(text, ["rss", "atom", "feed", "订阅"])) {
    return Rss;
  }

  if (matchesFooterKeyword(text, ["youtube", "youtu.be"])) {
    return Youtube;
  }

  if (matchesFooterKeyword(text, ["discord", "qq", "wechat", "weixin", "社群", "交流群"])) {
    return MessageCircle;
  }

  if (matchesFooterKeyword(text, ["linkedin"])) {
    return Linkedin;
  }

  if (matchesFooterKeyword(text, ["instagram"])) {
    return Instagram;
  }

  if (matchesFooterKeyword(text, ["facebook"])) {
    return Facebook;
  }

  if (label.startsWith("@") || matchesFooterKeyword(text, ["mastodon", "threads"])) {
    return AtSign;
  }

  return Link2;
}

function getFooterLinkHost(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function matchesFooterKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function FooterColumn({
  links,
  proxySettings,
  title
}: {
  links: FooterLink[];
  proxySettings: ProxySettings;
  title: string;
}) {
  return (
    <div className="footer-column">
      <h3>{title}</h3>
      {links.map((link) => {
        const isExternal = link.href.startsWith("http");

        return (
          <a
            href={isExternal ? proxifyUrl(link.href, proxySettings) : link.href}
            key={link.label}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}

function ToolCard({
  priority = false,
  proxySettings,
  tool,
  t
}: {
  priority?: boolean;
  proxySettings: ProxySettings;
  tool: Tool;
  t: Messages;
}) {
  const demoHref = getToolDemoHref(tool);
  const isGitHubPreview = usesGitHubOpenGraphPreview(tool);
  const toolHref = proxifyUrl(tool.url, proxySettings);

  return (
    <article className="tool-card">
      <div className="tool-card-media">
        <ToolPreviewActions
          demoHref={demoHref}
          isGitHubPreview={isGitHubPreview}
          priority={priority}
          proxySettings={proxySettings}
          tool={tool}
          t={t}
        />
      </div>
      <div className="tool-body">
        <div className="tool-heading">
          <h2>
            <a
              className="tool-title-link"
              href={toolHref}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              onDragStart={preventCardDrag}
              onClick={blurActivatedLink}
            >
              {tool.name}
            </a>
          </h2>
          {tool.featured ? (
            <span className="featured-badge">
              <Star size={13} fill="currentColor" />
              {t.tool.featured}
            </span>
          ) : null}
        </div>
        <p>{tool.description}</p>
        <div className="tool-card-footer">
          <CompactTagRow fallbackCategory={tool.category} tags={tool.tags} />
        </div>
      </div>
    </article>
  );
}
