import {
  confirmTimedOutWrite,
  readJson,
  requestJsonWithTimeout,
  TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
} from "./api-client";
export { loadProxySettings, loadSiteConfiguration, loadSiteSettings } from "./public-api";
import {
  loadProxySettings as readProxySettings,
  loadSiteSettings as readSiteSettings
} from "./public-api";
import { CATEGORY_ICON_SCOPES, normalizeCategoryIcon, normalizeCategoryIconSettings } from "./category-icon-settings";
import type {
  AdminCategoryAction,
  AdminCategoryActionResult,
  AdminCategoryScope,
  AdminCategorySettings,
  CategoryIcon,
  CategoryIconSettings,
  AdminAiResult,
  AdminAiDocumentResult,
  AdminAiSettings,
  AdminAiTask,
  AdminPasswordInput,
  AdminSecuritySettings,
  Article,
  ArticleInput,
  ArticleSummary,
  ContentItemSummary,
  ContentSource,
  ContentSourceInput,
  ContentSyncResponse,
  FactoryResetResponse,
  FeedPreview,
  GitHubSettings,
  GitHubSettingsInput,
  GitHubToolMetadata,
  ImageBedSettings,
  AdminImageUploadResult,
  LinkCheckResponse,
  LinkCheckTarget,
  ProxySettings,
  RssHubSettings,
  HtoolsBackup,
  BackupRestoreResponse,
  SiteSettings,
  SiteSettingsPatch,
  SourceSettings,
  TurnstileSettings,
  TelegramConnection,
  TelegramPushPage,
  TelegramResourceType,
  TelegramSettings,
  TelegramMessage,
  TelegramPushResource,
  TelegramSourceState,
  UmamiSettings,
  Tool,
  ToolSourceItem,
  ToolImportMode,
  ToolImportResponse,
  ToolInput
} from "./types";
import { loadBrowserGitHubMetadata } from "./github-metadata";
import {
  normalizeProxyBaseUrl,
  normalizeProxyMode,
  normalizeProxyScope
} from "./proxy";
import {
  DEFAULT_RSSHUB_BASE_URL,
  normalizeRssHubBaseUrl
} from "../shared/rsshub";
import {
  normalizeUmamiScriptUrl,
  normalizeUmamiWebsiteId
} from "./umami";
import { normalizeTelegramFooterMarkdown } from "./telegram";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteFooterSettings
} from "./site-helpers";

type ToolsResponse = {
  tools: Tool[];
};

type DeleteResponse = {
  success: true;
  deleted: true;
  resource: "tool" | "article" | "contentSource";
  id: string;
};

type ToolResponse = {
  tool: Tool;
};

