import {
  ADMIN_AI_DOCUMENT_EXTENSIONS,
  ADMIN_AI_DOCUMENT_MAX_BYTES,
  ADMIN_AI_MODELS,
  type AdminAiModel,
  type AdminAiTask
} from "../shared/admin-ai";
import type { CategoryIconSettings } from "./category-icon-settings";

export {
  ADMIN_AI_DOCUMENT_EXTENSIONS,
  ADMIN_AI_DOCUMENT_MAX_BYTES,
  ADMIN_AI_MODELS
};
export type { AdminAiModel, AdminAiTask };

export type Tool = {
  id: string;
  name: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  category: string;
  tags: string[];
  githubLanguage: string;
  githubLicense: string;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ToolInput = Omit<Tool, "id" | "created_at" | "updated_at">;

export type PublicToolsPage = {
  tools: Tool[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
  categoryCounts: Record<string, number> | null;
  featuredTotal: number | null;
};

export type ToolSourceItem = {
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  category: string;
  tags: string[];
  githubLanguage: string;
  githubLicense: string;
  featured: boolean;
};

export type GitHubToolMetadata = {
  owner: string;
  repo: string;
  fullName: string;
  name: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  topics: string[];
  updatedAt: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  published: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  publishedAt?: string | null;
};

export type ArticleSummary = Omit<Article, "content">;

export type PublicArticlesPage = {
  articles: ArticleSummary[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
  categoryCounts: Record<string, number> | null;
};

export type ArticleInput = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt: string;
};

export type ContentSource = {
  id: string;
  title: string;
  url: string;
  siteUrl: string;
  description: string;
  category: string;
  tags: string[];
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  lastSyncedAt?: string | null;
};

export type ContentSourceInput = {
  title: string;
  url: string;
  category: string;
  tags: string[];
  enabled: boolean;
};

type ContentItem = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  external_id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  author: string;
  coverImage: string;
  category: string;
  tags: string[];
  published_at?: string | null;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
  articleId?: string | null;
  articleSlug?: string | null;
  articleCategory?: string | null;
  articlePublished?: boolean | null;
};

export type ContentItemSummary = Omit<ContentItem, "content">;

export type FeedPreview = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: Array<{
    externalId: string;
    title: string;
    summary: string;
    content: string;
    url: string;
    author: string;
    coverImage: string;
    tags: string[];
    publishedAt: string | null;
  }>;
};

export type ContentSyncResponse = {
  imported: number;
  updated: number;
  total: number;
  items: ContentItemSummary[];
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type { CategoryIcon, CategoryIconName, CategoryIconSettings } from "./category-icon-settings";

export type AdminCategoryScope = "tools" | "articles" | "push" | "content";

export type AdminCategorySettings = Record<AdminCategoryScope, string[]>;

export type AdminCategoryAction = "migrate" | "delete";

export type AdminCategoryActionResult = {
  affected: number;
  settings: AdminCategorySettings;
  icons?: CategoryIconSettings;
};

export type ToolImportMode = "skip" | "upsert";

type ToolImportError = {
  index: number;
  message: string;
};

export type ToolImportResponse = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ToolImportError[];
};

export type SourceSettings = {
  enabled: boolean;
  sourceUrl: string;
  sourcePath: string;
};

export type ProxyMode = "prefix" | "edgeone-proxy" | "edgeone-advanced";
export type ProxyScope = "all" | "images";

export type ProxySettings = {
  enabled: boolean;
  baseUrl: string;
  mode: ProxyMode;
  scope: ProxyScope;
};

