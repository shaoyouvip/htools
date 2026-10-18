import { readJson, requestJsonWithTimeout } from "./api-client";
import type {
  AdminCategorySettings,
  CategoryIconSettings,
  Article,
  ArticleSummary,
  ProxySettings,
  PublicArticlesPage,
  PublicToolsPage,
  SiteSettings,
  Tool,
  UmamiSettings
} from "./types";

type ToolsResponse = {
  tools: Tool[];
};

type ToolsLoadResult = PublicToolsPage;

type ArticleSummariesResponse = {
  articles: ArticleSummary[];
};

type ArticleResponse = {
  article: Article;
};

type ProxySettingsResponse = {
  settings: ProxySettings;
};

type SiteSettingsResponse = {
  settings: SiteSettings;
  umami?: UmamiSettings;
};

export type PublicSiteConfiguration = {
  settings: SiteSettings;
  umami: UmamiSettings;
};

type PublicCategorySettingsResponse = {
  categories: Array<{
    category: string;
    total: number;
    featured_total: number;
  }>;
  settings: AdminCategorySettings;
  icons?: CategoryIconSettings;
};

export async function loadTools(options: {
  category?: string;
  cursor?: string | null;
  featured?: boolean;
  includeCounts?: boolean;
  limit?: number;
  page?: number;
  signal?: AbortSignal;
} = {}): Promise<ToolsLoadResult> {
  const searchParams = new URLSearchParams();
  if (options.category) searchParams.set("category", options.category);
  if (options.cursor) searchParams.set("cursor", options.cursor);
  if (options.featured) searchParams.set("featured", "1");
  if (options.limit !== undefined) searchParams.set("limit", String(options.limit));
  if (options.page !== undefined) searchParams.set("page", String(options.page));
  if (options.includeCounts === false) searchParams.set("counts", "0");
  const query = searchParams.toString();
  const response = await fetch(`/api/tools${query ? `?${query}` : ""}`, {
    signal: options.signal,
    headers: {
      Accept: "application/json"
    }
  });
  return readJson<ToolsLoadResult>(response);
}

export async function searchPublicTools(query: string): Promise<Tool[]> {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`/api/tools/search?${searchParams}`, {
    headers: { Accept: "application/json" }
  });
  const data = await readJson<ToolsResponse>(response);
  return data.tools;
}

export async function loadArticles(options: {
  category?: string;
  cursor?: string | null;
  includeCounts?: boolean;
  limit?: number;
  page?: number;
  signal?: AbortSignal;
} = {}): Promise<PublicArticlesPage> {
  const searchParams = new URLSearchParams();
  if (options.category) searchParams.set("category", options.category);
  if (options.cursor) searchParams.set("cursor", options.cursor);
  if (options.limit !== undefined) searchParams.set("limit", String(options.limit));
  if (options.page !== undefined) searchParams.set("page", String(options.page));
  if (options.includeCounts === false) searchParams.set("counts", "0");
  const query = searchParams.toString();
  const response = await fetch(`/api/articles${query ? `?${query}` : ""}`, {
    signal: options.signal,
    headers: {
      Accept: "application/json"
    }
  });
  return readJson<PublicArticlesPage>(response);
}

export async function searchPublicArticles(query: string): Promise<ArticleSummary[]> {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`/api/articles/search?${searchParams}`, {
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJson<ArticleSummariesResponse>(response);
  return data.articles;
}

export async function loadArticle(
  slug: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<Article> {
  const data = await requestJsonWithTimeout<ArticleResponse>(
    `/api/articles/${encodeURIComponent(slug)}`,
    { signal: options.signal, headers: { Accept: "application/json" } },
    { timeoutMs: options.timeoutMs }
  );
  return data.article;
}

export async function loadPublicCategoryData(
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<PublicCategorySettingsResponse> {
  const data = await requestJsonWithTimeout<PublicCategorySettingsResponse>(
    "/api/categories",
    { signal: options.signal, headers: { Accept: "application/json" } },
    { timeoutMs: options.timeoutMs }
  );
  if (
    !Array.isArray(data?.categories) ||
    !data.categories.every((row) =>
      row && typeof row.category === "string" &&
      Number.isSafeInteger(row.total) && row.total >= 0 &&
      Number.isSafeInteger(row.featured_total) && row.featured_total >= 0
    ) ||
    !(["tools", "articles", "push", "content"] as const).every((scope) => {
      const categories = data.settings?.[scope];
      return Array.isArray(categories) && categories.every((category) => typeof category === "string");
    })
  ) {
    throw new Error("Invalid category response.");
  }
  return data;
}

export async function loadProxySettings(
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<ProxySettings> {
  const data = await requestJsonWithTimeout<ProxySettingsResponse>(
    "/api/proxy-settings",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json"
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return data.settings;
}

export async function loadSiteConfiguration(
  options: {
    includeFullContent?: boolean;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {}
): Promise<PublicSiteConfiguration> {
  const path = options.includeFullContent === false
    ? "/api/site-settings?scope=basic"
    : "/api/site-settings";
  const data = await requestJsonWithTimeout<SiteSettingsResponse>(
    path,
    {
      cache: "no-store",
      signal: options.signal,
      headers: {
        Accept: "application/json"
      }
    },
    { timeoutMs: options.timeoutMs }
  );
  return {
    settings: data.settings,
    umami: data.umami ?? { enabled: false, scriptUrl: "", websiteId: "" }
  };
}

export async function loadSiteSettings(
  options: {
    includeFullContent?: boolean;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {}
): Promise<SiteSettings> {
  return (await loadSiteConfiguration(options)).settings;
}
