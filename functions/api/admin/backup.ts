import {
  CONTENT_SOURCE_SYNC_EPOCH_KEY,
  getDatabase,
  invalidatePublicApiCache,
  badRequest,
  json,
  jsonError,
  requireAdmin,
  type ArticleRow,
  type ContentItemRow,
  type ContentSourceRow,
  type Env,
  type ToolRow
} from "../../_shared";
import type { TelegramMessageRow } from "../../_telegram";
import { CATEGORY_ICONS_KEY, CategoryIconCapacityError, parseCategoryIconSettings } from "../../_category-icons";
import { MAX_CATEGORY_ICON_SETTINGS_BYTES } from "../../../src/category-icon-settings";

type AppSettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

type BackupCounts = {
  tools: number;
  articles: number;
  contentSources: number;
  contentItems: number;
  telegramMessages: number;
  settings: number;
};

type BackupData = {
  tools: ToolRow[];
  articles: ArticleRow[];
  contentSources: ContentSourceRow[];
  contentItems: ContentItemRow[];
  telegramMessages: TelegramMessageRow[];
  settings: AppSettingRow[];
};

const BACKUP_SOURCE = "htools-backup";
const BACKUP_VERSION = "4";
const MAX_BACKUP_BODY_BYTES = 10 * 1024 * 1024;
const SAFE_SETTING_KEYS = [
  "ai_settings",
  "umami_settings",
  "source_public_enabled",
  "github_settings",
  "image_bed_settings",
  "admin_turnstile_enabled",
  "proxy_settings",
  "rsshub_settings",
  "site_settings",
  "admin_category_settings",
  CATEGORY_ICONS_KEY,
  "telegram_settings"
] as const;
const SAFE_SETTING_PLACEHOLDERS = SAFE_SETTING_KEYS.map(() => "?").join(", ");

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = await getDatabase(env);
    const data = await readBackupData(db);
    validateBackupIntegrity(data);
    const counts = createBackupCounts(data);

    return json({
      source: BACKUP_SOURCE,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      counts,
      data
    });
  } catch (error) {
    if (error instanceof BackupDataError) {
      return jsonError(error.message, "BACKUP_DATA_INVALID", { status: 400 }, {
        resource: error.resource,
        recordId: error.recordId
      });
    }
    const message =
      error instanceof Error ? error.message : "Unable to export backup.";
    return jsonError(message, "SERVER_ERROR", { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  let data: BackupData;

  try {
    data = normalizeBackupPayload(await readLimitedJsonBody(request));
  } catch (error) {
    if (error instanceof CategoryIconCapacityError) {
      return jsonError(error.message, "CATEGORY_ICONS_CAPACITY", { status: 400 });
    }
    if (error instanceof BackupDataError) {
      return jsonError(error.message, "BACKUP_DATA_INVALID", { status: 400 }, {
        resource: error.resource,
        recordId: error.recordId
      });
    }
    const message =
      error instanceof Error ? error.message : "Backup file is invalid.";
    return badRequest(message);
  }

  try {
    const db = await getDatabase(env);

    await restoreBackupData(db, data);
    await invalidatePublicApiCache(env);

    return json({
      restored: true,
      counts: createBackupCounts(data)
    });
  } catch (error) {
    if (error instanceof BackupDataError) {
      return jsonError(error.message, "BACKUP_DATA_INVALID", { status: 400 }, {
        resource: error.resource,
        recordId: error.recordId
      });
    }
    const message =
      error instanceof Error ? error.message : "Unable to restore backup.";
    return jsonError(message, "SERVER_ERROR", { status: 500 });
  }
};

async function readLimitedJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BACKUP_BODY_BYTES) {
    throw new Error("backup file exceeds the 10MB limit.");
  }

  if (!request.body) {
    throw new Error("backup file is invalid.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_BACKUP_BODY_BYTES) {
      await reader.cancel();
      throw new Error("backup file exceeds the 10MB limit.");
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(body)) as unknown;
}

async function readBackupData(db: D1Database): Promise<BackupData> {
  const [tools, articles, contentSources, contentItems, telegramMessages, settings] =
    await Promise.all([
      db
        .prepare("SELECT * FROM tools ORDER BY updated_at DESC, created_at DESC")
        .all<ToolRow>(),
      db
        .prepare(
          `SELECT id, slug, title, summary, content, cover_image, category,
                  tags, published, created_at, updated_at, published_at,
                  content_item_id
           FROM articles
           ORDER BY updated_at DESC, created_at DESC`
        )
        .all<ArticleRow>(),
      db
        .prepare(
          "SELECT * FROM content_sources ORDER BY updated_at DESC, created_at DESC"
        )
        .all<ContentSourceRow>(),
      db
        .prepare(
          `SELECT id, source_id, external_id, title, summary, content, url,
                  author, cover_image, category, tags, published_at, synced_at,
                  created_at, updated_at, article_id
           FROM content_items
           ORDER BY updated_at DESC, created_at DESC`
        )
        .all<ContentItemRow>(),
      db
        .prepare(
          `SELECT id, resource_type, resource_id, custom_title, resource_data, category,
                  chat_id, target_ref,
                  message_id, message_markdown,
                   media_enabled, media_url, last_pushed_hash, sent_at, updated_at,
                   last_pushed_media_enabled
           FROM telegram_messages
           ORDER BY updated_at DESC, id DESC`
        )
        .all<TelegramMessageRow>(),
      db
        .prepare(
          `SELECT key, value, updated_at
           FROM app_settings
           WHERE key IN (${SAFE_SETTING_PLACEHOLDERS})
           ORDER BY key`
        )
        .bind(...SAFE_SETTING_KEYS)
        .all<AppSettingRow>()
    ]);

  return {
    tools: tools.results,
    articles: articles.results,
    contentSources: contentSources.results,
    contentItems: contentItems.results,
    telegramMessages: telegramMessages.results,
    settings: settings.results.map((row) => row.key === CATEGORY_ICONS_KEY
      ? { ...row, value: JSON.stringify(parseCategoryIconSettings(row.value)) }
      : row)
  };
}

async function restoreBackupData(db: D1Database, data: BackupData) {
  const statements: D1PreparedStatement[] = [
    db.prepare(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    ).bind(CONTENT_SOURCE_SYNC_EPOCH_KEY, crypto.randomUUID()),
    db.prepare("DELETE FROM telegram_push_locks"),
    db.prepare("DELETE FROM telegram_messages"),
    db.prepare("DELETE FROM content_items"),
    db.prepare("DELETE FROM content_sources"),
    db.prepare("DELETE FROM articles"),
    db.prepare("DELETE FROM tools"),
    ...SAFE_SETTING_KEYS.map((key) =>
      db.prepare("DELETE FROM app_settings WHERE key = ?").bind(key)
    ),
    ...data.tools.map((row) =>
      db
        .prepare(
          `INSERT INTO tools (
             id, name, description, url, demo_url, image, category, tags,
             github_language, github_license, featured, created_at, updated_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.id,
          row.name,
          row.description,
          row.url,
          row.demo_url ?? "",
          row.image,
          row.category,
          row.tags,
          row.github_language ?? "",
          row.github_license ?? "",
          row.featured,
          row.created_at,
          row.updated_at
        )
    ),
    ...data.telegramMessages.map((row) =>
      db
        .prepare(
          `INSERT INTO telegram_messages (
             id, resource_type, resource_id, custom_title, resource_data, category, chat_id, target_ref,
             message_id, message_markdown,
             media_enabled, media_url, last_pushed_hash, sent_at, updated_at,
             last_pushed_media_enabled
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.id,
          row.resource_type,
          row.resource_id,
          row.custom_title,
          row.resource_data ?? "",
          row.category ?? "",
          row.chat_id,
          row.target_ref,
          row.message_id,
          row.message_markdown,
          row.media_enabled,
          row.media_url,
          row.last_pushed_hash,
          row.sent_at,
          row.updated_at,
          row.last_pushed_media_enabled
        )
    ),
    ...data.articles.map((row) =>
      db
        .prepare(
          `INSERT INTO articles (
             id, slug, title, summary, content, cover_image, category, tags,
             published, created_at, updated_at, published_at, content_item_id
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.id,
          row.slug,
          row.title,
          row.summary,
          row.content,
          row.cover_image ?? "",
          row.category,
          row.tags,
          row.published,
          row.created_at,
          row.updated_at,
          row.published_at,
          row.content_item_id
        )
    ),
    ...data.contentSources.map((row) =>
      db
        .prepare(
          `INSERT INTO content_sources (
             id, title, url, site_url, description, category, tags, enabled,
             created_at, updated_at, last_synced_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.id,
          row.title,
          row.url,
          row.site_url ?? "",
          row.description,
          row.category,
          row.tags,
          row.enabled,
          row.created_at,
          row.updated_at,
          row.last_synced_at
        )
    ),
    ...data.contentItems.map((row) =>
      db
        .prepare(
          `INSERT INTO content_items (
             id, source_id, external_id, title, summary, content, url, author,
             cover_image, category, tags, published_at, synced_at, created_at,
             updated_at, article_id
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.id,
          row.source_id,
          row.external_id,
          row.title,
          row.summary,
          row.content,
          row.url,
          row.author,
          row.cover_image ?? "",
          row.category,
          row.tags,
          row.published_at,
          row.synced_at,
          row.created_at,
          row.updated_at,
          row.article_id
        )
    ),
    ...data.settings.map((row) =>
      db
        .prepare(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES (?, ?, ?)`
        )
        .bind(row.key, row.value, row.updated_at)
    )
  ];

  await db.batch(statements);
}

function normalizeBackupPayload(payload: unknown): BackupData {
  const root = readRecord(payload, "backup");

  if (root.source !== BACKUP_SOURCE || root.version !== BACKUP_VERSION) {
    throw new Error("backup file is not a supported full site backup.");
  }

  const data = readRecord(root.data, "backup.data");
  const now = new Date().toISOString();

  const normalized = {
    tools: readArray(data.tools, "tools").map((row, index) =>
      normalizeToolRow(row, index, now)
    ),
    articles: readArray(data.articles, "articles").map((row, index) =>
      normalizeArticleRow(row, index, now)
    ),
    contentSources: readArray(data.contentSources, "contentSources").map(
      (row, index) => normalizeContentSourceRow(row, index, now)
    ),
    contentItems: readArray(data.contentItems, "contentItems").map((row, index) =>
      normalizeContentItemRow(row, index, now)
    ),
    telegramMessages: readArray(data.telegramMessages, "telegramMessages").map(
      (row, index) => normalizeTelegramMessageRow(row, index, now)
    ),
    settings: readArray(data.settings, "settings")
      .map((row, index) => normalizeSettingRow(row, index, now))
      .filter((row): row is AppSettingRow => Boolean(row))
  };

  repairContentItemArticleLinks(normalized);
  validateBackupIntegrity(normalized);
  return normalized;
}

function repairContentItemArticleLinks(data: BackupData) {
  const articlesById = new Map(data.articles.map((row) => [row.id, row]));
  const claimed = new Set(
    data.articles.map((row) => row.content_item_id).filter(Boolean) as string[]
  );

  for (const item of data.contentItems) {
    if (!item.article_id) continue;
    const article = articlesById.get(item.article_id);

    if (!article) {
      item.article_id = null;
      continue;
    }

    if (article.content_item_id === item.id) continue;

    if (!article.content_item_id && !claimed.has(item.id)) {
      article.content_item_id = item.id;
      claimed.add(item.id);
      continue;
    }

    item.article_id = null;
  }
}

class BackupDataError extends Error {
  readonly resource: string;
  readonly recordId: string;

  constructor(message: string, resource: string, recordId: string) {
    super(message);
    this.name = "BackupDataError";
    this.resource = resource;
    this.recordId = recordId;
  }
}

function validateBackupIntegrity(data: BackupData) {
  assertUnique(data.tools, (row) => row.id, "tool id");
  assertUnique(data.articles, (row) => row.id, "article id");
  assertUnique(data.articles, (row) => row.slug, "article slug");
  assertUnique(
    data.articles.filter((row) => Boolean(row.content_item_id)),
    (row) => row.content_item_id ?? "",
    "article content item"
  );
  assertUnique(data.contentSources, (row) => row.id, "content source id");
  assertUnique(data.contentSources, (row) => row.url, "content source url");
  assertUnique(data.contentItems, (row) => row.id, "content item id");
  assertUnique(
    data.contentItems,
    (row) => `${row.source_id}\u0000${row.external_id}`,
    "content item source and external id"
  );
  assertUnique(data.settings, (row) => row.key, "setting key");
  assertUnique(data.telegramMessages, (row) => row.id, "Telegram message id");
  assertUnique(
    data.telegramMessages,
    (row) => `${row.resource_type}\u0000${row.resource_id}\u0000${row.chat_id}`,
    "Telegram resource and chat"
  );

  const sourceIds = new Set(data.contentSources.map((row) => row.id));
  const contentItemsById = new Map(data.contentItems.map((row) => [row.id, row]));
  const articlesById = new Map(data.articles.map((row) => [row.id, row]));
  for (const item of data.contentItems) {
    if (!sourceIds.has(item.source_id)) {
      throw new BackupDataError(
        `content item ${item.id} references a missing content source.`,
        "content item",
        item.id
      );
    }

    if (item.article_id) {
      const article = articlesById.get(item.article_id);

      if (!article) {
        throw new BackupDataError(
          `content item ${item.id} references a missing article.`,
          "content item",
          item.id
        );
      }

      if (article.content_item_id !== item.id) {
        throw new BackupDataError(
          `content item ${item.id} has an inconsistent article link.`,
          "content item",
          item.id
        );
      }
    }
  }

  for (const article of data.articles) {
    if (article.content_item_id) {
      const item = contentItemsById.get(article.content_item_id);

      if (!item) {
        throw new BackupDataError(
          `article ${article.id} references a missing content item.`,
          "article",
          article.id
        );
      }

      if (item.article_id !== article.id) {
        throw new BackupDataError(
          `article ${article.id} has an inconsistent content item link.`,
          "article",
          article.id
        );
      }
    }
  }
}

function assertUnique<T>(
  rows: T[],
  getKey: (row: T) => string,
  field: string
) {
  const seen = new Set<string>();

  for (const row of rows) {
    const key = getKey(row);

    if (seen.has(key)) {
      throw new BackupDataError(
        `backup contains a duplicate ${field}.`,
        field,
        key
      );
    }

    seen.add(key);
  }
}

function normalizeToolRow(value: unknown, index: number, now: string): ToolRow {
  const row = readRecord(value, `tools[${index}]`);
  const createdAt = readString(row.created_at) || now;

  return {
    id: readRequiredString(row.id, `tools[${index}].id`),
    name: readRequiredString(row.name, `tools[${index}].name`),
    description: readString(row.description),
    url: readRequiredString(row.url, `tools[${index}].url`),
    demo_url: readString(row.demo_url),
    image: readString(row.image),
    category: readRequiredString(row.category, `tools[${index}].category`),
    tags: normalizeTags(row.tags),
    github_language: readString(row.github_language),
    github_license: readString(row.github_license),
    featured: readIntegerFlag(row.featured),
    created_at: createdAt,
    updated_at: readString(row.updated_at) || createdAt
  };
}

function normalizeArticleRow(
  value: unknown,
  index: number,
  now: string
): ArticleRow {
  const row = readRecord(value, `articles[${index}]`);
  const createdAt = readString(row.created_at) || now;

  return {
    id: readRequiredString(row.id, `articles[${index}].id`),
    slug: readRequiredString(row.slug, `articles[${index}].slug`),
    title: readRequiredString(row.title, `articles[${index}].title`),
    summary: readString(row.summary),
    content: readString(row.content),
    cover_image: readString(row.cover_image),
    category: readString(row.category),
    tags: normalizeTags(row.tags),
    published: readIntegerFlag(row.published, 1),
    created_at: createdAt,
    updated_at: readString(row.updated_at) || createdAt,
    published_at: readNullableString(row.published_at),
    content_item_id: readNullableString(row.content_item_id)
  };
}

function normalizeContentSourceRow(
  value: unknown,
  index: number,
  now: string
): ContentSourceRow {
  const row = readRecord(value, `contentSources[${index}]`);
  const createdAt = readString(row.created_at) || now;

  return {
    id: readRequiredString(row.id, `contentSources[${index}].id`),
    title: readRequiredString(row.title, `contentSources[${index}].title`),
    url: readRequiredString(row.url, `contentSources[${index}].url`),
    site_url: readString(row.site_url),
    description: readString(row.description),
    category: readString(row.category),
    tags: normalizeTags(row.tags),
    enabled: readIntegerFlag(row.enabled, 1),
    created_at: createdAt,
    updated_at: readString(row.updated_at) || createdAt,
    last_synced_at: readNullableString(row.last_synced_at)
  };
}

function normalizeContentItemRow(
  value: unknown,
  index: number,
  now: string
): ContentItemRow {
  const row = readRecord(value, `contentItems[${index}]`);
  const createdAt = readString(row.created_at) || now;

  return {
    id: readRequiredString(row.id, `contentItems[${index}].id`),
    source_id: readRequiredString(row.source_id, `contentItems[${index}].source_id`),
    external_id: readRequiredString(row.external_id, `contentItems[${index}].external_id`),
    title: readRequiredString(row.title, `contentItems[${index}].title`),
    summary: readString(row.summary),
    content: readString(row.content),
    url: readRequiredString(row.url, `contentItems[${index}].url`),
    author: readString(row.author),
    cover_image: readString(row.cover_image),
    category: readString(row.category),
    tags: normalizeTags(row.tags),
    published_at: readNullableString(row.published_at),
    synced_at: readString(row.synced_at) || now,
    created_at: createdAt,
    updated_at: readString(row.updated_at) || createdAt,
    article_id: readNullableString(row.article_id)
  };
}

function normalizeTelegramMessageRow(
  value: unknown,
  index: number,
  now: string
): TelegramMessageRow {
  const row = readRecord(value, `telegramMessages[${index}]`);
  const messageId = readString(row.message_id);
  const chatId = readString(row.chat_id);
  const resourceType = readString(row.resource_type);
  const resourceId = readString(row.resource_id);
  const sentAt = readString(row.sent_at) || (messageId ? now : "");

  if (
    resourceType !== "tool" &&
    resourceType !== "article" &&
    resourceType !== "content" &&
    resourceType !== "custom"
  ) {
    throw new Error(`telegramMessages[${index}].resource_type is invalid.`);
  }
  if (!resourceId) {
    throw new Error(`telegramMessages[${index}].resource_id is required.`);
  }
  if (messageId && !chatId) {
    throw new Error(`telegramMessages[${index}].chat_id is required for a sent message.`);
  }

  return {
    id: readRequiredString(row.id, `telegramMessages[${index}].id`),
    resource_type: resourceType,
    resource_id: resourceId,
    custom_title: readString(row.custom_title),
    resource_data: readString(row.resource_data),
    category: readString(row.category),
    chat_id: chatId,
    target_ref: readString(row.target_ref),
    message_id: messageId,
    message_markdown: readString(row.message_markdown),
    media_enabled: readIntegerFlag(row.media_enabled),
    media_url: readString(row.media_url),
    last_pushed_hash: readString(row.last_pushed_hash),
    last_pushed_media_enabled: row.last_pushed_media_enabled === 0 || row.last_pushed_media_enabled === 1
      ? row.last_pushed_media_enabled
      : null,
    sent_at: sentAt,
    updated_at: readString(row.updated_at) || sentAt
  };
}

function normalizeSettingRow(
  value: unknown,
  index: number,
  now: string
): AppSettingRow | null {
  const row = readRecord(value, `settings[${index}]`);
  const key = readString(row.key);

  if (!isSafeSettingKey(key)) {
    return null;
  }

  const settingValue = key === CATEGORY_ICONS_KEY
    ? JSON.stringify(parseCategoryIconSettings(readString(row.value)))
    : readString(row.value);
  if (key === CATEGORY_ICONS_KEY && new TextEncoder().encode(settingValue).byteLength > MAX_CATEGORY_ICON_SETTINGS_BYTES) {
    throw new CategoryIconCapacityError();
  }

  return {
    key,
    value: settingValue,
    updated_at: readString(row.updated_at) || now
  };
}

function createBackupCounts(data: BackupData): BackupCounts {
  return {
    tools: data.tools.length,
    articles: data.articles.length,
    contentSources: data.contentSources.length,
    contentItems: data.contentItems.length,
    telegramMessages: data.telegramMessages.length,
    settings: data.settings.length
  };
}

function readRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readArray(value: unknown, field: string): unknown[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }

  return value;
}

function readRequiredString(value: unknown, field: string) {
  const text = readString(value);

  if (!text) {
    throw new Error(`${field} is required.`);
  }

  return text;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function readIntegerFlag(value: unknown, fallback = 0) {
  if (value === true) {
    return 1;
  }

  if (value === false) {
    return 0;
  }

  if (typeof value === "number") {
    return value === 1 ? 1 : 0;
  }

  return fallback;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.filter((tag): tag is string => typeof tag === "string")
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.filter((tag): tag is string => typeof tag === "string")
        );
      }
    } catch {
      return "[]";
    }
  }

  return "[]";
}

function isSafeSettingKey(value: string): value is (typeof SAFE_SETTING_KEYS)[number] {
  return (SAFE_SETTING_KEYS as readonly string[]).includes(value);
}