export type UmamiSettings = {
  enabled: boolean;
  scriptUrl: string;
  websiteId: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

export type FooterSettings = {
  description: string;
  authorName: string;
  authorUrl: string;
  copyright: string;
  sponsorLabel: string;
  sponsorUrl: string;
  socialLinks: FooterLink[];
  groups: FooterLinkGroup[];
};

export type TurnstileSettings = {
  available: boolean;
  enabled: boolean;
};

export type RssHubSettings = {
  enabled: boolean;
  baseUrl: string;
};

export type ImageBedUploadChannel =
  | "telegram"
  | "cfr2"
  | "s3"
  | "discord"
  | "huggingface"
  | "webdav";

export type ImageBedUploadNameType =
  | "default"
  | "index"
  | "origin"
  | "short";

export type ImageBedSettings = {
  available: boolean;
  enabled: boolean;
  baseUrl: string;
  uploadChannel: ImageBedUploadChannel;
  channelName: string;
  uploadNameType: ImageBedUploadNameType;
  uploadFolder: string;
};

export type AdminImageUploadResult = {
  url: string;
  name: string;
  size: number;
  type: string;
};

export type AdminAiSettings = {
  available: boolean;
  enabled: boolean;
  model: AdminAiModel;
};

export type AdminAiResult = {
  task: AdminAiTask;
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  tags?: string[];
  githubRepository?: string;
};

export type AdminAiDocumentResult = {
  name: string;
  mimeType: string;
  tokens: number;
  markdown: string;
};

export type TelegramSettings = {
  available: boolean;
  enabled: boolean;
  target: string;
  footerMarkdown: string;
};

export type TelegramConnection = {
  botName: string;
  botUsername: string;
  chatId: string;
  chatTitle: string;
  chatType: string;
  canSend: boolean;
};

export type TelegramMessage = {
  exists: boolean;
  targetChanged: boolean;
  deliveryUncertain: boolean;
  syncStatus: "not_pushed" | "pending" | "synced";
  bodyMarkdown: string;
  mediaEnabled: boolean;
  mediaUrl: string;
  defaultBodyMarkdown: string;
  defaultMediaUrl: string;
  resource: TelegramPushResource;
  resourceExists: boolean;
  /**
   * Set when the stored push could not be edited in place: the admin deleted the
   * message inside Telegram, or the delivery target changed. The record is reset to
   * "not pushed" so the admin can decide whether to send a fresh message.
   */
  remoteMessageMissing?: "deleted" | "target-changed";
};

export type TelegramResourceType = "tool" | "article" | "content" | "custom";

export type TelegramPushResource = {
  type: TelegramResourceType;
  id: string;
  title: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  category: string;
  tags: string[];
};

export type TelegramPushRecord = {
  id: string;
  resourceType: TelegramResourceType;
  resourceId: string;
  title: string;
  resourceExists: boolean;
  resource: TelegramPushResource | null;
  messageMarkdown: string;
  mediaEnabled: boolean;
  mediaUrl: string;
  syncStatus: "not_pushed" | "pending" | "synced";
  deliveryUncertain: boolean;
  sentAt: string;
  updatedAt: string;
};

export type TelegramPushPage = {
  records: TelegramPushRecord[];
  categoryOptions: string[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export type TelegramSourceState = {
  resource: TelegramPushResource;
  bodyMarkdown: string;
  mediaUrl: string;
};

export type HomeHeroContent = {
  titleTop: string;
  titleBottom: string;
  description: string;
};

export type HomeHeroSettings = {
  zh: HomeHeroContent;
  en: HomeHeroContent;
};

export type LocalizedMarkdownContent = {
  zh: string;
  en: string;
};

export type LocalizedLegalContent = LocalizedMarkdownContent;

export type SiteSettings = {
  name: string;
  subtitle: string;
  iconUrl: string;
  aboutContent: LocalizedMarkdownContent;
  privacyContent?: LocalizedLegalContent;
  termsContent?: LocalizedLegalContent;
  footer?: FooterSettings;
  homeHero?: HomeHeroSettings;
};

export type SiteSettingsPatch =
  | {
      section: "identity";
      name: string;
      subtitle: string;
      iconUrl: string;
    }
  | {
      section: "about";
      aboutContent: LocalizedMarkdownContent;
    }
  | {
      section: "privacy";
      privacyContent: LocalizedLegalContent;
    }
  | {
      section: "terms";
      termsContent: LocalizedLegalContent;
    }
  | {
      section: "home";
      homeHero: HomeHeroSettings;
    }
  | {
      section: "footer";
      footer: FooterSettings;
    };

export type AdminSecuritySettings = {
  passwordConfigured: boolean;
  updatedAt: string | null;
};

export type AdminPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type BackupCounts = {
  tools: number;
  articles: number;
  contentSources: number;
  contentItems: number;
  telegramMessages: number;
  settings: number;
};

export type HtoolsBackup = {
  source: "htools-backup";
  version: string;
  exportedAt: string;
  counts: BackupCounts;
  data: unknown;
};

export type BackupRestoreResponse = {
  restored: boolean;
  counts: BackupCounts;
};

export type FactoryResetResponse = {
  deleted: number;
  counts: BackupCounts;
};

type LinkCheckKind = "url" | "demoUrl";

export type LinkCheckTarget = {
  id: string;
  name: string;
  kind: LinkCheckKind;
  url: string;
};

export type LinkCheckResult = LinkCheckTarget & {
  status: number;
  ok: boolean;
  duration: number;
  checkedAt: string;
  finalUrl?: string;
  error?: string;
};

export type LinkCheckResponse = {
  results: LinkCheckResult[];
};

export type GitHubSettings = {
  enabled: boolean;
  owner: string;
  repo: string;
  labels: string[];
};

export type GitHubSettingsInput = GitHubSettings;

export type SubmissionInput = {
  name: string;
  description: string;
  url: string;
  category: string;
  locale?: "zh" | "en";
  tags: string[];
};