type AdminArticlesPageResponse = {
  articles: ArticleSummary[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
  categoryCounts: Record<string, number>;
};

type ArticleResponse = {
  article: Article;
};

type ContentSourcesResponse = {
  sources: ContentSource[];
};

type ContentSourceResponse = {
  source: ContentSource;
};

type ContentItemsResponse = {
  items: ContentItemSummary[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
  sourceCounts: Record<string, number> | null;
  categoryCounts: Record<string, number> | null;
};

type FeedPreviewResponse = {
  feed: FeedPreview;
};

type LoginResponse = {
  token: string;
};

export type AdminAuthConfig = {
  turnstileEnabled: boolean;
  turnstileSiteKey: string;
};

type GitHubSettingsResponse = {
  settings: GitHubSettings;
};

type GitHubToolMetadataResponse = {
  metadata: GitHubToolMetadata;
};

type SourceSettingsResponse = {
  settings: SourceSettings;
};

type TurnstileSettingsResponse = {
  settings: TurnstileSettings;
};

type AdminAiSettingsResponse = {
  settings: AdminAiSettings;
};

type AdminAiGenerateResponse = {
  result: AdminAiResult;
};

type AdminAiDocumentResponse = {
  result: AdminAiDocumentResult;
};

type ProxySettingsResponse = {
  settings: ProxySettings;
};

type RssHubSettingsResponse = {
  settings: RssHubSettings;
};

type UmamiSettingsResponse = {
  settings: UmamiSettings;
};

type ImageBedSettingsResponse = {
  settings: ImageBedSettings;
};

type AdminImageUploadResponse = {
  image: AdminImageUploadResult;
};

type SiteSettingsResponse = {
  settings: SiteSettings;
};

type AdminSecuritySettingsResponse = {
  settings: AdminSecuritySettings;
  token?: string;
};

type TelegramSettingsResponse = {
  settings: TelegramSettings;
};

type TelegramConnectionResponse = {
  connection: TelegramConnection;
};

type TelegramMessageResponse = {
  message: TelegramMessage;
};

type TelegramSourceResponse = {
  source: TelegramSourceState;
};

type TelegramDeleteResponse = {
  result: {
    deleted: true;
    id: string;
    messageMissing: boolean;
  };
};

type AdminCategorySettingsResponse = {
  settings: AdminCategorySettings;
  icons?: CategoryIconSettings;
};

type CategoryIconsResponse = { icons: CategoryIconSettings };

type AdminCategoryActionResponse = AdminCategoryActionResult;

export async function loadAdminTools(token: string): Promise<Tool[]> {
  const response = await fetch("/api/admin/tools", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJson<ToolsResponse>(response);
  return data.tools;
}

export async function loadArticlePreview(
  slug: string,
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<Article> {
  const data = await requestJsonWithTimeout<ArticleResponse>(
    `/api/admin/articles/preview/${encodeURIComponent(slug)}`,
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.article;
}

export async function loadContentItemArticlePreview(
  id: string,
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<Article> {
  const data = await requestJsonWithTimeout<ArticleResponse>(
    `/api/admin/content-items/${encodeURIComponent(id)}/preview`,
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.article;
}

export async function loadAdminAuthConfig(): Promise<AdminAuthConfig> {
  return requestJsonWithTimeout<AdminAuthConfig>("/api/auth/config", {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
}

export async function login(
  password: string,
  turnstileToken = ""
): Promise<string> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password: password.trim(), turnstileToken })
  });
  const data = await readJson<LoginResponse>(response);
  return data.token;
}

export async function createTool(input: ToolInput, token: string): Promise<Tool> {
  const response = await fetch("/api/admin/tools", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ToolResponse>(response);
  return data.tool;
}

export async function updateTool(id: string, input: ToolInput, token: string): Promise<Tool> {
  const response = await fetch(`/api/admin/tools/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ToolResponse>(response);
  return data.tool;
}

export async function deleteTool(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/tools/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function loadAdminArticles(
  token: string,
  params: {
    category?: string;
    query?: string;
    sort?: "latest" | "oldest";
    limit?: number;
    cursor?: string;
  } = {}
): Promise<AdminArticlesPageResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.query) searchParams.set("q", params.query);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  const response = await fetch(
    `/api/admin/articles${searchParams.size ? `?${searchParams}` : ""}`,
    {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
    }
  );
  return readJson<AdminArticlesPageResponse>(response);
}

export async function loadAdminArticle(id: string, token: string): Promise<Article> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  });
  return (await readJson<ArticleResponse>(response)).article;
}

export async function updateArticlePublished(
  id: string,
  published: boolean,
  token: string
): Promise<ArticleSummary> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ published })
  });
  return (await readJson<{ article: ArticleSummary }>(response)).article;
}

export async function createArticle(
  input: ArticleInput,
  token: string
): Promise<Article> {
  const response = await fetch("/api/admin/articles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
  token: string
): Promise<Article> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function deleteArticle(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function loadContentSources(
  token: string
): Promise<ContentSource[]> {
  const response = await fetch("/api/admin/content-sources", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJson<ContentSourcesResponse>(response);
  return data.sources;
}

export async function createContentSource(
  input: ContentSourceInput,
  token: string
): Promise<ContentSource> {
  const response = await fetch("/api/admin/content-sources", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ContentSourceResponse>(response);
  return data.source;
}

export async function updateContentSource(
  id: string,
  input: ContentSourceInput,
  token: string
): Promise<ContentSource> {
  const response = await fetch(`/api/admin/content-sources/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ContentSourceResponse>(response);
  return data.source;
}

export async function deleteContentSource(
  id: string,
  token: string
): Promise<void> {
  const response = await fetch(`/api/admin/content-sources/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function previewContentSource(
  input: ContentSourceInput,
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<FeedPreview> {
  const response = await fetch("/api/admin/content-sources/preview", {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<FeedPreviewResponse>(response);
  return data.feed;
}

export async function syncContentSource(
  id: string,
  token: string
): Promise<ContentSyncResponse> {
  const response = await fetch(
    `/api/admin/content-sources/${encodeURIComponent(id)}/sync`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return readJson<ContentSyncResponse>(response);
}

export async function loadContentItems(
  token: string,
  params: {
    sourceId?: string;
    category?: string;
    query?: string;
    sort?: "latest" | "oldest";
    limit?: number;
    cursor?: string;
    includeCounts?: boolean;
  } = {}
): Promise<ContentItemsResponse> {
  const searchParams = new URLSearchParams();

  if (params.sourceId) {
    searchParams.set("sourceId", params.sourceId);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  if (params.includeCounts === false) {
    searchParams.set("counts", "0");
  }

  const response = await fetch(
    `/api/admin/content-items${searchParams.size ? `?${searchParams}` : ""}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return readJson<ContentItemsResponse>(response);
}

export async function convertContentItemToArticle(
  id: string,
  category: string,
  published: boolean,
  token: string,
  overrides?: { summary: string; tags: string[] }
): Promise<Article> {
  const response = await fetch(
    `/api/admin/content-items/${encodeURIComponent(id)}/to-article`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ category, published, ...overrides })
    }
  );
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function loadAdminCategorySettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<AdminCategorySettings> {
  return (await loadAdminCategoryConfiguration(token, options)).settings;
}

export async function loadAdminCategoryConfiguration(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<{ settings: AdminCategorySettings; icons: CategoryIconSettings }> {
  const data = await requestJsonWithTimeout<AdminCategorySettingsResponse>(
    "/api/admin/categories",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  if (!CATEGORY_ICON_SCOPES.every((scope) =>
    Array.isArray(data?.settings?.[scope]) && data.settings[scope].every((category) => typeof category === "string")
  ) || (data.icons !== undefined && (!data.icons || typeof data.icons !== "object" || Array.isArray(data.icons)))) {
    throw new Error("Invalid category response.");
  }
  return { settings: data.settings, icons: normalizeCategoryIconSettings(data.icons) };
}

export async function loadAdminCategoryIcons(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<CategoryIconSettings> {
  const data = await requestJsonWithTimeout<CategoryIconsResponse>("/api/admin/category-icons", {
    signal: options.signal,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  }, { timeoutMs: options.timeoutMs });
  if (!data?.icons || typeof data.icons !== "object" || Array.isArray(data.icons)) {
    throw new Error("Invalid category icon response.");
  }
  return normalizeCategoryIconSettings(data.icons);
}

export async function saveAdminCategoryIcon(
  token: string,
  scope: AdminCategoryScope,
  category: string,
  icon: CategoryIcon | null
): Promise<CategoryIconSettings> {
  const targetIcon = normalizeCategoryIcon(icon);
  if (icon !== null && !targetIcon) throw new Error("Invalid category icon.");
  const targetCategory = category.trim();
  return confirmTimedOutWrite({
    write: async () => {
      const data = await requestJsonWithTimeout<CategoryIconsResponse>("/api/admin/category-icons", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ scope, category: targetCategory, icon: targetIcon })
      });
      if (!data?.icons || typeof data.icons !== "object" || Array.isArray(data.icons)) {
        throw new Error("Invalid category icon response.");
      }
      return normalizeCategoryIconSettings(data.icons);
    },
    confirm: () => loadAdminCategoryIcons(token, { timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS }),
    matches: (current) => {
      const actual = current[scope][targetCategory] ?? null;
      return actual?.type === targetIcon?.type && actual?.value === targetIcon?.value;
    }
  });
}

export async function saveAdminCategorySettings(
  settings: Partial<Record<AdminCategoryScope, string[]>>,
  token: string
): Promise<AdminCategorySettings> {
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<AdminCategorySettingsResponse>(
      "/api/admin/categories",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      }
    )).settings,
    confirm: () => loadAdminCategorySettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => Object.entries(settings).every(([scope, categories]) =>
      sameStringList(
        current[scope as AdminCategoryScope],
        Array.isArray(categories) ? categories : []
      )
    )
  });
}

export async function applyAdminCategoryAction(
  scope: AdminCategoryScope,
  category: string,
  action: AdminCategoryAction,
  targetCategory: string,
  token: string
): Promise<AdminCategoryActionResult> {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action,
      category,
      scope,
      targetCategory
    })
  });
  return readJson<AdminCategoryActionResponse>(response);
}

