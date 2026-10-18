import {
  getDatabase,
  getSiteSettings,
  type ArticleRow,
  type Env
} from "./_shared";
import { getEffectiveTags } from "../shared/effective-tags";

const DEFAULT_PUBLIC_LOGO_PATH = "/htools-logo.png";

export type PublicArticleMetadata = {
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
};

type PublicSiteIdentity = {
  name: string;
  subtitle: string;
  iconUrl: string;
};

export function getPublicSiteUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function createPublicUrl(requestUrl: string, path: string) {
  return new URL(path, getPublicSiteUrl(requestUrl)).toString();
}

export function createPublicArticleMetadata(
  requestUrl: string,
  article: Pick<
    ArticleRow,
    "slug" | "cover_image" | "published_at" | "updated_at" | "created_at"
  >
): PublicArticleMetadata {
  return {
    url: createPublicUrl(
      requestUrl,
      `/articles/${encodeURIComponent(article.slug)}`
    ),
    image: normalizePublicHttpUrl(article.cover_image, requestUrl),
    datePublished: getFirstPublicDate(
      article.published_at,
      article.created_at,
      article.updated_at
    ),
    dateModified: getFirstPublicDate(
      article.updated_at,
      article.published_at,
      article.created_at
    )
  };
}

export function normalizePublicHttpUrl(value: string, requestUrl: string) {
  const normalized = value.trim();
  if (!normalized) return "";

  try {
    const url = new URL(normalized, getPublicSiteUrl(requestUrl));
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

export function parsePublicDate(value?: string | null) {
  const normalized = normalizePublicDateInput(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getLatestPublicDate(values: string[]) {
  const timestamps = values
    .map((value) => parsePublicDate(value)?.getTime())
    .filter((value): value is number => value !== undefined);

  return timestamps.length > 0
    ? new Date(Math.max(...timestamps)).toISOString()
    : "";
}

export function parsePublicArticleTags(value: string, category = "") {
  try {
    const parsed = JSON.parse(value);
    const tags = Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
    return getEffectiveTags(tags, category);
  } catch {
    return getEffectiveTags([], category);
  }
}

export async function loadPublicArticles(env: Env, limit: number) {
  try {
    const db = await getDatabase(env);
    const result = await db.prepare(
      `SELECT *
       FROM articles
       WHERE published = 1
       ORDER BY COALESCE(published_at, updated_at, created_at) DESC
       LIMIT ?`
    ).bind(limit).all<ArticleRow>();

    return result.results;
  } catch {
    return [];
  }
}

export async function loadPublicSiteIdentity(
  env: Env
): Promise<PublicSiteIdentity> {
  try {
    const site = await getSiteSettings(env);
    return {
      name: site.name,
      subtitle: site.subtitle,
      iconUrl: site.iconUrl || DEFAULT_PUBLIC_LOGO_PATH
    };
  } catch {
    return {
      name: "HTools",
      subtitle: "工具导航站",
      iconUrl: DEFAULT_PUBLIC_LOGO_PATH
    };
  }
}

function getFirstPublicDate(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const date = parsePublicDate(value);
    if (date) return date.toISOString();
  }

  return "";
}

function normalizePublicDateInput(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const normalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)/,
    "$1T$2"
  );
  const hasTime = /^\d{4}-\d{2}-\d{2}T/.test(normalized);
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized);

  return hasTime && !hasTimezone ? `${normalized}Z` : normalized;
}