export async function importTools(
  tools: unknown[],
  mode: ToolImportMode,
  token: string
): Promise<ToolImportResponse> {
  const response = await fetch("/api/admin/import-tools", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tools,
      mode
    })
  });

  return readJson<ToolImportResponse>(response);
}

export async function loadSourceSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<SourceSettings> {
  const data = await requestJsonWithTimeout<SourceSettingsResponse>(
    "/api/admin/source-settings",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveSourceSettings(
  enabled: boolean,
  token: string
): Promise<SourceSettings> {
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<SourceSettingsResponse>(
      "/api/admin/source-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled })
      }
    )).settings,
    confirm: () => loadSourceSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => current.enabled === enabled
  });
}

export async function saveProxySettings(
  input: ProxySettings,
  token: string
): Promise<ProxySettings> {
  const expected = normalizeProxySettings(input);
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<ProxySettingsResponse>(
      "/api/admin/proxy-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => readProxySettings({
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => sameProxySettings(current, expected)
  });
}

export async function loadRssHubSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<RssHubSettings> {
  const data = await requestJsonWithTimeout<RssHubSettingsResponse>(
    "/api/admin/rsshub-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveRssHubSettings(
  input: RssHubSettings,
  token: string
): Promise<RssHubSettings> {
  const expected = {
    enabled: input.enabled,
    baseUrl: normalizeRssHubBaseUrl(input.baseUrl) || DEFAULT_RSSHUB_BASE_URL
  };
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<RssHubSettingsResponse>(
      "/api/admin/rsshub-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadRssHubSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) =>
      current.enabled === expected.enabled && current.baseUrl === expected.baseUrl
  });
}

export async function loadTurnstileSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<TurnstileSettings> {
  const data = await requestJsonWithTimeout<TurnstileSettingsResponse>(
    "/api/admin/turnstile-settings",
    { signal: options.signal, headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function loadUmamiSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<UmamiSettings> {
  const data = await requestJsonWithTimeout<UmamiSettingsResponse>(
    "/api/admin/umami-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveUmamiSettings(
  input: UmamiSettings,
  token: string
): Promise<UmamiSettings> {
  const expected = normalizeUmamiSettings(input);
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<UmamiSettingsResponse>(
      "/api/admin/umami-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadUmamiSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => sameUmamiSettings(current, expected)
  });
}

export async function saveTurnstileSettings(enabled: boolean, token: string) {
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<TurnstileSettingsResponse>(
      "/api/admin/turnstile-settings",
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      }
    )).settings,
    confirm: () => loadTurnstileSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => current.enabled === enabled
  });
}

export async function loadAdminAiSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<AdminAiSettings> {
  const data = await requestJsonWithTimeout<AdminAiSettingsResponse>(
    "/api/admin/ai-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveAdminAiSettings(
  input: Pick<AdminAiSettings, "enabled" | "model">,
  token: string
): Promise<AdminAiSettings> {
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<AdminAiSettingsResponse>(
      "/api/admin/ai-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadAdminAiSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => current.enabled === input.enabled && current.model === input.model
  });
}

export async function loadImageBedSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<ImageBedSettings> {
  const data = await requestJsonWithTimeout<ImageBedSettingsResponse>(
    "/api/admin/image-bed-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveImageBedSettings(
  input: Omit<ImageBedSettings, "available">,
  token: string
): Promise<ImageBedSettings> {
  const rawBaseUrl = input.baseUrl.trim();
  const expected = {
    enabled: input.enabled === true,
    baseUrl: normalizeProxyBaseUrl(rawBaseUrl),
    uploadChannel: ["telegram", "cfr2", "s3", "discord", "huggingface", "webdav"].includes(input.uploadChannel)
      ? input.uploadChannel : "telegram",
    channelName: input.channelName.trim().slice(0, 80),
    uploadNameType: ["default", "index", "origin", "short"].includes(input.uploadNameType)
      ? input.uploadNameType : "default",
    uploadFolder: input.uploadFolder.trim().slice(0, 200)
      .replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")
  };
  const validTarget = rawBaseUrl.length <= 2048 &&
    (!rawBaseUrl || Boolean(expected.baseUrl)) &&
    (!expected.enabled || Boolean(expected.baseUrl)) &&
    (!expected.uploadFolder || !expected.uploadFolder.split("/")
      .some((segment) => !segment || segment === "." || segment === ".."));

  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<ImageBedSettingsResponse>(
      "/api/admin/image-bed-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadImageBedSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => validTarget &&
      current.enabled === expected.enabled &&
      current.baseUrl === expected.baseUrl &&
      current.uploadChannel === expected.uploadChannel &&
      current.channelName === expected.channelName &&
      current.uploadNameType === expected.uploadNameType &&
      current.uploadFolder === expected.uploadFolder
  });
}

export async function uploadAdminImage(file: File, token: string) {
  const body = new FormData();
  body.append("file", file, file.name);
  const data = await requestJsonWithTimeout<AdminImageUploadResponse>(
    "/api/admin/image-upload",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body
    },
    { timeoutMs: 90_000 }
  );
  return data.image;
}

export async function generateAdminAi(
  task: AdminAiTask,
  input: Record<string, unknown>,
  locale: "zh" | "en",
  token: string
): Promise<AdminAiResult> {
  const data = await requestJsonWithTimeout<AdminAiGenerateResponse>(
    "/api/admin/ai/generate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ task, input, locale })
    },
    { timeoutMs: 35_000 }
  );
  return data.result;
}

export async function convertAdminAiDocument(
  file: File,
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<AdminAiDocumentResult> {
  const formData = new FormData();
  formData.set("file", file, file.name);
  const data = await requestJsonWithTimeout<AdminAiDocumentResponse>(
    "/api/admin/ai/to-markdown",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: options.signal
    },
    { timeoutMs: 65_000 }
  );
  return data.result;
}

export async function patchSiteSettings(
  input: SiteSettingsPatch,
  token: string
): Promise<SiteSettings> {
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<SiteSettingsResponse>(
      "/api/admin/site-settings",
      {
        cache: "no-store",
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => readSiteSettings({
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => siteSettingsPatchMatches(current, input)
  });
}

export async function exportBackupData(token: string): Promise<HtoolsBackup> {
  const response = await fetch("/api/admin/backup", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<HtoolsBackup>(response);
}

export async function exportToolSourceData(token: string): Promise<ToolSourceItem[]> {
  const response = await fetch("/api/admin/tool-source", {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<ToolSourceItem[]>(response);
}

export async function restoreBackupData(
  backup: unknown,
  token: string
): Promise<BackupRestoreResponse> {
  const response = await fetch("/api/admin/backup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(backup)
  });

  return readJson<BackupRestoreResponse>(response);
}

export async function resetFactorySettings(token: string): Promise<FactoryResetResponse> {
  const response = await fetch("/api/admin/factory-reset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<FactoryResetResponse>(response);
}

export async function loadAdminSecuritySettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<AdminSecuritySettings> {
  const data = await requestJsonWithTimeout<AdminSecuritySettingsResponse>(
    "/api/admin/security",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return data.settings;
}

export async function updateAdminPassword(
  input: AdminPasswordInput,
  token: string
): Promise<{ settings: AdminSecuritySettings; token: string }> {
  const response = await fetch("/api/admin/security", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<AdminSecuritySettingsResponse>(response);
  if (!data.token) {
    throw new Error("Updated admin session token is missing.");
  }
  return { settings: data.settings, token: data.token };
}

export async function loadTelegramSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<TelegramSettings> {
  const data = await requestJsonWithTimeout<TelegramSettingsResponse>(
    "/api/admin/telegram-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveTelegramSettings(
  input: Pick<TelegramSettings, "enabled" | "target" | "footerMarkdown">,
  token: string
) {
  const expected = normalizeTelegramSettingsInput(input);
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<TelegramSettingsResponse>(
      "/api/admin/telegram-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadTelegramSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => (
      current.enabled === expected.enabled &&
      current.target === expected.target &&
      current.footerMarkdown === expected.footerMarkdown
    )
  });
}

export async function testTelegramSettings(target: string, token: string) {
  const data = await requestJsonWithTimeout<TelegramConnectionResponse>(
    "/api/admin/telegram-settings/test",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ target })
    },
    { timeoutMs: 12_000 }
  );
  return data.connection;
}

export async function loadTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  token: string,
  locale: "zh" | "en"
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}?locale=${locale}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function loadTelegramPushRecords(
  token: string,
  params: {
    cursor?: string;
    limit?: number;
    query?: string;
    resourceType?: TelegramResourceType;
    category?: string;
    sort?: "latest" | "oldest";
  } = {}
): Promise<TelegramPushPage> {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.query) searchParams.set("q", params.query);
  if (params.resourceType) searchParams.set("type", params.resourceType);
  if (params.category) searchParams.set("category", params.category);
  if (params.sort) searchParams.set("sort", params.sort);
  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  return requestJsonWithTimeout<TelegramPushPage>(
    `/api/admin/telegram-messages${suffix}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    },
    { timeoutMs: 15_000 }
  );
}

export async function loadTelegramSource(
  resourceType: TelegramResourceType,
  resourceId: string,
  token: string,
  locale: "zh" | "en"
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}/source?locale=${locale}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
  );
  return (await readJson<TelegramSourceResponse>(response)).source;
}

type TelegramMessageWriteOptions = {
  category?: string;
  title?: string;
  resource?: TelegramPushResource;
  confirmUncertainRetry?: boolean;
};

export async function deleteTelegramPush(
  resourceType: TelegramResourceType,
  resourceId: string,
  recordId: string,
  token: string
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}?recordId=${encodeURIComponent(recordId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return (await readJson<TelegramDeleteResponse>(response)).result;
}

export async function sendTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  options: TelegramMessageWriteOptions = {}
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bodyMarkdown, mediaEnabled, mediaUrl, locale,
        category: options.category ?? "",
        title: options.title ?? "", resource: options.resource,
        confirmUncertainRetry: options.confirmUncertainRetry === true
      })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function updateTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  options: TelegramMessageWriteOptions = {}
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bodyMarkdown, mediaEnabled, mediaUrl, locale,
        category: options.category ?? "",
        title: options.title ?? "", resource: options.resource,
        confirmUncertainRetry: options.confirmUncertainRetry === true
      })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function saveTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  options: TelegramMessageWriteOptions = {}
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bodyMarkdown, mediaEnabled, mediaUrl, locale,
        category: options.category ?? "",
        title: options.title ?? "", resource: options.resource
      })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function loadGitHubSettings(
  token: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<GitHubSettings> {
  const data = await requestJsonWithTimeout<GitHubSettingsResponse>(
    "/api/admin/github-settings",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function saveGitHubSettings(
  input: GitHubSettingsInput,
  token: string
): Promise<GitHubSettings> {
  const expected = normalizeGitHubSettingsInput(input);
  return confirmTimedOutWrite({
    write: async () => (await requestJsonWithTimeout<GitHubSettingsResponse>(
      "/api/admin/github-settings",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    )).settings,
    confirm: () => loadGitHubSettings(token, {
      timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS
    }),
    matches: (current) => (
      current.enabled === expected.enabled &&
      current.owner === expected.owner &&
      current.repo === expected.repo &&
      sameStringList(current.labels, expected.labels)
    )
  });
}

const pendingGitHubMetadataRequests = new Map<
  string,
  Promise<GitHubToolMetadata>
>();
let adminGitHubMetadataMode: "server" | "browser" = "server";

export function loadGitHubToolMetadata(
  url: string,
  token: string,
  options: { forceRefresh?: boolean } = {}
): Promise<GitHubToolMetadata> {
  const requestMode = options.forceRefresh ? "force" : "cached";
  const requestKey = `${token}\u0000${requestMode}\u0000${url.trim().toLowerCase()}`;
  const pendingRequest = pendingGitHubMetadataRequests.get(requestKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    if (adminGitHubMetadataMode === "browser") {
      return loadBrowserGitHubMetadata(url, {
        forceRefresh: options.forceRefresh
      });
    }

    const searchParams = new URLSearchParams({ url });
    if (options.forceRefresh) {
      searchParams.set("refresh", "1");
    }

    try {
      const data = await requestJsonWithTimeout<GitHubToolMetadataResponse>(
        `/api/admin/github-metadata?${searchParams}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        },
        { timeoutMs: 12_000 }
      );
      adminGitHubMetadataMode = "server";
      return data.metadata;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 409
      ) {
        adminGitHubMetadataMode = "browser";
        return loadBrowserGitHubMetadata(url, {
          forceRefresh: options.forceRefresh
        });
      }
      throw error;
    }
  })();

  pendingGitHubMetadataRequests.set(requestKey, request);
  const clearPendingRequest = () => {
    if (pendingGitHubMetadataRequests.get(requestKey) === request) {
      pendingGitHubMetadataRequests.delete(requestKey);
    }
  };
  void request.then(clearPendingRequest, clearPendingRequest);

  return request;
}

function sameStringList(left: string[], right: string[]) {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function normalizeProxySettings(settings: ProxySettings): ProxySettings {
  return {
    enabled: settings.enabled === true,
    baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
    mode: normalizeProxyMode(settings.mode),
    scope: normalizeProxyScope(settings.scope)
  };
}

function sameProxySettings(left: ProxySettings, right: ProxySettings) {
  const normalizedLeft = normalizeProxySettings(left);
  return normalizedLeft.enabled === right.enabled &&
    normalizedLeft.baseUrl === right.baseUrl &&
    normalizedLeft.mode === right.mode &&
    normalizedLeft.scope === right.scope;
}

function normalizeUmamiSettings(settings: UmamiSettings): UmamiSettings {
  const scriptUrl = normalizeUmamiScriptUrl(settings.scriptUrl);
  const websiteId = normalizeUmamiWebsiteId(settings.websiteId);
  return {
    enabled: settings.enabled === true && Boolean(scriptUrl && websiteId),
    scriptUrl,
    websiteId
  };
}

function sameUmamiSettings(left: UmamiSettings, right: UmamiSettings) {
  const normalizedLeft = normalizeUmamiSettings(left);
  return normalizedLeft.enabled === right.enabled &&
    normalizedLeft.scriptUrl === right.scriptUrl &&
    normalizedLeft.websiteId === right.websiteId;
}

function normalizeGitHubSettingsInput(input: GitHubSettingsInput): GitHubSettings {
  return {
    enabled: input.enabled === true,
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    labels: input.labels.map((label) => label.trim()).filter(Boolean).slice(0, 10)
  };
}

function normalizeTelegramSettingsInput(
  input: Pick<TelegramSettings, "enabled" | "target" | "footerMarkdown">
) {
  return {
    enabled: input.enabled === true,
    target: input.target.trim(),
    footerMarkdown: normalizeTelegramFooterMarkdown(input.footerMarkdown)
  };
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function siteSettingsPatchMatches(settings: SiteSettings, patch: SiteSettingsPatch) {
  if (patch.section === "identity") {
    const name = patch.name.trim().slice(0, 40) || DEFAULT_SITE_SETTINGS.name;
    const subtitle = patch.subtitle.trim().slice(0, 60) || DEFAULT_SITE_SETTINGS.subtitle;
    return settings.name === name &&
      settings.subtitle === subtitle &&
      settings.iconUrl === normalizeSiteIconForConfirmation(patch.iconUrl);
  }
  if (patch.section === "about") {
    return sameValue(settings.aboutContent, normalizeLocalizedContent(patch.aboutContent));
  }
  if (patch.section === "privacy") {
    return sameValue(settings.privacyContent, normalizeLocalizedContent(patch.privacyContent));
  }
  if (patch.section === "terms") {
    return sameValue(settings.termsContent, normalizeLocalizedContent(patch.termsContent));
  }
  if (patch.section === "home") {
    return sameValue(settings.homeHero, {
      zh: normalizeHomeHeroContentForConfirmation(patch.homeHero.zh),
      en: normalizeHomeHeroContentForConfirmation(patch.homeHero.en)
    });
  }
  return sameValue(
    getSiteFooterSettings(settings),
    getSiteFooterSettings({ ...DEFAULT_SITE_SETTINGS, footer: patch.footer })
  );
}

function normalizeLocalizedContent(value: { zh: string; en: string }) {
  return {
    zh: value.zh.trim().slice(0, 60_000),
    en: value.en.trim().slice(0, 60_000)
  };
}

function normalizeHomeHeroContentForConfirmation(value: {
  titleTop: string;
  titleBottom: string;
  description: string;
}) {
  return {
    titleTop: value.titleTop.trim().slice(0, 80),
    titleBottom: value.titleBottom.trim().slice(0, 80),
    description: value.description.trim().slice(0, 240)
  };
}

function normalizeSiteIconForConfirmation(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : trimmed;
  } catch {
    return trimmed;
  }
}

export async function checkLinks(
  links: LinkCheckTarget[],
  timeout: number,
  token: string
): Promise<LinkCheckResponse> {
  const response = await fetch("/api/admin/link-check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      links: links.map((link) => ({
        id: link.id,
        kind: link.kind
      })),
      timeout
    })
  });

  return readJson<LinkCheckResponse>(response);
}
