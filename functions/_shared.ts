import {
  ADMIN_AI_MODELS,
  DEFAULT_ADMIN_AI_MODEL,
  type AdminAiModel
} from "../shared/admin-ai";
import {
  DEFAULT_RSSHUB_BASE_URL,
  normalizeRssHubBaseUrl,
  normalizeRssHubRouteUrl,
  resolveRssHubRouteUrl
} from "../shared/rsshub";

export type Env = {
  DB: D1Database;
  AI?: Ai;
  ADMIN_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  IMGBED_TOKEN?: string;
  TGTOKEN?: string;
  TGID?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

export type GitHubSettings = {
  enabled: boolean;
  owner: string;
  repo: string;
  labels: string[];
};

export type GitHubSettingsInput = {
  enabled?: unknown;
  owner?: unknown;
  repo?: unknown;
  labels?: unknown;
};

export type AdminAiSettings = {
  available: boolean;
  enabled: boolean;
  model: AdminAiModel;
};

export type AdminAiSettingsInput = {
  enabled?: unknown;
  model?: unknown;
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

export type GitHubAiContext = {
  fullName: string;
  description: string;
  topics: string[];
  language: string;
  license: string;
  stars: number;
  forks: number;
  readme: string;
};

type GitHubRepoResponse = {
  full_name?: string;
  name?: string;
  owner?: {
    login?: string;
  };
  html_url?: string;
  description?: string | null;
  homepage?: string | null;
  language?: string | null;
  license?: {
    spdx_id?: string | null;
    name?: string | null;
  } | null;
  topics?: unknown;
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
};

type GitHubMetadataCacheEntry = {
  metadata: GitHubToolMetadata;
  etag: string;
  cachedAt: number;
};

type GitHubReadmeCacheEntry = {
  readme: string;
  cachedAt: number;
};

export type ToolRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  demo_url?: string;
  image: string;
  category: string;
  tags: string;
  github_language?: string;
  github_license?: string;
  featured: number;
  created_at: string;
  updated_at: string;
};

export type ToolPayload = {
  name?: unknown;
  description?: unknown;
  url?: unknown;
  demoUrl?: unknown;
  demo_url?: unknown;
  image?: unknown;
  category?: unknown;
  tags?: unknown;
  githubLanguage?: unknown;
  github_language?: unknown;
  githubLicense?: unknown;
  github_license?: unknown;
  featured?: unknown;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string;
  published: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  content_item_id?: string | null;
};

export type ArticleSummaryRow = Omit<ArticleRow, "content">;

type ArticlePayload = {
  title?: unknown;
  slug?: unknown;
  summary?: unknown;
  content?: unknown;
  coverImage?: unknown;
  cover_image?: unknown;
  category?: unknown;
  tags?: unknown;
  published?: unknown;
  publishedAt?: unknown;
  published_at?: unknown;
};

export type ContentSourceRow = {
  id: string;
  title: string;
  url: string;
  site_url: string;
  description: string;
  category: string;
  tags: string;
  enabled: number;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
};

export type ContentItemRow = {
  id: string;
  source_id: string;
  source_title?: string;
  source_url?: string;
  external_id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  author: string;
  cover_image: string;
  category: string;
  tags: string;
  published_at: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
  article_id: string | null;
  linked_article_id?: string | null;
  linked_article_slug?: string | null;
  linked_article_title?: string | null;
  linked_article_published?: number | null;
  linked_article_category?: string | null;
};

export type ContentItemSummaryRow = Omit<ContentItemRow, "content">;

export const CONTENT_ITEM_SUMMARY_COLUMNS = `
  content_items.id,
  content_items.source_id,
  content_sources.title AS source_title,
  content_sources.url AS source_url,
  content_items.external_id,
  content_items.title,
  content_items.summary,
  content_items.url,
  content_items.author,
  content_items.cover_image,
  content_items.category,
  content_items.tags,
  content_items.published_at,
  content_items.synced_at,
  content_items.created_at,
  content_items.updated_at,
  content_items.article_id,
  articles.id AS linked_article_id,
  articles.slug AS linked_article_slug,
  articles.title AS linked_article_title,
  articles.category AS linked_article_category,
  articles.published AS linked_article_published
`;

type ContentSourcePayload = {
  title?: unknown;
  url?: unknown;
  siteUrl?: unknown;
  site_url?: unknown;
  description?: unknown;
  category?: unknown;
  tags?: unknown;
  enabled?: unknown;
};

type ParsedFeedItem = {
  externalId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  author: string;
  coverImage: string;
  tags: string[];
  publishedAt: string | null;
};

type ParsedFeed = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: ParsedFeedItem[];
};

export type AdminCategoryScope = "tools" | "articles" | "push" | "content";

export type AdminCategorySettings = Record<AdminCategoryScope, string[]>;

type AdminPasswordSettings = {
  algorithm: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  hash: string;
  updatedAt: string;
};

export type ProxySettings = {
  enabled: boolean;
  baseUrl: string;
  mode: "prefix" | "edgeone-proxy" | "edgeone-advanced";
  scope: "all" | "images";
};

export type RssHubSettings = {
  enabled: boolean;
  baseUrl: string;
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
      name?: unknown;
      subtitle?: unknown;
      iconUrl?: unknown;
    }
  | {
      section: "about";
      aboutContent?: unknown;
    }
  | {
      section: "privacy";
      privacyContent?: unknown;
    }
  | {
      section: "terms";
      termsContent?: unknown;
    }
  | {
      section: "home";
      homeHero?: unknown;
    }
  | {
      section: "footer";
      footer?: unknown;
    };

const encoder = new TextEncoder();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ADMIN_PASSWORD_KEY = "admin_password";
const ADMIN_PASSWORD_ITERATIONS = 100000;
// 会话签名密钥:首次签发令牌时自动生成并存进 app_settings,和登录密码彻底解绑。
// 32 字节 = 256 位,正好是 HMAC-SHA256 的原生块长度;再长也会被内部先哈希压回 32 字节,强度不变。
const SESSION_SECRET_KEY = "session_secret";
const SESSION_SECRET_BYTES = 32;
const DATABASE_NOT_BOUND_MESSAGE = "请检查您的项目是否已正确绑定数据库。";
const GITHUB_SETTINGS_KEY = "github_settings";
const AI_SETTINGS_KEY = "ai_settings";
const PROXY_SETTINGS_KEY = "proxy_settings";
const RSSHUB_SETTINGS_KEY = "rsshub_settings";
const UMAMI_SETTINGS_KEY = "umami_settings";
const SITE_SETTINGS_KEY = "site_settings";
const ADMIN_CATEGORY_SETTINGS_KEY = "admin_category_settings";
const SITE_ICON_DATA_URL_MAX_LENGTH = 1500 * 1024;
const SITE_ICON_DATA_URL_PATTERN =
  /^data:image\/(?:png|jpe?g|webp|gif|x-icon|vnd\.microsoft\.icon);base64,[a-z0-9+/]+=*$/i;
const DEFAULT_ABOUT_CONTENT = `# 关于我

大家好，我是**周润发**（网名），也是 [blog.zrf.me](https://blog.zrf.me/) 的博主。

一直以来我就一个爱好：作为一枚小白，致力于折腾并 **收录各种开源、好用的互联网项目** 。分享实用资源嘛，好用就完事了！

但在写博客的过程中，我遇到个痛点：网上好玩的工具实在太多了，但并不是每个项目都适合正儿八经地水一篇长博文。有些小工具明明极其优秀，却因为体量小，找不到合适的渠道去展示和分享，最后只能默默躺在我的收藏夹里吃灰。

### 一直想做这样一个工具导航站，所以，**HTools** 诞生了。

把这些宝藏项目全收录进去。市面上类似的能使用 “赛博大善人” cloudflare 部署，且适合我用于收集的开源导航程序我翻了个底朝天，说实话，UI 外观没几个长在我的审美上的。

但我自己又没啥建站和前端技术，怎么办？**遇事不决，AI 解决！**

我直接“天才程序员上线”，至于 UI 嘛，全靠“抄”也确实是抄，然后加上我自己的想法构思。一通折腾下来，居然真的实现了！现在这个项目的基本使用体验，已经和我脑海中完美的工具站一模一样了。为了方便大家自己部署，我还给项目设置了非常多的自定义选项。

当然，毕竟代码是靠 AI 搓出来的，如果哪位开发大佬路过，愿意提交 PR 来帮我进一步完善优化这个项目，那就再好不过了（抱大腿）。

---

我希望 HTools 不是一个冷冰冰的链接列表，而是一个能持续沉淀好东西的小仓库。看到不错的项目，就顺手放进来；哪天真要用，也不用再翻聊天记录、收藏夹和浏览器历史。

这里更适合收录这些内容：

- **开源项目** - 有意思、能部署、值得研究的仓库
- **在线工具** - 打开就能用，解决一个具体问题
- **部署方案** - 适合 Cloudflare、轻量服务器、自建环境的实践
- **效率资源** - 能省时间、少踩坑、让工作流更顺手的小东西

当然，这些是我感兴趣的内容，如果你也发现了好用的工具和感兴趣的内容，欢迎通过网站提交给我。只要它确实有用、介绍清楚、链接可靠，我都会认真看看。这个项目本身也会继续更新，目标很简单：把零散的好项目收拾得更清楚，让需要的人更快找到。

**如果 HTools 对你有帮助，也欢迎给项目点个 Star：[shaoyouvip/htools](https://github.com/shaoyouvip/htools)**

慢慢收集，慢慢打磨。能帮到一个人，就不算白折腾。

::links
## 产品链接

- [作者](https://github.com/shaoyouvip/)
- [主页](https://zrf.me/)
- [博客](https://blog.zrf.me/)
- [Github](https://github.com/shaoyouvip/htools)
- [Telegram](https://d.zrf.me/tgq)
::`;
const LEGACY_DEFAULT_FOOTER_DESCRIPTION =
  "探索精选工具和资源，加速您的独立开发之旅";
const PREVIOUS_DEFAULT_FOOTER_DESCRIPTION = "收录各种开源、好用的互联网项目";
const TEMP_DEFAULT_FOOTER_DESCRIPTION = "整理开源项目与实用工具";
const DEFAULT_FOOTER_DESCRIPTION = "致力于收录各种开源、好用的互联网项目";
const FOOTER_PROJECT_URL = "https://github.com/shaoyouvip/htools";
const LEGACY_DEFAULT_SPONSOR_URL = "https://www.buymeacoffee.com/";
const LEGACY_DEFAULT_AUTHOR_URL = "https://zrf.me/";
const DEFAULT_SPONSOR_URL = "https://example.com";
const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  description: DEFAULT_FOOTER_DESCRIPTION,
  authorName: "HTools",
  authorUrl: FOOTER_PROJECT_URL,
  copyright: "© 2026 HTools 版权所有，保留所有权利。",
  sponsorLabel: "Buy me a coffee",
  sponsorUrl: DEFAULT_SPONSOR_URL,
  socialLinks: [
    { label: "GitHub", href: "https://github.com/shaoyouvip/htools" },
    { label: "Email", href: "mailto:admin@zrf.me" },
    { label: "Telegram", href: "https://d.zrf.me/tgq" }
  ],
  groups: [
    {
      title: "产品",
      links: [
        { label: "工具", href: "/tools" },
        { label: "文章", href: "/articles" },
        { label: "提交工具", href: "/submit" }
      ]
    },
    {
      title: "支持",
      links: [
        { label: "电子邮件", href: "mailto:admin@zrf.me" },
        { label: "GitHub", href: "https://github.com/shaoyouvip/htools" },
        { label: "Telegram", href: "https://d.zrf.me/tgq" }
      ]
    },
    {
      title: "其他",
      links: [
        { label: "主页", href: "https://zrf.me/" },
        { label: "博客", href: "https://blog.zrf.me" }
      ]
    },
    {
      title: "更多",
      links: [
        { label: "关于我们", href: "/about" },
        { label: "隐私政策", href: "/privacy" },
        { label: "服务条款", href: "/terms" }
      ]
    }
  ]
};
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: "HTools",
  subtitle: "工具导航站",
  iconUrl: "",
  aboutContent: { zh: DEFAULT_ABOUT_CONTENT, en: "" },
  privacyContent: { zh: "", en: "" },
  termsContent: { zh: "", en: "" },
  homeHero: {
    zh: { titleTop: "", titleBottom: "", description: "" },
    en: { titleTop: "", titleBottom: "", description: "" }
  }
};
const ADMIN_CATEGORY_SCOPES = ["tools", "articles", "push", "content"] as const;
const DEFAULT_ADMIN_CATEGORY_SETTINGS: AdminCategorySettings = {
  tools: [],
  articles: [],
  push: [],
  content: []
};
const initializedDatabases = new WeakSet<D1Database>();
const databaseInitializationPromises = new WeakMap<D1Database, Promise<void>>();
const initializedTelegramMessageDatabases = new WeakSet<D1Database>();
const telegramMessageInitializationPromises = new WeakMap<D1Database, Promise<void>>();
const DATABASE_SCHEMA_VERSION_KEY = "database_schema_version";
// Increment this whenever SCHEMA_STATEMENTS or compatibility column upgrades change.
const DATABASE_SCHEMA_VERSION = 18;
const TELEGRAM_MESSAGE_COLUMNS = `id, resource_type, resource_id, custom_title,
  resource_data, category,
  chat_id, target_ref, message_id, message_markdown, media_enabled, media_url,
  last_pushed_hash, sent_at, updated_at, last_pushed_media_enabled`;
const TELEGRAM_MESSAGE_MIGRATION_TABLE = "telegram_messages_migrate";

function createTelegramMessageTableStatement(table: string) {
  return `CREATE TABLE IF NOT EXISTS ${table} (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('tool', 'article', 'content', 'custom')),
  resource_id TEXT NOT NULL,
  custom_title TEXT NOT NULL DEFAULT '',
  resource_data TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  chat_id TEXT NOT NULL,
  target_ref TEXT NOT NULL DEFAULT '',
  message_id TEXT NOT NULL,
  message_markdown TEXT NOT NULL DEFAULT '',
  media_enabled INTEGER NOT NULL DEFAULT 0,
  media_url TEXT NOT NULL DEFAULT '',
  last_pushed_hash TEXT NOT NULL DEFAULT '',
  last_pushed_media_enabled INTEGER,
  sent_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_type, resource_id, chat_id)
)`;
}

const TELEGRAM_MESSAGE_TABLE_STATEMENT =
  createTelegramMessageTableStatement("telegram_messages");
const TELEGRAM_MESSAGE_INDEX_STATEMENT = `CREATE INDEX IF NOT EXISTS idx_telegram_messages_resource
  ON telegram_messages (resource_type, resource_id, updated_at DESC)`;
const TELEGRAM_PUSH_LOCK_TABLE_STATEMENT = `CREATE TABLE IF NOT EXISTS telegram_push_locks (
  resource_type TEXT NOT NULL CHECK (resource_type IN ('tool', 'article', 'content', 'custom')),
  resource_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('save', 'send', 'update', 'recover', 'delete')),
  lock_token TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'uncertain')),
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_type, resource_id)
)`;
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    demo_url TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    github_language TEXT NOT NULL DEFAULT '',
    github_license TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tools_latest_sort
     ON tools (updated_at DESC, created_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_tools_category_latest_sort
     ON tools (category, updated_at DESC, created_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_tools_featured_latest_sort
     ON tools (featured, updated_at DESC, created_at DESC, id DESC)`,
  "DROP INDEX IF EXISTS idx_tools_category",
  "DROP INDEX IF EXISTS idx_tools_featured",
  TELEGRAM_MESSAGE_TABLE_STATEMENT,
  TELEGRAM_MESSAGE_INDEX_STATEMENT,
  TELEGRAM_PUSH_LOCK_TABLE_STATEMENT,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT,
    content_item_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_articles_public_sort
     ON articles (
       published,
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  `CREATE INDEX IF NOT EXISTS idx_articles_public_category_sort
     ON articles (
       published,
       category,
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  `CREATE INDEX IF NOT EXISTS idx_articles_latest_sort
     ON articles (
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  `CREATE INDEX IF NOT EXISTS idx_articles_category_latest_sort
     ON articles (
       category,
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  "CREATE INDEX IF NOT EXISTS idx_articles_name_sort ON articles (title, id)",
  `CREATE INDEX IF NOT EXISTS idx_articles_category_name_sort
     ON articles (category, title, id)`,
  "DROP INDEX IF EXISTS idx_articles_slug",
  "DROP INDEX IF EXISTS idx_articles_published",
  "DROP INDEX IF EXISTS idx_articles_category",
  `CREATE TABLE IF NOT EXISTS content_sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    site_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TEXT
  )`,
  "CREATE INDEX IF NOT EXISTS idx_content_sources_category ON content_sources (category)",
  `CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    published_at TEXT,
    synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    article_id TEXT,
    UNIQUE(source_id, external_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_latest_sort
     ON content_items (
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_source_latest_sort
     ON content_items (
       source_id,
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_category_latest_sort
     ON content_items (
       category,
       COALESCE(published_at, updated_at, created_at) DESC,
       id DESC
     )`,
  "DROP INDEX IF EXISTS idx_content_items_source",
  "DROP INDEX IF EXISTS idx_content_items_category",
  "DROP INDEX IF EXISTS idx_github_oauth_states_expires_at",
  "DROP INDEX IF EXISTS idx_github_sessions_expires_at",
  "DROP TABLE IF EXISTS github_oauth_states",
  "DROP TABLE IF EXISTS github_sessions",
  "DELETE FROM app_settings WHERE key LIKE 'github_submission_cooldown:%'",
  `UPDATE app_settings
   SET value = CASE WHEN json_valid(value) THEN
     '{"enabled":' ||
       CASE WHEN json_extract(value, '$.enabled') = 1 THEN 'true' ELSE 'false' END ||
       ',"owner":' || json_quote(TRIM(COALESCE(json_extract(value, '$.owner'), ''))) ||
       ',"repo":' || json_quote(TRIM(COALESCE(json_extract(value, '$.repo'), ''))) ||
       ',"labels":' || CASE
         WHEN json_type(value, '$.labels') = 'array' THEN json_extract(value, '$.labels')
         ELSE '["tool-submission"]'
       END || '}'
     ELSE '{"enabled":false,"owner":"","repo":"","labels":["tool-submission"]}'
   END,
     updated_at = CURRENT_TIMESTAMP
   WHERE key = 'github_settings'`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS articles_search USING fts5(
    article_id UNINDEXED,
    title,
    summary,
    content,
    slug,
    category,
    tags,
    tokenize='trigram'
  )`,
  `CREATE TABLE IF NOT EXISTS admin_login_attempts (
    client_key TEXT PRIMARY KEY,
    failed_count INTEGER NOT NULL DEFAULT 0,
    window_started_at TEXT NOT NULL,
    blocked_until TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_updated_at
     ON admin_login_attempts (updated_at)`,
  `CREATE TRIGGER IF NOT EXISTS articles_search_ai
   AFTER INSERT ON articles
   BEGIN
     INSERT INTO articles_search
       (article_id, title, summary, content, slug, category, tags)
     VALUES
       (new.id, new.title, new.summary, new.content, new.slug, new.category, new.tags);
   END`,
  `CREATE TRIGGER IF NOT EXISTS articles_search_au
   AFTER UPDATE OF title, summary, content, slug, category, tags ON articles
   BEGIN
     DELETE FROM articles_search WHERE article_id = old.id;
     INSERT INTO articles_search
       (article_id, title, summary, content, slug, category, tags)
     VALUES
       (new.id, new.title, new.summary, new.content, new.slug, new.category, new.tags);
   END`,
  `CREATE TRIGGER IF NOT EXISTS articles_search_ad
   AFTER DELETE ON articles
   BEGIN
     DELETE FROM articles_search WHERE article_id = old.id;
   END`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS content_items_search USING fts5(
    item_id UNINDEXED,
    source_id UNINDEXED,
    title,
    summary,
    url,
    author,
    tags,
    source_title,
    tokenize='trigram'
  )`,
  `CREATE TRIGGER IF NOT EXISTS content_items_search_ai
   AFTER INSERT ON content_items
   BEGIN
     INSERT INTO content_items_search
       (item_id, source_id, title, summary, url, author, tags, source_title)
     VALUES
       (new.id, new.source_id, new.title, new.summary, new.url, new.author, new.tags,
        COALESCE((SELECT title FROM content_sources WHERE id = new.source_id), ''));
   END`,
  `CREATE TRIGGER IF NOT EXISTS content_items_search_au
   AFTER UPDATE OF source_id, title, summary, url, author, tags ON content_items
   BEGIN
     DELETE FROM content_items_search WHERE item_id = old.id;
     INSERT INTO content_items_search
       (item_id, source_id, title, summary, url, author, tags, source_title)
     VALUES
       (new.id, new.source_id, new.title, new.summary, new.url, new.author, new.tags,
        COALESCE((SELECT title FROM content_sources WHERE id = new.source_id), ''));
   END`,
  `CREATE TRIGGER IF NOT EXISTS content_items_search_ad
   AFTER DELETE ON content_items
   BEGIN
     DELETE FROM content_items_search WHERE item_id = old.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS content_items_article_unlink_ad
   AFTER DELETE ON content_items
   BEGIN
     UPDATE articles SET content_item_id = NULL WHERE content_item_id = old.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS content_sources_search_au
   AFTER UPDATE OF title ON content_sources
   BEGIN
     DELETE FROM content_items_search WHERE source_id = old.id;
     INSERT INTO content_items_search
       (item_id, source_id, title, summary, url, author, tags, source_title)
     SELECT id, source_id, title, summary, url, author, tags, new.title
     FROM content_items
     WHERE source_id = new.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS content_sources_search_ad
   AFTER DELETE ON content_sources
   BEGIN
     DELETE FROM content_items_search WHERE source_id = old.id;
   END`,
  "DELETE FROM articles_search",
  `INSERT INTO articles_search
     (article_id, title, summary, content, slug, category, tags)
   SELECT id, title, summary, content, slug, category, tags
   FROM articles`,
  "DELETE FROM content_items_search",
  `INSERT INTO content_items_search
     (item_id, source_id, title, summary, url, author, tags, source_title)
   SELECT content_items.id, content_items.source_id, content_items.title,
          content_items.summary, content_items.url, content_items.author,
          content_items.tags, content_sources.title
   FROM content_items
   JOIN content_sources ON content_sources.id = content_items.source_id`
];

const TOOL_COLUMN_STATEMENTS = [
  {
    name: "github_language",
    statement: "ALTER TABLE tools ADD COLUMN github_language TEXT NOT NULL DEFAULT ''"
  },
  {
    name: "github_license",
    statement: "ALTER TABLE tools ADD COLUMN github_license TEXT NOT NULL DEFAULT ''"
  }
];
const ARTICLE_COLUMN_STATEMENTS = [
  {
    name: "content_item_id",
    statement: "ALTER TABLE articles ADD COLUMN content_item_id TEXT"
  }
];
type ApiErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "INVALID_PASSWORD"
  | "PASSWORD_UNCHANGED"
  | "TURNSTILE_CONFIG_ERROR"
  | "TURNSTILE_REQUIRED"
  | "TURNSTILE_FAILED"
  | "TURNSTILE_UNAVAILABLE"
  | "TELEGRAM_NOT_CONFIGURED"
  | "TELEGRAM_DISABLED"
  | "TELEGRAM_TARGET_UNAVAILABLE"
  | "TELEGRAM_PERMISSION_DENIED"
  | "TELEGRAM_MESSAGE_NOT_FOUND"
  | "TELEGRAM_MESSAGE_EXISTS"
  | "TELEGRAM_TARGET_CHANGED"
  | "TELEGRAM_MESSAGE_TOO_LONG"
  | "TELEGRAM_TEST_TIMEOUT"
  | "TELEGRAM_PUSH_IN_PROGRESS"
  | "TELEGRAM_PUSH_UNCERTAIN"
  | "TELEGRAM_UNAVAILABLE"
  | "GITHUB_METADATA_TIMEOUT"
  | "IMAGE_BED_NOT_CONFIGURED"
  | "IMAGE_BED_DISABLED"
  | "IMAGE_BED_URL_INVALID"
  | "IMAGE_FILE_INVALID"
  | "IMAGE_FILE_TOO_LARGE"
  | "IMAGE_UPLOAD_TIMEOUT"
  | "IMAGE_UPLOAD_FAILED"
  | "IMAGE_UPLOAD_RESPONSE_INVALID"
  | "CATEGORY_ICONS_CAPACITY"
  | "BACKUP_DATA_INVALID";

type ApiErrorPayload = {
  error: string;
  code?: ApiErrorCode;
  [key: string]: unknown;
};

type ApiActionSuccess = {
  success: true;
};

type ApiDeleteSuccess = ApiActionSuccess & {
  deleted: true;
  resource: "tool" | "article" | "contentSource";
  id: string;
};

function getApiErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "INVALID_REQUEST";
}

function withApiErrorCode(data: unknown, status: number) {
  if (
    status < 400 ||
    typeof data !== "object" ||
    data === null ||
    !("error" in data) ||
    typeof data.error !== "string" ||
    ("code" in data && typeof data.code === "string")
  ) {
    return data;
  }

  return {
    ...data,
    code: getApiErrorCode(status)
  };
}

export function json(data: unknown, init: ResponseInit = {}) {
  const status = init.status ?? 200;
  return new Response(JSON.stringify(withApiErrorCode(data, status)), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers
    }
  });
}

export function jsonError(
  error: string,
  code: ApiErrorCode,
  init: ResponseInit & { status: number },
  details: Omit<ApiErrorPayload, "error" | "code"> = {}
) {
  return json({ error, code, ...details }, init);
}

export function jsonDeleted(
  resource: ApiDeleteSuccess["resource"],
  id: string,
  init: ResponseInit = {}
) {
  return json(
    { success: true, deleted: true, resource, id } satisfies ApiDeleteSuccess,
    init
  );
}

export const PUBLIC_API_CACHE_KEYS = {
  tools: "tools-v2",
  categories: "categories-v1",
  articles: "articles-v2",
  proxySettings: "proxy-settings-v1",
  siteSettingsBasic: "site-settings-basic-v2",
  siteSettingsFull: "site-settings-full-v2",
  toolSource: "tool-source-v1"
} as const;
const PUBLIC_API_CACHE_VERSION_KEY = "public_api_cache_version";

type PublicJsonCacheOptions = {
  cacheKey: string;
  cacheVersion: string;
  ttlSeconds: number;
  headers?: HeadersInit;
  responseCacheControl?: string;
  shouldCache?: (data: unknown) => boolean;
  waitUntil?: (promise: Promise<unknown>) => void;
};

export async function cachedPublicJson(
  request: Request,
  load: () => Promise<unknown>,
  options: PublicJsonCacheOptions
) {
  const cacheRequest = createPublicApiCacheRequest(
    options.cacheKey,
    options.cacheVersion
  );
  const cached = await readPublicApiCache(cacheRequest);
  if (cached) {
    return createPublicApiClientResponse(request, cached, options, "HIT");
  }

  const data = await load();
  const body = JSON.stringify(data);
  const etag = await createPublicApiEtag(body);
  const shouldCache = options.shouldCache?.(data) ?? true;
  const responseHeaders = createPublicApiHeaders(options.headers, etag);
  responseHeaders.set(
    "Cache-Control",
    shouldCache
      ? (options.responseCacheControl ?? "private, no-cache, max-age=0")
      : "no-store"
  );
  responseHeaders.set("X-HTools-Cache", shouldCache ? "MISS" : "BYPASS");

  if (shouldCache) {
    const cacheHeaders = new Headers(responseHeaders);
    cacheHeaders.set("Cache-Control", `public, max-age=${options.ttlSeconds}`);
    cacheHeaders.delete("X-HTools-Cache");
    const write = writePublicApiCache(
      cacheRequest,
      new Response(body, { headers: cacheHeaders })
    );

    if (options.waitUntil) {
      try {
        options.waitUntil(write);
      } catch {
        await write;
      }
    } else {
      await write;
    }
  }

  if (matchesIfNoneMatch(request, etag)) {
    responseHeaders.delete("Content-Length");
    responseHeaders.delete("Content-Encoding");
    return new Response(null, { status: 304, headers: responseHeaders });
  }

  return new Response(body, { headers: responseHeaders });
}

export async function getPublicApiCacheVersion(env: Env) {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(PUBLIC_API_CACHE_VERSION_KEY)
    .first<{ value: string }>();
  return row?.value?.trim() || "0";
}

export async function invalidatePublicApiCache(env: Env) {
  const db = await getDatabase(env);
  const version = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(PUBLIC_API_CACHE_VERSION_KEY, version)
    .run();
}

function createPublicApiCacheRequest(cacheKey: string, cacheVersion: string) {
  const key = encodeURIComponent(cacheKey);
  const version = encodeURIComponent(cacheVersion);
  return new Request(
    `https://htools-public-api-cache.invalid/${key}/${version}`,
    { method: "GET" }
  );
}

async function readPublicApiCache(cacheKey: Request) {
  try {
    const cache = getDefaultCloudflareCache();
    return cache ? await cache.match(cacheKey) : undefined;
  } catch {
    return undefined;
  }
}

async function writePublicApiCache(cacheKey: Request, response: Response) {
  try {
    const cache = getDefaultCloudflareCache();
    if (cache) await cache.put(cacheKey, response);
  } catch {
    // Public APIs continue reading from D1 when Cache API is unavailable.
  }
}

function createPublicApiHeaders(headers: HeadersInit | undefined, etag: string) {
  const result = new Headers(headers);
  result.set("Content-Type", "application/json; charset=utf-8");
  result.set("ETag", etag);
  return result;
}

async function createPublicApiEtag(body: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body)
  );
  const value = Array.from(new Uint8Array(digest).slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `"${value}"`;
}

function matchesIfNoneMatch(request: Request, etag: string) {
  const value = request.headers.get("If-None-Match");
  if (!value) return false;

  return value.split(",").some((candidate) => {
    const normalized = candidate.trim().replace(/^W\//, "");
    return normalized === "*" || normalized === etag;
  });
}

function createPublicApiClientResponse(
  request: Request,
  cached: Response,
  options: PublicJsonCacheOptions,
  cacheStatus: "HIT"
) {
  const headers = new Headers(cached.headers);
  headers.set(
    "Cache-Control",
    options.responseCacheControl ?? "private, no-cache, max-age=0"
  );
  headers.set("X-HTools-Cache", cacheStatus);
  const etag = headers.get("ETag") ?? "";

  if (etag && matchesIfNoneMatch(request, etag)) {
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    return new Response(null, { status: 304, headers });
  }

  return new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers
  });
}

export function badRequest(message: string) {
  return jsonError(message, "INVALID_REQUEST", { status: 400 });
}

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class UpstreamServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamServiceError";
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError");
}

export function writeErrorResponse(
  error: unknown,
  fallbackMessage: string,
  headers?: HeadersInit
) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (error instanceof ConflictError) {
    return jsonError(message, "CONFLICT", { status: 409, headers });
  }

  if (error instanceof SyntaxError || error instanceof InvalidRequestError) {
    return jsonError(message, "INVALID_REQUEST", { status: 400, headers });
  }

  if (error instanceof UpstreamServiceError) {
    return jsonError(message, "SERVER_ERROR", { status: 502, headers });
  }

  return jsonError(message, "SERVER_ERROR", { status: 500, headers });
}

export function createSearchTerms(value: string, maximumPatternBytes = 50) {
  const encoder = new TextEncoder();
  let plain = "";
  let escaped = "";
  let byteLength = 2;

  for (const character of value) {
    const next = /[\\%_]/.test(character) ? `\\${character}` : character;
    const nextLength = encoder.encode(next).length;
    if (byteLength + nextLength > maximumPatternBytes) break;
    plain += character;
    escaped += next;
    byteLength += nextLength;
  }

  return {
    plain,
    likePattern: `%${escaped}%`,
    ftsPhrase: `"${plain.replace(/"/g, '""')}"`,
    useFts: Array.from(plain).length >= 3
  };
}

export function isFtsSearchUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table:\s*(articles|content_items)_search|no such module:\s*fts5/i.test(
    message
  );
}

export function toolFromRow(row: ToolRow) {
  const { demo_url, github_language, github_license, ...tool } = row;

  return {
    ...tool,
    demoUrl: demo_url ?? "",
    githubLanguage: github_language ?? "",
    githubLicense: github_license ?? "",
    tags: safelyParseTags(row.tags),
    featured: row.featured === 1
  };
}

export function toolSourceFromRow(row: ToolRow) {
  const tool = toolFromRow(row);

  return {
    createdAt: tool.created_at || tool.updated_at || new Date().toISOString(),
    updatedAt: tool.updated_at || tool.created_at || new Date().toISOString(),
    id: tool.id,
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

export function articleFromRow(row: ArticleRow) {
  const { cover_image, ...article } = row;

  return {
    ...article,
    coverImage: cover_image ?? "",
    publishedAt: row.published_at,
    tags: normalizeFeedItemTags(
      safelyParseTags(row.tags),
      row.title,
      row.summary,
      row.content
    ),
    published: row.published === 1
  };
}

export function articleSummaryFromRow(row: ArticleSummaryRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.cover_image ?? "",
    category: row.category,
    publishedAt: row.published_at,
    tags: normalizeFeedItemTags(
      safelyParseTags(row.tags),
      row.title,
      row.summary,
      ""
    ),
    published: row.published === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at
  };
}

export function contentSourceFromRow(row: ContentSourceRow) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    siteUrl: row.site_url ?? "",
    description: row.description,
    category: row.category,
    tags: safelyParseTags(row.tags),
    enabled: row.enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lastSyncedAt: row.last_synced_at
  };
}

export function contentItemSummaryFromRow(row: ContentItemSummaryRow) {
  const title = normalizeFeedItemTitle(row.title, row.summary, row.summary);
  const summary = normalizeFeedItemSummary(row.summary, row.summary, title);
  const tags = normalizeFeedItemTags(
    safelyParseTags(row.tags),
    row.title,
    row.summary,
    ""
  );
  const hasLinkedArticle = Boolean(
    row.linked_article_id && row.linked_article_slug
  );

  return {
    id: row.id,
    sourceId: row.source_id,
    sourceTitle: row.source_title ?? "",
    sourceUrl: row.source_url ?? "",
    external_id: row.external_id,
    title,
    summary,
    url: row.url,
    author: row.author,
    coverImage: row.cover_image ?? "",
    category: row.category,
    tags,
    published_at: row.published_at,
    synced_at: row.synced_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    articleId: hasLinkedArticle ? row.linked_article_id : null,
    articleSlug: hasLinkedArticle ? (row.linked_article_slug ?? "") : "",
    articleCategory: hasLinkedArticle ? (row.linked_article_category ?? "") : "",
    articlePublished:
      hasLinkedArticle && row.linked_article_published !== undefined
        ? row.linked_article_published === 1
        : null
  };
}

export function createContentItemMarker(id: string) {
  return `<!-- htools:content-item:${id} -->`;
}

export async function getDatabase(env: Env) {
  if (!env.DB) {
    throw new Error(DATABASE_NOT_BOUND_MESSAGE);
  }

  await ensureDatabaseSchema(env.DB);
  return env.DB;
}

export async function ensureDatabaseSchema(db: D1Database) {
  if (initializedDatabases.has(db)) {
    return;
  }

  const pending = databaseInitializationPromises.get(db);
  if (pending) {
    await pending;
    return;
  }

  const initialization = initializeDatabaseSchema(db);
  databaseInitializationPromises.set(db, initialization);

  try {
    await initialization;
    initializedDatabases.add(db);
  } finally {
    databaseInitializationPromises.delete(db);
  }
}

const ADMIN_TURNSTILE_ENABLED_KEY = "admin_turnstile_enabled";

type AdminTurnstileSettings = {
  available: boolean;
  enabled: boolean;
  siteKey: string;
};

export async function getAdminTurnstileSettings(
  env: Env
): Promise<AdminTurnstileSettings> {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  const available = Boolean(siteKey && secretKey);
  if (!available) return { available: false, enabled: false, siteKey: "" };

  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(ADMIN_TURNSTILE_ENABLED_KEY)
    .first<{ value: string }>();
  let enabled = false;
  if (row?.value) {
    try {
      enabled = (JSON.parse(row.value) as { enabled?: unknown }).enabled === true;
    } catch {
      enabled = false;
    }
  }
  return { available, enabled, siteKey: enabled ? siteKey : "" };
}

export async function saveAdminTurnstileEnabled(env: Env, enabled: boolean) {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  if (enabled && !(siteKey && secretKey)) {
    throw new InvalidRequestError("Cloudflare Turnstile environment variables are not configured.");
  }
  const db = await getDatabase(env);
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).bind(ADMIN_TURNSTILE_ENABLED_KEY, JSON.stringify({ enabled })).run();
  return getAdminTurnstileSettings(env);
}

export async function verifyTurnstileRequest(request: Request, env: Env, tokenValue: unknown) {
  const settings = await getAdminTurnstileSettings(env);
  if (!settings.enabled) return null;
  let token = "";
  if (typeof tokenValue === "string") token = tokenValue.trim();
  const tokenMissing = token.length === 0;
  if (tokenMissing) {
    return jsonError("Cloudflare Turnstile verification is required.", "TURNSTILE_REQUIRED", {
      status: 400
    });
  }

  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY?.trim() ?? "");
  form.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP")?.trim();
  if (remoteIp) form.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!response.ok) throw new Error("Turnstile service request failed.");
    const verification = (await response.json()) as { success?: boolean };
    if (verification.success === true) return null;
    return jsonError("Cloudflare Turnstile verification failed.", "TURNSTILE_FAILED", {
      status: 403
    });
  } catch {
    return jsonError(
      "Cloudflare Turnstile verification service is unavailable.",
      "TURNSTILE_UNAVAILABLE",
      { status: 502 }
    );
  }
}

async function initializeDatabaseSchema(db: D1Database) {
  const storedVersion = await readDatabaseSchemaVersion(db);
  if (storedVersion === DATABASE_SCHEMA_VERSION) {
    return;
  }

  if (storedVersion > DATABASE_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${storedVersion} is newer than supported version ${DATABASE_SCHEMA_VERSION}.`
    );
  }

  await db.batch(SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)));
  await ensureToolColumns(db);
  await ensureArticleColumns(db);
  await ensureTelegramMessageSchema(db);
  if (storedVersion < 18) {
    // 旧版更新可能包含替换发送；遗留操作不能按新版原地编辑直接重试。
    await db.prepare("UPDATE telegram_push_locks SET operation = 'send' WHERE operation = 'update'").run();
  }
  await removeLegacySourceUpdateColumns(db);
  await db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_content_item_id
     ON articles (content_item_id)
     WHERE content_item_id IS NOT NULL`
  ).run();
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(DATABASE_SCHEMA_VERSION_KEY, String(DATABASE_SCHEMA_VERSION))
    .run();
}

async function readDatabaseSchemaVersion(db: D1Database) {
  try {
    const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
      .bind(DATABASE_SCHEMA_VERSION_KEY)
      .first<{ value: string }>();
    const version = Number(row?.value ?? 0);
    return Number.isSafeInteger(version) && version >= 0 ? version : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such table:\s*app_settings/i.test(message)) {
      return 0;
    }
    throw error;
  }
}

async function ensureToolColumns(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(tools)").all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));
  const statements = TOOL_COLUMN_STATEMENTS
    .filter((column) => !existing.has(column.name))
    .map((column) => db.prepare(column.statement));

  if (statements.length) {
    await db.batch(statements);
  }
}

export function validateToolPayload(payload: ToolPayload) {
  const name = readRequiredString(payload.name, "name");
  const description = readRequiredString(payload.description, "description");
  const url = readRequiredString(payload.url, "url");
  const demoUrl =
    typeof payload.demoUrl === "string" && payload.demoUrl.trim()
      ? payload.demoUrl.trim()
      : typeof payload.demo_url === "string" && payload.demo_url.trim()
        ? payload.demo_url.trim()
        : "";
  const category = readRequiredString(payload.category, "category");
  const image =
    typeof payload.image === "string" && payload.image.trim()
      ? payload.image.trim()
      : createPreviewUrl(url);
  const tags = Array.isArray(payload.tags)
    ? payload.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const featured = payload.featured === true;
  const isGitHubTool = Boolean(getGitHubRepoPath(url));
  const githubLanguage = isGitHubTool
    ? readOptionalString(
        typeof payload.githubLanguage === "string"
          ? payload.githubLanguage
          : payload.github_language
      ).slice(0, 48)
    : "";
  const githubLicense = isGitHubTool
    ? readOptionalString(
        typeof payload.githubLicense === "string"
          ? payload.githubLicense
          : payload.github_license
      ).slice(0, 64)
    : "";

  try {
    new URL(url);
  } catch {
    throw new InvalidRequestError("url must be a valid URL.");
  }

  if (image) {
    try {
      new URL(image);
    } catch {
      throw new InvalidRequestError("image must be a valid URL.");
    }
  }

  if (demoUrl) {
    try {
      new URL(demoUrl);
    } catch {
      throw new InvalidRequestError("demoUrl must be a valid URL.");
    }
  }

  return {
    name,
    description,
    url,
    demoUrl,
    image,
    category,
    tags,
    githubLanguage,
    githubLicense,
    featured
  };
}

export function validateArticlePayload(payload: ArticlePayload) {
  const title = readRequiredString(payload.title, "title").slice(0, 140);
  const summary = readRequiredString(payload.summary, "summary").slice(0, 260);
  const content = truncateMarkdown(
    readRequiredString(payload.content, "content"),
    60000
  );
  const slug =
    typeof payload.slug === "string" && payload.slug.trim()
      ? createArticleSlug(payload.slug)
      : createArticleSlug(title);
  const category = readRequiredString(payload.category, "category").slice(0, 48);

  if (
    category === "全部" ||
    category === "精选" ||
    category.toLowerCase() === "all" ||
    category.toLowerCase() === "featured"
  ) {
    throw new InvalidRequestError("category must be an article category.");
  }

  const coverImage =
    typeof payload.coverImage === "string" && payload.coverImage.trim()
      ? payload.coverImage.trim()
      : typeof payload.cover_image === "string" && payload.cover_image.trim()
        ? payload.cover_image.trim()
        : "";
  const tagValues = Array.isArray(payload.tags)
    ? payload.tags
    : typeof payload.tags === "string"
      ? parseArticleTagString(payload.tags)
      : [];
  const tags = tagValues
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, 24);
  const published = payload.published !== false;
  const publishedAt = readOptionalDateString(
    payload.publishedAt ?? payload.published_at,
    "publishedAt"
  );

  if (coverImage) {
    try {
      const url = new URL(coverImage);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error();
      }
    } catch {
      throw new InvalidRequestError("coverImage must be a valid URL.");
    }
  }

  return {
    title,
    slug: slug || createArticleSlug("article"),
    summary,
    content,
    coverImage,
    category,
    tags,
    published,
    publishedAt
  };
}

export function validateContentSourcePayload(
  payload: ContentSourcePayload,
  options: { requireCategory?: boolean } = {}
) {
  const { requireCategory = true } = options;
  const rawUrl = readRequiredString(payload.url, "url");
  const url = normalizeRssHubRouteUrl(rawUrl) || normalizeHttpUrl(rawUrl);

  if (!url) {
    throw new InvalidRequestError("url must be a valid URL.");
  }

  const title = readOptionalString(payload.title).slice(0, 120);
  const description = readOptionalString(payload.description).slice(0, 260);
  const siteUrl = normalizeHttpUrl(
    readOptionalString(payload.siteUrl ?? payload.site_url)
  );
  const category = requireCategory
    ? readRequiredString(payload.category, "category").slice(0, 48)
    : readOptionalString(payload.category).slice(0, 48);

  if (
    requireCategory &&
    (category === "全部" ||
      category === "精选" ||
      category.toLowerCase() === "all" ||
      category.toLowerCase() === "featured")
  ) {
    throw new InvalidRequestError("category must be a content category.");
  }
  const tagValues = Array.isArray(payload.tags)
    ? payload.tags
    : typeof payload.tags === "string"
      ? parseArticleTagString(payload.tags)
      : [];
  const tags = tagValues
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, 24);
  const enabled = payload.enabled !== false;

  return {
    title,
    url,
    siteUrl,
    description,
    category,
    tags,
    enabled
  };
}

const FEED_REQUEST_TIMEOUT_MS = 15_000;
const FEED_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const FEED_MAX_REDIRECTS = 5;

export async function fetchFeedPreview(feedUrl: string): Promise<ParsedFeed> {
  const url = normalizeSafeFetchUrl(feedUrl);

  if (!url) {
    throw new InvalidRequestError("Feed URL is not allowed.");
  }

  const response = await fetchFeedText(url);
  const parsed = parseFeedXml(response.text, response.finalUrl);

  if (!parsed.items.length) {
    throw new UpstreamServiceError("No feed items found.");
  }

  return parsed;
}

async function ensureArticleColumns(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(articles)").all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));
  const statements = ARTICLE_COLUMN_STATEMENTS
    .filter((column) => !existing.has(column.name))
    .map((column) => db.prepare(column.statement));

  if (statements.length) {
    await db.batch(statements);
  }

  await backfillArticleContentItemLinks(db);
}

async function backfillArticleContentItemLinks(db: D1Database) {
  await db.prepare(
    `UPDATE articles SET content_item_id = NULL
     WHERE content_item_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM content_items WHERE id = articles.content_item_id)`
  ).run();

  await db.prepare(
    `UPDATE articles
     SET content_item_id = (
       SELECT ci.id FROM content_items AS ci
       WHERE ci.article_id = articles.id
       ORDER BY ci.id
       LIMIT 1
     )
     WHERE content_item_id IS NULL
       AND EXISTS (
         SELECT 1 FROM content_items AS ci WHERE ci.article_id = articles.id
       )`
  ).run();

  await db.prepare(
    `UPDATE content_items
     SET article_id = NULL
     WHERE article_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM articles AS a
         WHERE a.id = content_items.article_id
           AND a.content_item_id = content_items.id
       )`
  ).run();
}

async function removeLegacySourceUpdateColumns(db: D1Database) {
  const [articleColumns, contentItemColumns] = await Promise.all([
    db.prepare("PRAGMA table_info(articles)").all<{ name: string }>(),
    db.prepare("PRAGMA table_info(content_items)").all<{ name: string }>()
  ]);
  const statements: D1PreparedStatement[] = [];

  if (articleColumns.results.some((column) => column.name === "source_content_version")) {
    statements.push(
      db.prepare("ALTER TABLE articles DROP COLUMN source_content_version")
    );
  }
  if (contentItemColumns.results.some((column) => column.name === "content_version")) {
    statements.push(
      db.prepare("ALTER TABLE content_items DROP COLUMN content_version")
    );
  }

  if (statements.length) {
    await db.batch(statements);
  }
}

export async function ensureTelegramMessageSchema(db: D1Database) {
  if (initializedTelegramMessageDatabases.has(db)) return;

  const existingPromise = telegramMessageInitializationPromises.get(db);
  if (existingPromise) return existingPromise;

  const initializationPromise = initializeTelegramMessageSchema(db);
  telegramMessageInitializationPromises.set(db, initializationPromise);

  try {
    await initializationPromise;
    initializedTelegramMessageDatabases.add(db);
  } finally {
    telegramMessageInitializationPromises.delete(db);
  }
}

async function initializeTelegramMessageSchema(db: D1Database) {
  await db.batch([
    db.prepare(TELEGRAM_MESSAGE_TABLE_STATEMENT),
    db.prepare(TELEGRAM_MESSAGE_INDEX_STATEMENT)
  ]);
  await upgradeTelegramMessageTable(db);
  await ensureTelegramMessageColumns(db);

  const legacyTable = await db.prepare(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name = 'telegram_tool_messages'`
  ).first<{ name: string }>();
  if (!legacyTable) {
    await backfillTelegramMessageResources(db);
    return;
  }

  const legacyColumns = await db
    .prepare("PRAGMA table_info(telegram_tool_messages)")
    .all<{ name: string }>();
  const columns = new Set(legacyColumns.results.map((column) => column.name));
  if (!columns.has("tool_id")) {
    throw new Error("Legacy Telegram message records cannot be migrated.");
  }

  const targetRef = columns.has("target_ref") ? "target_ref" : "''";
  const resourceData = columns.has("resource_data") ? "resource_data" : "''";
  const category = columns.has("category") ? "category" : "''";
  const mediaEnabled = columns.has("media_enabled")
    ? "media_enabled"
    : columns.has("link_preview_enabled")
      ? "link_preview_enabled"
      : "0";
  const mediaUrl = columns.has("media_url") ? "media_url" : "''";
  const pushedHash = columns.has("last_pushed_hash") ? "last_pushed_hash" : "''";

  await db.prepare(
    `INSERT OR IGNORE INTO telegram_messages (
       id, resource_type, resource_id, chat_id, target_ref, message_id,
       message_markdown, media_enabled, media_url, last_pushed_hash,
       resource_data, category,
       sent_at, updated_at
     )
     SELECT id, 'tool', tool_id, chat_id, ${targetRef}, message_id,
            message_markdown, ${mediaEnabled}, ${mediaUrl}, ${pushedHash},
            ${resourceData}, ${category},
            sent_at, updated_at
     FROM telegram_tool_messages`
  ).run();

  const missing = await db.prepare(
    `SELECT COUNT(*) AS total
     FROM telegram_tool_messages AS legacy
     LEFT JOIN telegram_messages AS current ON current.id = legacy.id
     WHERE current.id IS NULL`
  ).first<{ total: number }>();
  if (Number(missing?.total ?? 0) > 0) {
    throw new Error("Legacy Telegram message records were not fully migrated.");
  }

  await db.prepare("DROP TABLE telegram_tool_messages").run();
  await backfillTelegramMessageResources(db);
}

export async function getRssHubSettings(db: D1Database): Promise<RssHubSettings> {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(RSSHUB_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) return { enabled: true, baseUrl: DEFAULT_RSSHUB_BASE_URL };

  try {
    const parsed = JSON.parse(row.value) as Partial<RssHubSettings>;
    return {
      enabled: parsed.enabled !== false,
      baseUrl: typeof parsed.baseUrl === "string"
        ? normalizeRssHubBaseUrl(parsed.baseUrl) || DEFAULT_RSSHUB_BASE_URL
        : DEFAULT_RSSHUB_BASE_URL
    };
  } catch {
    return { enabled: true, baseUrl: DEFAULT_RSSHUB_BASE_URL };
  }
}

export async function saveRssHubSettings(
  db: D1Database,
  payload: { enabled?: unknown; baseUrl?: unknown }
) {
  const requestedBaseUrl = typeof payload.baseUrl === "string" ? payload.baseUrl : "";
  const normalizedBaseUrl = normalizeRssHubBaseUrl(requestedBaseUrl);

  if (
    requestedBaseUrl.trim() &&
    (!normalizedBaseUrl || !normalizeSafeFetchUrl(normalizedBaseUrl))
  ) {
    throw new InvalidRequestError("RSSHub base URL must be a public http/https URL.");
  }

  const settings = {
    enabled: payload.enabled !== false,
    baseUrl: normalizedBaseUrl || DEFAULT_RSSHUB_BASE_URL
  } satisfies RssHubSettings;
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(RSSHUB_SETTINGS_KEY, JSON.stringify(settings))
    .run();
  return settings;
}

export async function resolveContentSourceFetchUrl(db: D1Database, sourceUrl: string) {
  const routeUrl = normalizeRssHubRouteUrl(sourceUrl);
  if (!routeUrl) return sourceUrl;

  const settings = await getRssHubSettings(db);
  if (!settings.enabled) {
    throw new InvalidRequestError("RSSHub service is disabled.");
  }

  const resolved = resolveRssHubRouteUrl(routeUrl, settings.baseUrl);
  if (!resolved) throw new InvalidRequestError("RSSHub route URL is invalid.");
  return resolved;
}

async function upgradeTelegramMessageTable(db: D1Database) {
  const table = await db.prepare(
    `SELECT sql FROM sqlite_master
     WHERE type = 'table' AND name = 'telegram_messages'`
  ).first<{ sql: string | null }>();
  if (!table?.sql || table.sql.includes("'content'")) return;

  const existingColumns = await db
    .prepare("PRAGMA table_info(telegram_messages)")
    .all<{ name: string }>();
  const columns = new Set(existingColumns.results.map((column) => column.name));
  const customTitle = columns.has("custom_title") ? "custom_title" : "''";
  const resourceData = columns.has("resource_data") ? "resource_data" : "''";
  const category = columns.has("category") ? "category" : "''";
  const pushedMediaEnabled = columns.has("last_pushed_media_enabled")
    ? "last_pushed_media_enabled"
    : "NULL";

  await db.batch([
    db.prepare(`DROP TABLE IF EXISTS ${TELEGRAM_MESSAGE_MIGRATION_TABLE}`),
    db.prepare(createTelegramMessageTableStatement(TELEGRAM_MESSAGE_MIGRATION_TABLE)),
    db.prepare(
      `INSERT INTO ${TELEGRAM_MESSAGE_MIGRATION_TABLE} (${TELEGRAM_MESSAGE_COLUMNS})
       SELECT id, resource_type, resource_id, ${customTitle},
              ${resourceData}, ${category},
              chat_id, target_ref, message_id, message_markdown, media_enabled,
               media_url, last_pushed_hash, sent_at, updated_at, ${pushedMediaEnabled}
       FROM telegram_messages`
    ),
    db.prepare("DROP TABLE telegram_messages"),
    db.prepare(
      `ALTER TABLE ${TELEGRAM_MESSAGE_MIGRATION_TABLE} RENAME TO telegram_messages`
    ),
    db.prepare(TELEGRAM_MESSAGE_INDEX_STATEMENT)
  ]);
}

async function ensureTelegramMessageColumns(db: D1Database) {
  const table = await db.prepare(
    `SELECT sql FROM sqlite_master
     WHERE type = 'table' AND name = 'telegram_messages'`
  ).first<{ sql: string | null }>();
  if (!table?.sql || (table.sql.includes("resource_data") && table.sql.includes("category") && table.sql.includes("last_pushed_media_enabled"))) {
    return;
  }
  const existing = await db.prepare("PRAGMA table_info(telegram_messages)").all<{ name: string }>();
  const names = new Set(existing.results.map((column) => column.name));
  const statements: D1PreparedStatement[] = [];
  if (!names.has("resource_data")) {
    statements.push(db.prepare("ALTER TABLE telegram_messages ADD COLUMN resource_data TEXT NOT NULL DEFAULT ''"));
  }
  if (!names.has("category")) {
    statements.push(db.prepare("ALTER TABLE telegram_messages ADD COLUMN category TEXT NOT NULL DEFAULT ''"));
  }
  if (!names.has("last_pushed_media_enabled")) {
    statements.push(db.prepare("ALTER TABLE telegram_messages ADD COLUMN last_pushed_media_enabled INTEGER"));
  }
  if (statements.length) await db.batch(statements);
  await backfillTelegramMessageResources(db);
}

async function backfillTelegramMessageResources(db: D1Database) {
  await Promise.all([
    db.prepare(
      `UPDATE telegram_messages
       SET resource_data = COALESCE((
             SELECT json_object(
               'type', 'tool', 'id', tools.id, 'title', tools.name,
               'description', tools.description, 'url', tools.url,
               'demoUrl', tools.demo_url, 'image', tools.image,
               'category', '', 'tags',
               CASE WHEN json_valid(tools.tags) THEN json(tools.tags) ELSE json('[]') END
             )
             FROM tools WHERE tools.id = telegram_messages.resource_id
           ), resource_data)
       WHERE resource_type = 'tool' AND resource_data = ''`
    ).run(),
    db.prepare(
      `UPDATE telegram_messages
       SET resource_data = COALESCE((
             SELECT json_object(
               'type', 'article', 'id', articles.id, 'title', articles.title,
               'description', articles.summary,
               'url', CASE WHEN articles.published = 1 THEN '/articles/' || articles.slug ELSE '' END,
               'demoUrl', '', 'image', articles.cover_image,
               'category', '', 'tags',
               CASE WHEN json_valid(articles.tags) THEN json(articles.tags) ELSE json('[]') END
             )
             FROM articles WHERE articles.id = telegram_messages.resource_id
           ), resource_data)
       WHERE resource_type = 'article' AND resource_data = ''`
    ).run(),
    db.prepare(
      `UPDATE telegram_messages
       SET resource_data = COALESCE((
             SELECT json_object(
               'type', 'content', 'id', content_items.id,
               'title', content_items.title,
               'description', content_items.summary,
               'url', '',
               'demoUrl', content_items.url,
               'image', content_items.cover_image,
               'category', '', 'tags',
               CASE WHEN json_valid(content_items.tags) THEN json(content_items.tags) ELSE json('[]') END
             )
             FROM content_items WHERE content_items.id = telegram_messages.resource_id
           ), resource_data)
       WHERE resource_type = 'content' AND resource_data = ''`
    ).run()
  ]);
}

async function fetchFeedText(initialUrl: string) {
  let currentUrl = initialUrl;
  const deadline = Date.now() + FEED_REQUEST_TIMEOUT_MS;

  for (let redirectCount = 0; redirectCount <= FEED_MAX_REDIRECTS; redirectCount += 1) {
    const remainingTime = deadline - Date.now();
    if (remainingTime <= 0) {
      throw new UpstreamServiceError("Feed request timed out.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingTime);

    try {
      const response = await fetch(currentUrl, {
        headers: {
          Accept:
            "application/atom+xml, application/rss+xml, application/xml, text/xml, text/plain;q=0.9, */*;q=0.5"
        },
        redirect: "manual",
        signal: controller.signal
      });

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new UpstreamServiceError(`Feed request failed with status ${response.status}.`);
        }
        if (redirectCount >= FEED_MAX_REDIRECTS) {
          throw new UpstreamServiceError("Feed redirected too many times.");
        }

        let redirectedUrl = "";
        try {
          redirectedUrl = new URL(location, currentUrl).toString();
        } catch {
          throw new UpstreamServiceError("Feed redirect URL is not allowed.");
        }
        const nextUrl = normalizeSafeFetchUrl(redirectedUrl);
        if (!nextUrl) {
          throw new UpstreamServiceError("Feed redirect URL is not allowed.");
        }
        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        throw new UpstreamServiceError(`Feed request failed with status ${response.status}.`);
      }
      if (!isSupportedFeedContentType(response.headers.get("content-type"))) {
        throw new UpstreamServiceError("Feed response type is not supported.");
      }

      const contentLength = readPositiveContentLength(response.headers);
      if (contentLength !== null && contentLength > FEED_MAX_RESPONSE_BYTES) {
        throw new UpstreamServiceError("Feed response is too large.");
      }

      return {
        text: await readLimitedResponseText(response, FEED_MAX_RESPONSE_BYTES),
        finalUrl: currentUrl
      };
    } catch (error) {
      if (controller.signal.aborted) {
        throw new UpstreamServiceError("Feed request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new UpstreamServiceError("Feed redirected too many times.");
}

export function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function isSupportedFeedContentType(value: string | null) {
  if (!value) return true;
  const type = value.split(";", 1)[0].trim().toLowerCase();
  return (
    type.startsWith("text/") ||
    type.includes("xml") ||
    type.includes("rss") ||
    type.includes("atom") ||
    type === "application/octet-stream"
  );
}

function readPositiveContentLength(headers: Headers) {
  const value = Number(headers.get("content-length"));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

async function readLimitedResponseText(response: Response, maximumBytes: number) {
  if (!response.body) {
    throw new UpstreamServiceError("Feed response body is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new UpstreamServiceError("Feed response is too large.");
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  if (!text.trim()) {
    throw new UpstreamServiceError("Feed response body is empty.");
  }
  return text;
}

// 订阅源抓取与链接检测共用：只放行可公开访问的 http/https 地址，拒绝内网、本机与保留地址。
export function normalizeSafeFetchUrl(value: string) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    if (url.username || url.password || isBlockedFeedHostname(url.hostname)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function isBlockedFeedHostname(value: string) {
  const hostname = value.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    return true;
  }
  return hostname.includes(":")
    ? isBlockedFeedIpv6(hostname)
    : isBlockedFeedIpv4(hostname);
}

function isBlockedFeedIpv4(hostname: string) {
  const bytes = readFeedIpv4Bytes(hostname);
  if (!bytes) return false;
  return isBlockedFeedIpv4Bytes(bytes);
}

function readFeedIpv4Bytes(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => (/^\d+$/.test(part) ? Number(part) : Number.NaN));
  if (bytes.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return bytes as [number, number, number, number];
}

function isBlockedFeedIpv4Bytes(bytes: [number, number, number, number]) {
  const [a, b, c] = bytes as [number, number, number, number];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedFeedIpv6(hostname: string) {
  const words = parseFeedIpv6Words(hostname);
  if (!words) return true;

  const [first, second, third] = words;
  const isUnspecified = words.every((word) => word === 0);
  const isLoopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  if (isUnspecified || isLoopback) return true;

  // Only globally routable unicast literals are useful as public feed hosts.
  if ((first & 0xe000) !== 0x2000) return true;
  if (first === 0x2001 && second === 0x0000) return true; // Teredo
  if (first === 0x2001 && second === 0x0002) return true; // Benchmarking
  if (first === 0x2001 && (second & 0xfff0) === 0x0010) return true; // ORCHIDv1
  if (first === 0x2001 && (second & 0xfff0) === 0x0020) return true; // ORCHIDv2
  if (first === 0x2001 && second === 0x0db8) return true; // Documentation
  if ((first & 0xfff0) === 0x3fff) return true; // Documentation

  if (first === 0x2002) {
    return isBlockedFeedIpv4Bytes([
      second >> 8,
      second & 0xff,
      third >> 8,
      third & 0xff
    ]);
  }

  return false;
}

function parseFeedIpv6Words(hostname: string) {
  const sections = hostname.split("::");
  if (sections.length > 2) return null;

  const readSection = (section: string) => {
    if (!section) return [] as number[];
    const parts = section.split(":");
    const words: number[] = [];
    for (const part of parts) {
      if (part.includes(".")) {
        const bytes = readFeedIpv4Bytes(part);
        if (!bytes) return null;
        words.push((bytes[0] << 8) | bytes[1], (bytes[2] << 8) | bytes[3]);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(part)) return null;
      words.push(Number.parseInt(part, 16));
    }
    return words;
  };

  const leading = readSection(sections[0]);
  const trailing = readSection(sections[1] ?? "");
  if (!leading || !trailing) return null;
  if (sections.length === 1) {
    return leading.length === 8 ? leading : null;
  }

  const missing = 8 - leading.length - trailing.length;
  if (missing < 1) return null;
  return [...leading, ...Array<number>(missing).fill(0), ...trailing];
}

export const CONTENT_SOURCE_SYNC_EPOCH_KEY = "content_source_sync_epoch";
const D1_MAX_BOUND_PARAMETERS = 100;

export async function syncContentSource(db: D1Database, sourceId: string) {
  const source = await db.prepare(
    `SELECT content_sources.*,
       COALESCE((SELECT value FROM app_settings WHERE key = ?), '') AS sync_epoch
     FROM content_sources WHERE id = ?`
  )
    .bind(CONTENT_SOURCE_SYNC_EPOCH_KEY, sourceId)
    .first<ContentSourceRow & { sync_epoch: string }>();

  if (!source) {
    throw new InvalidRequestError("Content source not found.");
  }

  if (!source.category.trim()) {
    throw new InvalidRequestError("Content source category is required.");
  }

  const feed = await fetchFeedPreview(
    await resolveContentSourceFetchUrl(db, source.url)
  );
  const now = new Date().toISOString();
  let imported = 0;
  let updated = 0;
  const sourceTags = safelyParseTags(source.tags);
  const syncItems = Array.from(
    new Map(
      feed.items.slice(0, 50).map((item) => [item.externalId, item])
    ).values()
  );
  const externalIds = Array.from(new Set(syncItems.map((item) => item.externalId)));
  const existingRows = externalIds.length
    ? await db.prepare(
        `SELECT content_items.id, content_items.external_id
         FROM content_items
         WHERE source_id = ?
           AND external_id IN (${externalIds.map(() => "?").join(", ")})`
      )
        .bind(source.id, ...externalIds)
        .all<{
          id: string;
          external_id: string;
        }>()
    : { results: [] };
  const existingByExternalId = new Map(
    existingRows.results.map((row) => [row.external_id, row])
  );
  const sourceCondition = `id = ? AND updated_at = ? AND url = ?
    AND category = ? AND tags = ? AND enabled = ? AND site_url = ? AND description = ?
    AND COALESCE((SELECT value FROM app_settings WHERE key = ?), '') = ?`;
  const sourceConditionValues = [
    source.id, source.updated_at, source.url, source.category, source.tags,
    source.enabled, source.site_url, source.description,
    CONTENT_SOURCE_SYNC_EPOCH_KEY, source.sync_epoch
  ];
  const statements: D1PreparedStatement[] = [];
  const upsertRows: Array<Array<string | number | null>> = [];

  for (const item of syncItems) {
    const existingRow = existingByExternalId.get(item.externalId);
    const existingId = existingRow?.id;
    const tags = normalizeContentTags([...sourceTags, ...item.tags]);
    const id = existingId ?? createContentItemId();

    upsertRows.push([
      id,
      source.id,
      item.externalId,
      item.title,
      item.summary,
      item.content,
      item.url,
      item.author,
      item.coverImage,
      source.category,
      JSON.stringify(tags),
      item.publishedAt,
      now,
      now,
      now
    ]);

    if (existingId) {
      updated += 1;
    } else {
      imported += 1;
      existingByExternalId.set(item.externalId, {
        id,
        external_id: item.externalId
      });
    }
  }

  // D1 单条 SQL 最多绑定 100 个参数；批次大小按每行实际参数数和源守卫参数数推导，增删字段时自动缩放。
  const upsertColumnCount = upsertRows[0]?.length ?? 1;
  const upsertBatchSize = Math.max(
    1,
    Math.floor((D1_MAX_BOUND_PARAMETERS - sourceConditionValues.length) / upsertColumnCount)
  );
  const upsertPlaceholders = `(${Array(upsertColumnCount).fill("?").join(", ")})`;
  for (let index = 0; index < upsertRows.length; index += upsertBatchSize) {
    const rows = upsertRows.slice(index, index + upsertBatchSize);
    const placeholders = rows.map(() => upsertPlaceholders).join(", ");
    statements.push(
      db.prepare(
        `WITH incoming
          (id, source_id, external_id, title, summary, content, url, author,
           cover_image, category, tags, published_at, synced_at,
           created_at, updated_at) AS (VALUES ${placeholders})
         INSERT INTO content_items
          (id, source_id, external_id, title, summary, content, url, author,
           cover_image, category, tags, published_at, synced_at,
           created_at, updated_at)
         SELECT * FROM incoming
         WHERE EXISTS (SELECT 1 FROM content_sources WHERE ${sourceCondition})
         ON CONFLICT(source_id, external_id) DO UPDATE SET
           title = excluded.title,
           summary = excluded.summary,
           content = excluded.content,
           url = excluded.url,
           author = excluded.author,
           cover_image = excluded.cover_image,
           category = excluded.category,
           tags = excluded.tags,
           published_at = excluded.published_at,
           synced_at = excluded.synced_at,
           updated_at = excluded.updated_at`
      ).bind(...rows.flat(), ...sourceConditionValues)
    );
  }

  // 同一事务内先按源快照写内容，再更新时间；删除、改配置或恢复后，整批旧结果均不写入。
  statements.push(db.prepare(
    `UPDATE content_sources
     SET site_url = ?, description = ?, updated_at = ?, last_synced_at = ?
     WHERE ${sourceCondition}`
  ).bind(
    source.site_url || feed.siteUrl,
    source.description || feed.description,
    now,
    now,
    ...sourceConditionValues
  ));
  const results = await db.batch(statements);
  if (!results.at(-1)?.meta.changes) {
    throw new ConflictError("Content source changed during synchronization. Please retry.");
  }

  const syncResultLimit = 50;
  const rows = await db.prepare(
    `SELECT ${CONTENT_ITEM_SUMMARY_COLUMNS}
     FROM content_items
     JOIN content_sources ON content_sources.id = content_items.source_id
     LEFT JOIN articles ON articles.id = content_items.article_id
     WHERE source_id = ?
     ORDER BY COALESCE(content_items.published_at, content_items.updated_at, content_items.created_at) DESC,
              content_items.id DESC
     LIMIT ?`
  )
    .bind(source.id, syncResultLimit + 1)
    .all<ContentItemSummaryRow>();
  const hasMore = rows.results.length > syncResultLimit;
  const items = rows.results.slice(0, syncResultLimit);

  return {
    imported,
    updated,
    total: feed.items.length,
    items: items.map(contentItemSummaryFromRow),
    limit: syncResultLimit,
    offset: 0,
    hasMore,
    nextOffset: hasMore ? syncResultLimit : null
  };
}

function readOptionalDateString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const timestamp = Date.parse(trimmed);

  if (!Number.isFinite(timestamp)) {
    throw new InvalidRequestError(`${fieldName} must be a valid date.`);
  }

  return new Date(timestamp).toISOString();
}

function parseArticleTagString(value: string) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const tagKeyIndex = lines.findIndex((line) => /^\s*tags\s*:/i.test(line));
  const tags: string[] = [];

  function cleanTag(tag: string) {
    return tag
      .trim()
      .replace(/^[-*]\s*/, "")
      .replace(/^["']|["']$/g, "")
      .replace(/^#+/, "")
      .trim();
  }

  function pushSegment(segment: string) {
    const normalized = segment
      .trim()
      .replace(/^tags\s*:\s*/i, "")
      .replace(/^\[(.*)\]$/, "$1");

    for (const segment of normalized.split(/[\r\n,，、。;；|｜/／\\]+/)) {
      let cursor = 0;
      let foundHashtag = false;
      for (const match of segment.matchAll(/#[^\s#,，、。;；|｜/／\\]+/g)) {
        foundHashtag = true;
        const index = match.index ?? 0;
        const plain = cleanTag(segment.slice(cursor, index));
        if (plain) tags.push(plain);
        tags.push(cleanTag(match[0]));
        cursor = index + match[0].length;
      }
      const remainder = cleanTag(segment.slice(cursor));
      if (remainder) tags.push(remainder);
      if (!foundHashtag && !remainder) {
        const fallback = cleanTag(segment);
        if (fallback) tags.push(fallback);
      }
    }
  }

  if (tagKeyIndex >= 0) {
    pushSegment(lines[tagKeyIndex].replace(/^\s*tags\s*:\s*/i, ""));

    for (let index = tagKeyIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      if (/^\s*[A-Za-z0-9_-]+\s*:/.test(line) && !trimmed.startsWith("-")) {
        break;
      }

      if (trimmed.startsWith("-")) {
        tags.push(cleanTag(trimmed));
      }
    }
  } else {
    lines.forEach(pushSegment);
  }

  return Array.from(new Set(tags.map(cleanTag).filter(Boolean)));
}

function parseFeedXml(xml: string, feedUrl: string): ParsedFeed {
  const isAtom = /<feed[\s>]/i.test(xml);
  const blocks = isAtom
    ? matchXmlBlocks(xml, "entry")
    : matchXmlBlocks(xml, "item");
  const feedTitle = cleanDisplayText(readXmlTag(xml, ["title"]));
  const siteUrl =
    resolveUrl(readAtomLink(xml) || readXmlTag(xml, ["link"]), feedUrl) ||
    new URL(feedUrl).origin;
  const description = cleanDisplayText(
    readXmlTag(xml, ["subtitle", "description"])
  );

  return {
    title: feedTitle || new URL(feedUrl).hostname,
    description,
    siteUrl,
    feedUrl,
    items: blocks.map((block) => parseFeedItem(block, feedUrl, isAtom))
  };
}

function parseFeedItem(block: string, feedUrl: string, isAtom: boolean): ParsedFeedItem {
  const rawTitle = cleanDisplayText(readXmlTag(block, ["title"]));
  const link = resolveUrl(
    isAtom ? readAtomLink(block) : readXmlTag(block, ["link"]),
    feedUrl
  );
  const id = cleanDisplayText(readXmlTag(block, ["id", "guid"])) || link || rawTitle;
  const rawContent =
    readXmlTag(block, ["content:encoded", "content"]) ||
    readXmlTag(block, ["description", "summary"]);
  const rawSummary = readXmlTag(block, ["summary", "description"]) || rawContent;
  const publishedAt = normalizeFeedDate(
    readXmlTag(block, ["published", "pubDate", "dc:date", "updated"])
  );
  const content = htmlToMarkdown(rawContent, link || feedUrl);
  const title = normalizeFeedItemTitle(rawTitle, content, rawSummary);
  const summary = normalizeFeedItemSummary(rawSummary, content, title);
  const tags = normalizeFeedItemTags(
    readFeedCategories(block),
    rawTitle,
    rawSummary,
    content
  );
  const author = cleanDisplayText(
    readXmlTag(block, ["author", "dc:creator", "name"])
  );
  const coverImage = resolveUrl(readFeedCoverImage(block), link || feedUrl);

  return {
    externalId: id,
    title,
    summary,
    content,
    url: link || feedUrl,
    author,
    coverImage,
    tags,
    publishedAt
  };
}

function matchXmlBlocks(xml: string, tag: string) {
  const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
  return Array.from(xml.matchAll(pattern), (match) => match[0]);
}

function readXmlTag(xml: string, tags: string[]) {
  for (const tag of tags) {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`,
      "i"
    );
    const match = xml.match(pattern);

    if (match?.[1]) {
      return cleanXmlValue(match[1]);
    }
  }

  return "";
}

function readAtomLink(xml: string) {
  const links = Array.from(xml.matchAll(/<link\b([^>]*)\/?>/gi));
  const preferred =
    links.find((match) => {
      const rel = readXmlAttribute(match[1], "rel");
      return !rel || rel === "alternate";
    }) ?? links[0];

  return preferred ? readXmlAttribute(preferred[1], "href") : "";
}

function readXmlAttribute(source: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return cleanXmlValue(source.match(pattern)?.[1] ?? "");
}

function readFeedCategories(block: string) {
  const categories = new Set<string>();

  for (const match of block.matchAll(/<category\b([^>]*)\/?>/gi)) {
    const term = cleanContentTag(readXmlAttribute(match[1], "term"));

    if (term) {
      categories.add(term);
    }
  }

  for (const categoryBlock of matchXmlBlocks(block, "category")) {
    const value = cleanContentTag(
      cleanDisplayText(
        categoryBlock.replace(/^<category\b[^>]*>/i, "").replace(/<\/category>$/i, "")
      )
    );

    if (value) {
      categories.add(value);
    }
  }

  return Array.from(categories).filter(Boolean).slice(0, 24);
}

function readFeedCoverImage(block: string) {
  const mediaThumbnail = block.match(/<media:thumbnail\b([^>]*)\/?>/i);
  const mediaContent = block.match(/<media:content\b([^>]*)\/?>/i);
  const enclosure = block.match(/<enclosure\b([^>]*)\/?>/i);

  return (
    readXmlAttribute(mediaThumbnail?.[1] ?? "", "url") ||
    readFeedMediaImageUrl(mediaContent?.[1] ?? "") ||
    readFeedEnclosureImageUrl(enclosure?.[1] ?? "")
  );
}

function readFeedMediaImageUrl(attrs: string) {
  const medium = readXmlAttribute(attrs, "medium").toLowerCase();
  const type = readXmlAttribute(attrs, "type").toLowerCase();

  if (medium && medium !== "image") {
    return "";
  }

  if (type && !isFeedImageType(type)) {
    return "";
  }

  return readXmlAttribute(attrs, "url");
}

function readFeedEnclosureImageUrl(attrs: string) {
  const type = readXmlAttribute(attrs, "type").toLowerCase();

  return isFeedImageType(type) ? readXmlAttribute(attrs, "url") : "";
}

function isFeedImageType(type: string) {
  const normalized = type.split(";")[0].trim().toLowerCase();

  return normalized === "image" || normalized.startsWith("image/");
}

function cleanXmlValue(value: string) {
  return decodeXmlEntities(
    value
      .replace(/^\s*<!\[CDATA\[/, "")
      .replace(/\]\]>\s*$/, "")
      .trim()
  );
}

function cleanDisplayText(value: string) {
  return decodeXmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a\b[^>]*(?:class=["'][^"']*\bheaderlink\b[^"']*["']|href=["']#[^"']*["'])[^>]*>\s*<\/a>/gi, "")
    .replace(/<a\b[^>\n]*(?:class=["'][^"'\n]*\bheaderlink\b[^"'\n]*["']?|href=["']#[^"'\n]*["']?)[^>\n]*$/gi, "")
    .replace(/\[\]\(#[^)]+\)/g, "")
    .replace(/!\[([^\]]*)\]\((?:[^)(]|\([^)]*\))*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:[^)(]|\([^)]*\))*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/(?:^|\s)[×✕✖](?=\s|$)/g, " ")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeFeedItemTitle(
  title: string,
  content: string,
  summary = ""
) {
  const cleanedTitle = truncateFeedTitle(cleanDisplayText(title));
  const contentText = markdownToDisplayText(content);
  const cleanedSummary = cleanDisplayText(summary);

  if (shouldDeriveFeedTitle(cleanedTitle, contentText, cleanedSummary)) {
    const derivedTitle =
      deriveFeedTitleFromMarkdown(content) || deriveFeedTitleFromText(contentText);

    if (derivedTitle) {
      return truncateFeedTitle(derivedTitle, 96);
    }
  }

  return cleanedTitle || "Untitled";
}

export function normalizeFeedItemSummary(
  summary: string,
  content: string,
  title: string
) {
  const contentText = markdownToDisplayText(content);
  const cleanedSummary = stripFeedHashTagText(
    stripLeadingRepeatedText(cleanDisplayText(summary), title)
  );
  const fallbackSummary = stripFeedHashTagText(
    stripLeadingRepeatedText(contentText, title)
  );

  return (cleanedSummary || fallbackSummary).slice(0, 260).trim();
}

export function normalizeFeedItemTags(
  tags: string[],
  ...sources: string[]
) {
  return normalizeContentTags([
    ...tags,
    ...sources.flatMap((source) => extractFeedHashTags(source))
  ]);
}

function shouldDeriveFeedTitle(
  title: string,
  contentText: string,
  summary: string
) {
  if (!title) {
    return true;
  }

  if (title.length <= 88) {
    return false;
  }

  const comparableTitle = normalizeComparableText(title);
  const titleHead = comparableTitle.slice(0, 42);

  if (!titleHead) {
    return false;
  }

  return (
    normalizeComparableText(contentText).startsWith(titleHead) ||
    normalizeComparableText(summary).startsWith(titleHead)
  );
}

function deriveFeedTitleFromMarkdown(content: string) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");

  for (const line of lines) {
    const text = cleanMarkdownDisplayLine(line);

    if (!text) {
      continue;
    }

    const heading = text.match(/^#{1,6}\s+(.+)$/);

    if (heading) {
      return cleanFeedTitleCandidate(heading[1]);
    }

    const strong = text.match(/^\*\*(.+?)\*\*$/) ?? text.match(/^\*\*(.+?)\*\*/);

    if (strong) {
      return cleanFeedTitleCandidate(strong[1]);
    }

    if (text.length >= 6 && !isMarkdownImageLine(text)) {
      return cleanFeedTitleCandidate(text);
    }
  }

  return "";
}

function deriveFeedTitleFromText(value: string) {
  return cleanFeedTitleCandidate(value);
}

function cleanFeedTitleCandidate(value: string) {
  const cleaned = cleanDisplayText(value)
    .replace(/^[-*]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
  const sentence = cleaned.match(/^.{6,}?[。！？!?](?=\s|$)/)?.[0] ?? "";
  const split = (sentence || cleaned).split(
    /\s+(?=(?:流量|时间|注册方式|节点位置|开业|网页注册|注册链接|优惠券|五折活动|#)\s*[：:]?)/
  )[0];

  return truncateFeedTitle(split || cleaned, 96);
}

function truncateFeedTitle(value: string, maxLength = 140) {
  const cleaned = cleanDisplayText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).replace(/[，,、:：；;\s]+$/g, "")}...`;
}

function stripLeadingRepeatedText(value: string, title: string) {
  const cleaned = cleanDisplayText(value);
  const cleanedTitle = cleanDisplayText(title);

  if (!cleaned || !cleanedTitle) {
    return cleaned;
  }

  if (cleaned === cleanedTitle) {
    return "";
  }

  if (cleaned.startsWith(cleanedTitle)) {
    return cleaned
      .slice(cleanedTitle.length)
      .replace(/^[\s，,。.:：；;|-]+/, "")
      .trim();
  }

  return cleaned;
}

function markdownToDisplayText(value: string) {
  return cleanDisplayText(
    value
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`{3,}[\s\S]*?`{3,}/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~]+/g, " ")
  );
}

function cleanMarkdownDisplayLine(value: string) {
  return value
    .trim()
    .replace(/^[> \t]+/, "")
    .replace(/^(?:×|✕|✖)$/u, "")
    .trim();
}

function isMarkdownImageLine(value: string) {
  return (
    /^!\[[^\]]*\]\([^)]+\)$/.test(value) ||
    /^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)$/.test(value)
  );
}

function normalizeComparableText(value: string) {
  return cleanDisplayText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function convertHtmlCodeBlocks(value: string) {
  return convertHtmlPreCodeBlocks(convertHtmlCodeFigures(value));
}

function convertHtmlLists(value: string) {
  let converted = value;

  for (let pass = 0; pass < 24; pass += 1) {
    let changed = false;
    converted = converted.replace(
      /<(ul|ol)\b[^>]*>((?:(?!<(?:ul|ol)\b)[\s\S])*?)<\/\1>/gi,
      (_, type: string, inner: string) => {
        changed = true;
        const items = Array.from(
          inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
          (match) => match[1]
        );

        const markdownList = items
          .map((item, index) => {
            const prefix = type.toLowerCase() === "ol" ? `${index + 1}. ` : "- ";
            const content = item
              .replace(/<\/?p\b[^>]*>/gi, "")
              .replace(/<br\s*\/?>/gi, "\n")
              .trim();
            const lines = content.split("\n");
            return `${prefix}${lines[0]}${
              lines.length > 1
                ? `\n${lines
                    .slice(1)
                    .map((line) => `${" ".repeat(prefix.length)}${line}`)
                    .join("\n")}`
                : ""
            }`;
          })
          .join("\n");

        return `\n${markdownList}\n`;
      }
    );

    if (!changed) break;
  }

  return converted;
}

function convertHtmlImages(value: string, baseUrl: string) {
  const withLinkedImages = value.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
    (_, href: string, imageTag: string) => {
      const imageMarkdown = createMarkdownImage(imageTag, baseUrl);

      if (!imageMarkdown) {
        return "";
      }

      const link = resolveMarkdownLink(href, baseUrl);

      if (!link || isSearchTagHref(link)) {
        return imageMarkdown;
      }

      return `\n\n[${imageMarkdown.trim()}](${link})\n\n`;
    }
  );

  return withLinkedImages.replace(/<img\b[^>]*>/gi, (imageTag) =>
    createMarkdownImage(imageTag, baseUrl)
  );
}

function createMarkdownImage(imageTag: string, baseUrl: string) {
  const attrs = imageTag.match(/^<img\b([^>]*)>/i)?.[1] ?? "";
  const rawSrc =
    readXmlAttribute(attrs, "src") ||
    readXmlAttribute(attrs, "data-src") ||
    readXmlAttribute(attrs, "data-original") ||
    readXmlAttribute(attrs, "data-lazy-src");
  const src = resolveMarkdownImage(rawSrc, baseUrl);

  if (!src) {
    return "";
  }

  const alt = cleanMarkdownImageAlt(
    readXmlAttribute(attrs, "alt") || readXmlAttribute(attrs, "title")
  );

  return `\n\n![${alt}](${src})\n\n`;
}

function cleanMarkdownImageAlt(value: string) {
  const cleaned = cleanDisplayText(value)
    .replace(/[[\]\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 80 ? "" : cleaned;
}

function convertHtmlTables(value: string, baseUrl: string) {
  return value.replace(
    /<table\b[^>]*>([\s\S]*?)<\/table>/gi,
    (_, tableHtml: string) => {
      const rows = Array.from(
        tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi),
        (rowMatch) =>
          Array.from(
            rowMatch[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi),
            (cellMatch) => cleanMarkdownTableCell(cellMatch[1], baseUrl)
          )
      ).filter((row) => row.some((cell) => cell.length > 0));

      if (!rows.length) {
        return "";
      }

      const columnCount = Math.max(...rows.map((row) => row.length));
      const normalizedRows = rows.map((row) =>
        Array.from({ length: columnCount }, (_, index) => row[index] ?? "")
      );
      const header = normalizedRows[0];
      const body = normalizedRows.slice(1);
      const separator = header.map(() => "---");
      const tableLines = [
        createMarkdownTableRow(header),
        createMarkdownTableRow(separator),
        ...body.map(createMarkdownTableRow)
      ];

      return `\n\n${tableLines.join("\n")}\n\n`;
    }
  );
}

function createMarkdownTableRow(cells: string[]) {
  return `| ${cells.join(" | ")} |`;
}

function cleanMarkdownTableCell(value: string, baseUrl: string) {
  return decodeXmlEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(
        /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
        (_, href: string, label: string) => {
          const text = cleanDisplayText(label);
          const link = resolveMarkdownLink(href, baseUrl);

          if (!text) {
            return "";
          }

          if (!link || isSearchTagHref(link)) {
            return text;
          }

          return `[${text}](${link})`;
        }
      )
      .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
      .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
      .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function convertHtmlCodeFigures(value: string) {
  return value.replace(
    /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi,
    (match, attrs: string, inner: string) => {
      const className = readXmlAttribute(attrs, "class");

      if (!/\bhighlight\b/i.test(className)) {
        return match;
      }

      const codeCell =
        inner.match(
          /<td\b[^>]*class=["'][^"']*\bcode\b[^"']*["'][^>]*>\s*<pre\b[^>]*>([\s\S]*?)<\/pre>\s*<\/td>/i
        )?.[1] ??
        inner.match(
          /<td\b[^>]*class=["'][^"']*\bcode\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i
        )?.[1] ??
        inner.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/i)?.[1] ??
        "";
      const code = htmlCodeToText(codeCell);

      if (!code.trim()) {
        return "";
      }

      return createMarkdownCodeBlock(code, getHighlightLanguage(className));
    }
  );
}

function convertHtmlPreCodeBlocks(value: string) {
  return value
    .replace(
      /<pre\b[^>]*>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
      (_, attrs: string, codeHtml: string) =>
        createMarkdownCodeBlock(
          htmlCodeToText(codeHtml),
          getHighlightLanguage(readXmlAttribute(attrs, "class"))
        )
    )
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, codeHtml: string) =>
      createMarkdownCodeBlock(htmlCodeToText(codeHtml), "")
    );
}

function htmlCodeToText(value: string) {
  return decodeXmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/span>\s*<span\b[^>]*class=["'][^"']*\bline\b[^"']*["'][^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+$/g, "");
}

function getHighlightLanguage(className: string) {
  const token = className
    .split(/\s+/)
    .map((item) => item.trim().replace(/^language-/, ""))
    .find(
      (item) =>
        item &&
        !["highlight", "code", "source", "plain", "text", "plaintext"].includes(
          item.toLowerCase()
        )
    );

  return token?.replace(/[^\w-]/g, "") ?? "";
}

function createMarkdownCodeBlock(code: string, language: string) {
  const cleanedCode = code.replace(/\n+$/g, "");
  const fence = cleanedCode.includes("```") ? "````" : "```";
  const normalizedLanguage = language ? language.toLowerCase() : "";

  return `\n\n${fence}${normalizedLanguage}\n${cleanedCode}\n${fence}\n\n`;
}

export function htmlToMarkdown(value: string, baseUrl: string) {
  const codeBlocks: string[] = [];
  const codeProtected = convertHtmlCodeBlocks(cleanXmlMarkupValue(value)).replace(
    /(`{3,})[^\n]*\n[\s\S]*?\n\1/g,
    (block) => {
      const index = codeBlocks.push(block) - 1;
      return `@@HTOOLS_HTML_CODE_BLOCK_${index}@@`;
    }
  );
  const converted = convertHtmlLists(
    convertHtmlImages(convertHtmlTables(codeProtected, baseUrl), baseUrl)
  );
  const cleaned = converted
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a\b[^>]*class=["'][^"']*\bheaderlink\b[^"']*["'][^>]*>\s*<\/a>/gi, "")
    .replace(/<a\b[^>]*href=["']#[^"']*["'][^>]*>\s*<\/a>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n")
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n")
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n")
    .replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n\n")
    .replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n\n")
    .replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n\n")
    .replace(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi, "\n\n*$1*\n\n")
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n\n")
    .replace(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_, href: string, label: string) => {
        const text = cleanDisplayText(label);
        const link = resolveMarkdownLink(href, baseUrl);

        if (!text) {
          return "";
        }

        if (!link || isSearchTagHref(link)) {
          return text;
        }

        return `[${text}](${link})`;
      }
    )
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "_$1_")
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "_$1_")
    .replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, "~~$1~~")
    .replace(/<s\b[^>]*>([\s\S]*?)<\/s>/gi, "~~$1~~")
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/@@HTOOLS_HTML_CODE_BLOCK_(\d+)@@/g, (_, index: string) =>
      codeBlocks[Number(index)] ?? ""
    )
    .trim();

  return truncateMarkdown(
    normalizeMarkdownSpacing(decodeXmlEntities(cleaned)).trim(),
    60000
  );
}

export function truncateMarkdown(value: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;

  const minimumBoundary = Math.floor(maxLength * 0.8);
  const candidate = normalized.slice(0, maxLength);
  const boundary = [
    candidate.lastIndexOf("\n\n"),
    candidate.lastIndexOf("\n"),
    candidate.lastIndexOf(" ")
  ].find((index) => index >= minimumBoundary);
  let truncated = candidate.slice(0, boundary ?? maxLength).trimEnd();
  let activeFence = "";
  for (const line of truncated.split("\n")) {
    const fenceLine = line.match(/^(`{3,})(.*)$/);
    if (!fenceLine) continue;

    if (!activeFence) {
      activeFence = fenceLine[1];
    } else if (
      fenceLine[2].trim() === "" &&
      fenceLine[1].length >= activeFence.length
    ) {
      activeFence = "";
    }
  }

  if (activeFence) {
    const suffix = `\n${activeFence}`;
    truncated = truncated.slice(0, Math.max(0, maxLength - suffix.length)).trimEnd();
    truncated += suffix;
  }

  return truncated;
}

export function buildContentItemArticleContent({
  body,
  contentItemId,
  originalUrl,
  maxLength = 60000
}: {
  body: string;
  contentItemId?: string;
  originalUrl: string;
  maxLength?: number;
}) {
  const normalizedBody = body.trim();
  const marker = contentItemId ? createContentItemMarker(contentItemId) : "";
  const normalizedUrl = normalizeOriginalArticleUrl(originalUrl);
  const hasOriginalUrl = Boolean(
    normalizedUrl &&
      (normalizedBody.includes(normalizedUrl) ||
        normalizedBody.includes(originalUrl.trim()))
  );
  const suffixParts = [
    marker && !normalizedBody.includes(marker) ? marker : "",
    normalizedUrl && !hasOriginalUrl
      ? `## \u539f\u6587\u94fe\u63a5\n\n[\u9605\u8bfb\u539f\u6587](${normalizedUrl})`
      : ""
  ].filter(Boolean);
  const suffix = suffixParts.join("\n\n");
  const separatorLength = normalizedBody && suffix ? 2 : 0;
  const bodyLimit = Math.max(0, maxLength - suffix.length - separatorLength);
  const safeBody = truncateMarkdown(normalizedBody, bodyLimit);

  return [safeBody, suffix].filter(Boolean).join("\n\n").slice(0, maxLength);
}

function normalizeOriginalArticleUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString().replace(/\(/g, "%28").replace(/\)/g, "%29");
  } catch {
    return "";
  }
}

function normalizeMarkdownSpacing(value: string) {
  const codeBlocks: string[] = [];
  const listIndents: string[] = [];
  const protectedValue = value.replace(
    /(`{3,})[^\n]*\n[\s\S]*?\n\1/g,
    (block) => {
      const index = codeBlocks.push(block) - 1;
      return `@@HTOOLS_CODE_BLOCK_${index}@@`;
    }
  ).replace(/^( {2,})(?=(?:[-*+] |\d+\. ))/gm, (indent) => {
    const index = listIndents.push(indent) - 1;
    return `@@HTOOLS_LIST_INDENT_${index}@@`;
  });

  return protectedValue
    .replace(
      /\[\s*\n+\s*(!\[[^\]]*\]\([^)]+\))\s*\n+\s*\]\(([^)\s]+)\)/g,
      "\n\n[$1]($2)\n\n"
    )
    .replace(/(?:^|\n)[ \t]*(?:×|✕|✖)[ \t]*(?=\n|$)/gu, "\n")
    .replace(/(?:^|\n)[ \t]*(?:#[\p{L}\p{N}_-]+[ \t]*){1,24}(?=\n|$)/gu, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/@@HTOOLS_CODE_BLOCK_(\d+)@@/g, (_, index: string) => {
      return codeBlocks[Number(index)] ?? "";
    })
    .replace(/@@HTOOLS_LIST_INDENT_(\d+)@@/g, (_, index: string) => {
      return listIndents[Number(index)] ?? "";
    });
}

function isSearchTagHref(value: string) {
  return /^(?:https?:\/\/[^/]+)?\/search\/result\b/i.test(value.trim());
}

function normalizeContentTags(tags: string[]) {
  return Array.from(new Set(tags.map(cleanContentTag).filter(Boolean))).slice(0, 24);
}

function extractFeedHashTags(value: string) {
  const normalized = decodeXmlEntities(value)
    .replace(/`{3,}[\s\S]*?`{3,}/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const tags = new Set<string>();

  for (const match of normalized.matchAll(
    /(^|[\s([{（【「『，。！？、；;:：])#([\p{L}\p{N}_-]{1,32})(?=$|[\s)\]}）】」』，。！？、；;:：])/gu
  )) {
    const tag = cleanContentTag(match[2]);

    if (tag) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

function stripFeedHashTagText(value: string) {
  return value
    .replace(/(?:^|\n)[ \t]*(?:#[\p{L}\p{N}_-]+[ \t]*){1,24}(?=\n|$)/gu, "\n")
    .replace(/\s+(?:#[\p{L}\p{N}_-]+\s*){2,}(?:频道\s*[|｜]\s*聊天)?\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanContentTag(value: string) {
  const cleaned = cleanDisplayText(value)
    .replace(/^#/, "")
    .replace(/\uFFFD/g, "")
    .trim();

  if (!cleaned || /^\?+$/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

function normalizeFeedDate(value: string) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function resolveUrl(value: string, baseUrl: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

export async function requireAdmin(request: Request, env: Env) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token || !(await verifyToken(token, env))) {
    return jsonError("Unauthorized.", "UNAUTHORIZED", { status: 401 });
  }

  return null;
}

function normalizeAdminAiModel(value: unknown) {
  const model = typeof value === "string" ? value.trim() : "";
  return ADMIN_AI_MODELS.find((option) => option === model) ?? DEFAULT_ADMIN_AI_MODEL;
}

export async function getAdminAiSettings(env: Env): Promise<AdminAiSettings> {
  const available = Boolean(env.AI);
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(AI_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return {
      available,
      enabled: false,
      model: DEFAULT_ADMIN_AI_MODEL
    };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<AdminAiSettings>;
    return {
      available,
      enabled: available && parsed.enabled === true,
      model: normalizeAdminAiModel(parsed.model)
    };
  } catch {
    return {
      available,
      enabled: false,
      model: DEFAULT_ADMIN_AI_MODEL
    };
  }
}

export async function saveAdminAiSettings(
  env: Env,
  payload: AdminAiSettingsInput
) {
  const enabled = payload.enabled === true;
  const requestedModel = typeof payload.model === "string"
    ? payload.model.trim()
    : DEFAULT_ADMIN_AI_MODEL;

  if (!ADMIN_AI_MODELS.includes(requestedModel as AdminAiModel)) {
    throw new InvalidRequestError("Workers AI model is not supported.");
  }

  if (enabled && !env.AI) {
    throw new InvalidRequestError("Workers AI binding is not configured.");
  }

  const db = await getDatabase(env);
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(AI_SETTINGS_KEY, JSON.stringify({ enabled, model: requestedModel }))
    .run();

  return getAdminAiSettings(env);
}

export async function getGitHubSettings(env: Env): Promise<GitHubSettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(GITHUB_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return {
      enabled: false,
      owner: "",
      repo: "",
      labels: ["tool-submission"]
    };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<GitHubSettings>;
    return {
      enabled: parsed.enabled === true,
      owner: typeof parsed.owner === "string" ? parsed.owner : "",
      repo: typeof parsed.repo === "string" ? parsed.repo : "",
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.filter((label): label is string => typeof label === "string")
        : ["tool-submission"]
    };
  } catch {
    return {
      enabled: false,
      owner: "",
      repo: "",
      labels: ["tool-submission"]
    };
  }
}

export async function getAdminCategorySettings(
  env: Env
): Promise<AdminCategorySettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(ADMIN_CATEGORY_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return { ...DEFAULT_ADMIN_CATEGORY_SETTINGS };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<
      Record<AdminCategoryScope, unknown>
    >;

    return normalizeAdminCategorySettings(parsed);
  } catch {
    return { ...DEFAULT_ADMIN_CATEGORY_SETTINGS };
  }
}

export async function saveAdminCategorySettings(
  env: Env,
  payload: Partial<Record<AdminCategoryScope, unknown>>
) {
  const db = await getDatabase(env);
  const current = await getAdminCategorySettings(env);
  const next: AdminCategorySettings = { ...current };

  for (const scope of ADMIN_CATEGORY_SCOPES) {
    if (Object.prototype.hasOwnProperty.call(payload, scope)) {
      next[scope] = normalizeAdminCategoryList(payload[scope]);
    }
  }

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(ADMIN_CATEGORY_SETTINGS_KEY, JSON.stringify(next))
    .run();

  return next;
}

function normalizeAdminCategorySettings(
  value: Partial<Record<AdminCategoryScope, unknown>>
): AdminCategorySettings {
  return {
    tools: normalizeAdminCategoryList(value.tools),
    articles: normalizeAdminCategoryList(value.articles),
    push: normalizeAdminCategoryList(value.push),
    content: normalizeAdminCategoryList(value.content)
  };
}

function normalizeAdminCategoryList(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  const categories = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 48))
    .filter((item) => item && !isReservedAdminCategory(item));

  return Array.from(new Set(categories)).slice(0, 120);
}

function isReservedAdminCategory(category: string) {
  const normalized = category.toLowerCase();

  return (
    category === "全部" ||
    category === "精选" ||
    normalized === "all" ||
    normalized === "featured" ||
    normalized === "__telegram_tool__" ||
    normalized === "__telegram_article__" ||
    normalized === "__telegram_content__"
  );
}

export async function saveGitHubSettings(
  env: Env,
  _current: GitHubSettings,
  payload: GitHubSettingsInput
) {
  const db = await getDatabase(env);
  const next: GitHubSettings = {
    enabled: payload.enabled === true,
    owner: readOptionalString(payload.owner),
    repo: readOptionalString(payload.repo),
    labels: Array.isArray(payload.labels)
      ? payload.labels
          .filter((label): label is string => typeof label === "string")
          .map((label) => label.trim())
          .filter(Boolean)
          .slice(0, 10)
      : []
  };

  if (next.enabled) {
    if (!next.owner || !next.repo) {
      throw new InvalidRequestError(
        "owner and repo are required when GitHub submissions are enabled."
      );
    }
  }

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(GITHUB_SETTINGS_KEY, JSON.stringify(next))
    .run();

  return next;
}

export function toGitHubSettingsResponse(settings: GitHubSettings) {
  return {
    enabled: settings.enabled,
    owner: settings.owner,
    repo: settings.repo,
    labels: settings.labels
  };
}

export async function createToken(env: Env) {
  const secret = await ensureSessionSecret(env);
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt, secret);
  return `${issuedAt}.${signature}`;
}

export async function verifyPassword(password: string, env: Env) {
  const settings = await getAdminPasswordSettings(env);

  if (settings) {
    return verifyAdminPasswordHash(password, settings);
  }

  const secret = getSecret(env);
  return timingSafeEqual(password, secret);
}

export async function getAdminSecuritySettings(env: Env) {
  const settings = await getAdminPasswordSettings(env);

  return {
    passwordConfigured: Boolean(settings),
    updatedAt: settings?.updatedAt ?? null
  };
}

export async function saveAdminPassword(env: Env, password: string) {
  const db = await getDatabase(env);
  const settings = await createAdminPasswordSettings(password);

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(ADMIN_PASSWORD_KEY, JSON.stringify(settings))
    .run();

  return settings;
}

export async function getProxySettings(env: Env): Promise<ProxySettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(PROXY_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return {
      enabled: false,
      baseUrl: "",
      mode: "prefix",
      scope: "all"
    };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<ProxySettings>;
    return {
      enabled: parsed.enabled === true,
      baseUrl:
        typeof parsed.baseUrl === "string"
          ? normalizeProxyBaseUrl(parsed.baseUrl)
          : "",
      mode: normalizeProxyMode(parsed.mode),
      scope: normalizeProxyScope(parsed.scope)
    };
  } catch {
    return {
      enabled: false,
      baseUrl: "",
      mode: "prefix",
      scope: "all"
    };
  }
}

export async function saveProxySettings(
  env: Env,
  payload: {
    enabled?: unknown;
    baseUrl?: unknown;
    mode?: unknown;
    scope?: unknown;
  }
) {
  const db = await getDatabase(env);
  const enabled = payload.enabled === true;
  const baseUrl =
    typeof payload.baseUrl === "string"
      ? normalizeProxyBaseUrl(payload.baseUrl)
      : "";

  if (enabled && !baseUrl) {
    throw new InvalidRequestError("proxy base URL is required when proxy is enabled.");
  }

  const settings = {
    enabled,
    baseUrl,
    mode: normalizeProxyMode(payload.mode),
    scope: normalizeProxyScope(payload.scope)
  } satisfies ProxySettings;

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(PROXY_SETTINGS_KEY, JSON.stringify(settings))
    .run();

  return settings;
}

export async function getSiteSettings(env: Env): Promise<SiteSettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(SITE_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return DEFAULT_SITE_SETTINGS;
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<SiteSettings>;
    return normalizeSiteSettings(parsed);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

async function writeSiteSettings(
  env: Env,
  payload: {
    name?: unknown;
    subtitle?: unknown;
    iconUrl?: unknown;
    aboutContent?: unknown;
    privacyContent?: unknown;
    termsContent?: unknown;
    footer?: unknown;
    homeHero?: unknown;
  }
) {
  const db = await getDatabase(env);
  const settings = normalizeSiteSettings({
    name: typeof payload.name === "string" ? payload.name : "",
    subtitle: typeof payload.subtitle === "string" ? payload.subtitle : "",
    iconUrl: typeof payload.iconUrl === "string" ? payload.iconUrl : "",
    aboutContent: payload.aboutContent,
    privacyContent: payload.privacyContent,
    termsContent: payload.termsContent,
    footer:
      typeof payload.footer === "object" && payload.footer !== null
        ? (payload.footer as Partial<FooterSettings>)
        : undefined,
    homeHero: payload.homeHero
  });

  if (typeof payload.iconUrl === "string" && payload.iconUrl.trim() && !settings.iconUrl) {
    throw new InvalidRequestError("site icon must be a valid http/https URL or supported image data.");
  }

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(SITE_SETTINGS_KEY, JSON.stringify(settings))
    .run();

  return settings;
}

export async function getUmamiSettings(env: Env): Promise<UmamiSettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(UMAMI_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row) {
    return { enabled: false, scriptUrl: "", websiteId: "" };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<UmamiSettings>;
    const scriptUrl = normalizeUmamiScriptUrl(parsed.scriptUrl);
    const websiteId = normalizeUmamiWebsiteId(parsed.websiteId);

    return {
      enabled: parsed.enabled === true && Boolean(scriptUrl && websiteId),
      scriptUrl,
      websiteId
    };
  } catch {
    return { enabled: false, scriptUrl: "", websiteId: "" };
  }
}

export async function saveUmamiSettings(
  env: Env,
  payload: {
    enabled?: unknown;
    scriptUrl?: unknown;
    websiteId?: unknown;
  }
) {
  const db = await getDatabase(env);
  const enabled = payload.enabled === true;
  const rawScriptUrl =
    typeof payload.scriptUrl === "string" ? payload.scriptUrl.trim() : "";
  const rawWebsiteId =
    typeof payload.websiteId === "string" ? payload.websiteId.trim() : "";
  const scriptUrl = normalizeUmamiScriptUrl(rawScriptUrl);
  const websiteId = normalizeUmamiWebsiteId(rawWebsiteId);

  if (rawScriptUrl && !scriptUrl) {
    throw new InvalidRequestError(
      "Umami script URL must be a valid http/https URL."
    );
  }

  if (rawWebsiteId.length > 200) {
    throw new InvalidRequestError("Umami Website ID is too long.");
  }

  if (enabled && (!scriptUrl || !websiteId)) {
    throw new InvalidRequestError(
      "Umami script URL and Website ID are required when analytics is enabled."
    );
  }

  const settings = { enabled, scriptUrl, websiteId } satisfies UmamiSettings;

  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(UMAMI_SETTINGS_KEY, JSON.stringify(settings))
    .run();

  return settings;
}

export async function patchSiteSettings(env: Env, payload: SiteSettingsPatch) {
  const current = await getSiteSettings(env);

  if (payload.section === "identity") {
    return writeSiteSettings(env, {
      ...current,
      name: payload.name,
      subtitle: payload.subtitle,
      iconUrl: payload.iconUrl
    });
  }

  if (payload.section === "about") {
    assertLocalizedMarkdownContent(payload.aboutContent, "about content");
    return writeSiteSettings(env, {
      ...current,
      aboutContent: payload.aboutContent
    });
  }

  if (payload.section === "privacy") {
    assertLocalizedLegalContent(payload.privacyContent, "privacy content");
    return writeSiteSettings(env, {
      ...current,
      privacyContent: payload.privacyContent
    });
  }

  if (payload.section === "terms") {
    assertLocalizedLegalContent(payload.termsContent, "terms content");
    return writeSiteSettings(env, {
      ...current,
      termsContent: payload.termsContent
    });
  }

  if (payload.section === "home") {
    return writeSiteSettings(env, {
      ...current,
      homeHero: payload.homeHero
    });
  }

  if (payload.section === "footer") {
    if (typeof payload.footer !== "object" || payload.footer === null) {
      throw new InvalidRequestError("footer is required.");
    }

    return writeSiteSettings(env, {
      ...current,
      footer: payload.footer
    });
  }

  throw new InvalidRequestError("site settings section is invalid.");
}

export function proxifyUrl(
  value: string,
  settings: ProxySettings,
  options: { resourceType?: "link" | "image" } = {}
) {
  const targetUrl = normalizeHttpUrl(value);

  if (!targetUrl || !settings.enabled || !settings.baseUrl) {
    return targetUrl;
  }

  const scope = normalizeProxyScope(settings.scope);
  const resourceType = options.resourceType ?? "link";

  if (scope === "images" && resourceType !== "image") {
    return targetUrl;
  }

  const baseUrl = normalizeProxyBaseUrl(settings.baseUrl);
  const mode = normalizeProxyMode(settings.mode);

  if (!baseUrl) {
    return targetUrl;
  }

  if (mode === "edgeone-proxy") {
    return createProxyQueryUrl(baseUrl, "proxy", targetUrl);
  }

  if (mode === "edgeone-advanced") {
    return createProxyQueryUrl(baseUrl, "advanced-proxy", targetUrl);
  }

  return `${baseUrl}${targetUrl}`;
}

function normalizeSiteSettings(value: {
  name?: unknown;
  subtitle?: unknown;
  iconUrl?: unknown;
  aboutContent?: unknown;
  privacyContent?: unknown;
  termsContent?: unknown;
  footer?: unknown;
  homeHero?: unknown;
}): SiteSettings {
  const name =
    typeof value.name === "string" && value.name.trim()
      ? value.name.trim().slice(0, 40)
      : DEFAULT_SITE_SETTINGS.name;
  const subtitle =
    typeof value.subtitle === "string" && value.subtitle.trim()
      ? value.subtitle.trim().slice(0, 60)
      : DEFAULT_SITE_SETTINGS.subtitle;
  const iconUrl =
    typeof value.iconUrl === "string" && value.iconUrl.trim()
      ? normalizeSiteIconUrl(value.iconUrl)
      : "";

  return {
    name,
    subtitle,
    iconUrl,
    aboutContent: normalizeLocalizedAboutContent(value.aboutContent),
    privacyContent: normalizeLocalizedLegalContent(value.privacyContent),
    termsContent: normalizeLocalizedLegalContent(value.termsContent),
    footer: normalizeFooterSettings(value.footer),
    homeHero: normalizeHomeHeroSettings(value.homeHero)
  };
}

function normalizeLocalizedLegalContent(value: unknown): LocalizedLegalContent {
  const source =
    typeof value === "object" && value !== null
      ? (value as Partial<LocalizedLegalContent>)
      : {};

  return {
    zh: typeof source.zh === "string" ? source.zh.trim().slice(0, 60000) : "",
    en: typeof source.en === "string" ? source.en.trim().slice(0, 60000) : ""
  };
}

function normalizeLocalizedAboutContent(value: unknown): LocalizedMarkdownContent {
  if (typeof value === "string") {
    return {
      zh: value.trim().slice(0, 60000),
      en: ""
    };
  }

  return normalizeLocalizedLegalContent(value);
}

function assertLocalizedLegalContent(value: unknown, label: string): asserts value is LocalizedLegalContent {
  assertLocalizedMarkdownContent(value, label);
}

function assertLocalizedMarkdownContent(value: unknown, label: string): asserts value is LocalizedMarkdownContent {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as Partial<LocalizedLegalContent>).zh !== "string" ||
    typeof (value as Partial<LocalizedLegalContent>).en !== "string"
  ) {
    throw new InvalidRequestError(`${label} is required.`);
  }
}

function normalizeHomeHeroSettings(value: unknown): HomeHeroSettings {
  const source =
    typeof value === "object" && value !== null
      ? (value as Partial<HomeHeroSettings>)
      : {};

  return {
    zh: normalizeHomeHeroContent(source.zh),
    en: normalizeHomeHeroContent(source.en)
  };
}

function normalizeHomeHeroContent(value: unknown): HomeHeroContent {
  const source =
    typeof value === "object" && value !== null
      ? (value as Partial<HomeHeroContent>)
      : {};

  return {
    titleTop: normalizeHomeHeroText(source.titleTop, 80),
    titleBottom: normalizeHomeHeroText(source.titleBottom, 80),
    description: normalizeHomeHeroText(source.description, 240)
  };
}

function normalizeHomeHeroText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeFooterSettings(value: unknown): FooterSettings {
  const source =
    typeof value === "object" && value !== null
      ? (value as Partial<FooterSettings>)
      : {};

  return {
    description: normalizeFooterDescription(source.description),
    authorName: DEFAULT_FOOTER_SETTINGS.authorName,
    authorUrl: DEFAULT_FOOTER_SETTINGS.authorUrl,
    copyright: DEFAULT_FOOTER_SETTINGS.copyright,
    sponsorLabel: normalizeFooterText(
      source.sponsorLabel,
      DEFAULT_FOOTER_SETTINGS.sponsorLabel,
      48
    ),
    sponsorUrl:
      normalizeFooterSponsorUrl(source.sponsorUrl),
    socialLinks: normalizeFooterLinks(source.socialLinks, DEFAULT_FOOTER_SETTINGS.socialLinks, 4),
    groups: normalizeFooterGroups(source.groups, DEFAULT_FOOTER_SETTINGS.groups)
  };
}

function normalizeFooterSponsorUrl(value: unknown) {
  const sponsorUrl = normalizeFooterHref(value);

  if (!sponsorUrl) {
    return DEFAULT_FOOTER_SETTINGS.sponsorUrl;
  }

  return sponsorUrl.replace(/\/$/, "").toLowerCase() ===
    LEGACY_DEFAULT_SPONSOR_URL.replace(/\/$/, "").toLowerCase()
    ? DEFAULT_FOOTER_SETTINGS.sponsorUrl
    : sponsorUrl;
}

function normalizeFooterDescription(value: unknown) {
  const description = normalizeFooterText(
    value,
    DEFAULT_FOOTER_SETTINGS.description,
    180
  );

  return [
    LEGACY_DEFAULT_FOOTER_DESCRIPTION,
    PREVIOUS_DEFAULT_FOOTER_DESCRIPTION,
    TEMP_DEFAULT_FOOTER_DESCRIPTION
  ].includes(description)
    ? DEFAULT_FOOTER_SETTINGS.description
    : description;
}

function normalizeFooterText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function normalizeFooterHref(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().slice(0, 256);

  if (!trimmed) {
    return "";
  }

  if (trimmed.toLowerCase() === "mailto:hello@zrf.me") {
    return "mailto:admin@zrf.me";
  }

  if (/^https:\/\/t\.me\/?$/i.test(trimmed)) {
    return "https://d.zrf.me/tgq";
  }

  if (isDefaultAuthorLegalHref(trimmed, "/privacy")) {
    return "/privacy";
  }

  if (isDefaultAuthorLegalHref(trimmed, "/terms")) {
    return "/terms";
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  if (/^(mailto|tel):[^\s]+$/i.test(trimmed)) {
    return trimmed;
  }

  return normalizeHttpUrl(trimmed);
}

function isDefaultAuthorLegalHref(href: string, pathname: "/privacy" | "/terms") {
  try {
    const url = new URL(href);
    const defaultAuthorUrls = [
      DEFAULT_FOOTER_SETTINGS.authorUrl,
      LEGACY_DEFAULT_AUTHOR_URL
    ].map((value) => new URL(value));

    return defaultAuthorUrls.some(
      (defaultAuthorUrl) =>
        url.hostname.toLowerCase() === defaultAuthorUrl.hostname.toLowerCase() &&
        url.pathname.replace(/\/$/, "") === pathname
    );
  } catch {
    return false;
  }
}

function normalizeFooterLinks(
  value: unknown,
  fallback: FooterLink[],
  maxLinks: number
) {
  const items = Array.isArray(value) ? value : fallback;
  const links = items
    .slice(0, maxLinks)
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const source = item as Partial<FooterLink>;
      const label =
        typeof source.label === "string" ? source.label.trim().slice(0, 48) : "";
      const href = normalizeFooterHref(source.href);

      return label && href ? { label, href } : null;
    })
    .filter((item): item is FooterLink => Boolean(item));

  return links.length ? links : fallback;
}

function normalizeFooterGroups(value: unknown, fallback: FooterLinkGroup[]) {
  const items = Array.isArray(value) ? value : fallback;
  const groups = items
    .slice(0, 6)
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const source = item as Partial<FooterLinkGroup>;
      const title =
        typeof source.title === "string" ? source.title.trim().slice(0, 48) : "";
      const links = normalizeFooterLinks(source.links, [], 8);

      return title && links.length ? { title, links } : null;
    })
    .filter((item): item is FooterLinkGroup => Boolean(item));

  return groups.length ? groups : fallback;
}

function normalizeSiteIconUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.length <= SITE_ICON_DATA_URL_MAX_LENGTH &&
    SITE_ICON_DATA_URL_PATTERN.test(trimmed)
  ) {
    return trimmed;
  }

  return normalizeHttpUrl(trimmed);
}

export function createId(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${slug || "tool"}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createArticleId() {
  return `article-${crypto.randomUUID().slice(0, 10)}`;
}

export function createContentSourceId() {
  return `source-${crypto.randomUUID().slice(0, 10)}`;
}

function createContentItemId() {
  return `item-${crypto.randomUUID().slice(0, 10)}`;
}

function createArticleSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || `article-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createUniqueArticleSlug(
  db: D1Database,
  slug: string,
  excludeId = ""
) {
  const base = createArticleSlug(slug);

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const row = await db.prepare(
      "SELECT id FROM articles WHERE slug = ? AND id != ?"
    )
      .bind(candidate, excludeId)
      .first<{ id: string }>();

    if (!row) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function readRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new InvalidRequestError(`${field} is required.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safelyParseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function createPreviewUrl(url: string) {
  const githubPreview = createGitHubOpenGraphImageUrl(url);

  if (githubPreview) {
    return githubPreview;
  }

  return `https://image.thum.io/get/width/1200/crop/720/${url}`;
}

function createGitHubOpenGraphImageUrl(url: string) {
  const repoPath = getGitHubRepoPath(url);

  return repoPath ? `https://opengraph.githubassets.com/htools/${repoPath}` : "";
}

const GITHUB_METADATA_FRESH_TTL_MS = 60 * 60 * 1000;
const GITHUB_METADATA_CACHE_TTL_SECONDS = 24 * 60 * 60;
const GITHUB_METADATA_REQUEST_TIMEOUT_MS = 10_000;
const GITHUB_METADATA_TIMEOUT_ERROR = "GitHub metadata request timed out.";
const GITHUB_README_FRESH_TTL_MS = 60 * 60 * 1000;
const GITHUB_README_CACHE_TTL_SECONDS = 60 * 60;
const GITHUB_README_MAX_LENGTH = 16_000;

export async function loadGitHubToolMetadata(
  url: string,
  options: {
    token?: string;
    forceRefresh?: boolean;
    cacheBaseUrl?: string;
  } = {}
): Promise<GitHubToolMetadata> {
  const repoPath = getGitHubRepoPath(url);

  if (!repoPath) {
    throw new Error("URL must be a GitHub repository.");
  }

  const [owner, repo] = repoPath.split("/");
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner.toLowerCase())}/${encodeURIComponent(repo.toLowerCase())}`;
  const cacheUrl = new URL(options.cacheBaseUrl || apiUrl);
  cacheUrl.pathname = `/__htools-cache/github-metadata/${encodeURIComponent(owner.toLowerCase())}/${encodeURIComponent(repo.toLowerCase())}`;
  cacheUrl.search = "";
  cacheUrl.hash = "";
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
  const cachedEntry = await readGitHubMetadataCache(cacheKey);

  if (
    cachedEntry &&
    !options.forceRefresh &&
    Date.now() - cachedEntry.cachedAt < GITHUB_METADATA_FRESH_TTL_MS
  ) {
    return cachedEntry.metadata;
  }

  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "HTools GitHub Metadata",
    "X-GitHub-Api-Version": "2022-11-28"
  });
  const token = options.token?.trim();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (cachedEntry?.etag) {
    headers.set("If-None-Match", cachedEntry.etag);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      headers,
      signal: AbortSignal.timeout(GITHUB_METADATA_REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new UpstreamServiceError(GITHUB_METADATA_TIMEOUT_ERROR);
    }
    throw new UpstreamServiceError("GitHub API request failed.");
  }

  if (response.status === 304 && cachedEntry) {
    const refreshedEntry = {
      ...cachedEntry,
      etag: response.headers.get("etag") || cachedEntry.etag,
      cachedAt: Date.now()
    };
    await writeGitHubMetadataCache(cacheKey, refreshedEntry);
    return refreshedEntry.metadata;
  }

  if (response.status === 404) {
    throw new Error("GitHub repository not found.");
  }

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new Error(
      remaining === "0"
        ? "GitHub API rate limit reached. Try again later."
        : `GitHub API request failed with status ${response.status}.`
    );
  }

  let repoData: GitHubRepoResponse;
  try {
    repoData = (await response.json()) as GitHubRepoResponse;
  } catch (error) {
    if (isAbortError(error)) {
      throw new UpstreamServiceError(GITHUB_METADATA_TIMEOUT_ERROR);
    }
    throw new UpstreamServiceError("GitHub API response was invalid.");
  }
  const fullName = readOptionalString(repoData.full_name) || repoPath;
  const repoName = readOptionalString(repoData.name) || repo;
  const repoOwner = readOptionalString(repoData.owner?.login) || owner;
  const htmlUrl =
    normalizeLooseHttpUrl(readOptionalString(repoData.html_url)) ||
    `https://github.com/${repoPath}`;
  const homepage = normalizeLooseHttpUrl(readOptionalString(repoData.homepage));
  const language = readOptionalString(repoData.language);
  const license = normalizeGitHubLicense(repoData.license);
  const topics = normalizeGitHubTopics(repoData.topics);

  const metadata = {
    owner: repoOwner,
    repo: repoName,
    fullName,
    name: repoName,
    description: readOptionalString(repoData.description) || fullName,
    url: htmlUrl,
    demoUrl: homepage,
    image: `https://opengraph.githubassets.com/htools/${repoPath}`,
    stars:
      typeof repoData.stargazers_count === "number"
        ? repoData.stargazers_count
        : 0,
    forks: typeof repoData.forks_count === "number" ? repoData.forks_count : 0,
    language,
    license,
    topics,
    updatedAt: readOptionalString(repoData.updated_at)
  };

  await writeGitHubMetadataCache(cacheKey, {
    metadata,
    etag: response.headers.get("etag") ?? "",
    cachedAt: Date.now()
  });

  return metadata;
}

export async function loadGitHubAiContext(
  url: string,
  options: {
    token?: string;
    cacheBaseUrl?: string;
  } = {}
): Promise<GitHubAiContext | null> {
  const repoPath = getGitHubRepoPath(url);
  if (!repoPath) return null;

  const [owner, repo] = repoPath.split("/");
  const [metadata, readme] = await Promise.all([
    loadGitHubToolMetadata(url, options),
    loadGitHubReadme(owner, repo, options).catch(() => "")
  ]);

  return {
    fullName: metadata.fullName,
    description: metadata.description,
    topics: metadata.topics,
    language: metadata.language,
    license: metadata.license,
    stars: metadata.stars,
    forks: metadata.forks,
    readme
  };
}

async function loadGitHubReadme(
  owner: string,
  repo: string,
  options: {
    token?: string;
    cacheBaseUrl?: string;
  }
) {
  const normalizedOwner = owner.toLowerCase();
  const normalizedRepo = repo.toLowerCase();
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}/readme`;
  const cacheUrl = new URL(options.cacheBaseUrl || apiUrl);
  cacheUrl.pathname = `/__htools-cache/github-readme/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}`;
  cacheUrl.search = "";
  cacheUrl.hash = "";
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
  const cachedEntry = await readGitHubReadmeCache(cacheKey);

  if (cachedEntry && Date.now() - cachedEntry.cachedAt < GITHUB_README_FRESH_TTL_MS) {
    return cachedEntry.readme;
  }

  const headers = new Headers({
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "HTools GitHub AI Context",
    "X-GitHub-Api-Version": "2022-11-28"
  });
  const token = options.token?.trim();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      headers,
      signal: AbortSignal.timeout(GITHUB_METADATA_REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new UpstreamServiceError(GITHUB_METADATA_TIMEOUT_ERROR);
    }
    throw new UpstreamServiceError("GitHub README request failed.");
  }

  if (response.status === 404) {
    await writeGitHubReadmeCache(cacheKey, { readme: "", cachedAt: Date.now() });
    return "";
  }
  if (!response.ok) {
    throw new UpstreamServiceError(`GitHub README request failed with status ${response.status}.`);
  }

  let readme = "";
  try {
    readme = (await response.text()).trim().slice(0, GITHUB_README_MAX_LENGTH);
  } catch (error) {
    if (isAbortError(error)) {
      throw new UpstreamServiceError(GITHUB_METADATA_TIMEOUT_ERROR);
    }
    throw new UpstreamServiceError("GitHub README response was invalid.");
  }

  await writeGitHubReadmeCache(cacheKey, { readme, cachedAt: Date.now() });
  return readme;
}

function resolveMarkdownLink(value: string, baseUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) return trimmed;

  try {
    const url = new URL(trimmed, baseUrl);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function resolveMarkdownImage(value: string, baseUrl: string) {
  const resolved = resolveUrl(value.trim(), baseUrl);
  if (!resolved) return "";

  try {
    const url = new URL(resolved);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function cleanXmlMarkupValue(value: string) {
  return value
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .trim();
}

async function readGitHubMetadataCache(
  cacheKey: Request
): Promise<GitHubMetadataCacheEntry | null> {
  try {
    const cache = getDefaultCloudflareCache();
    if (!cache) {
      return null;
    }

    const response = await cache.match(cacheKey);
    if (!response) {
      return null;
    }

    const entry = (await response.json()) as Partial<GitHubMetadataCacheEntry>;
    if (
      !entry.metadata ||
      typeof entry.cachedAt !== "number" ||
      typeof entry.etag !== "string"
    ) {
      return null;
    }

    return entry as GitHubMetadataCacheEntry;
  } catch {
    return null;
  }
}

async function writeGitHubMetadataCache(
  cacheKey: Request,
  entry: GitHubMetadataCacheEntry
) {
  try {
    const cache = getDefaultCloudflareCache();
    if (!cache) {
      return;
    }

    await cache.put(
      cacheKey,
      new Response(JSON.stringify(entry), {
        headers: {
          "Cache-Control": `public, max-age=${GITHUB_METADATA_CACHE_TTL_SECONDS}`,
          "Content-Type": "application/json; charset=utf-8"
        }
      })
    );
  } catch {
    // Metadata fetching should still work when Cache API is unavailable locally.
  }
}

async function readGitHubReadmeCache(
  cacheKey: Request
): Promise<GitHubReadmeCacheEntry | null> {
  try {
    const cache = getDefaultCloudflareCache();
    if (!cache) return null;

    const response = await cache.match(cacheKey);
    if (!response) return null;

    const entry = (await response.json()) as Partial<GitHubReadmeCacheEntry>;
    return typeof entry.readme === "string" && typeof entry.cachedAt === "number"
      ? entry as GitHubReadmeCacheEntry
      : null;
  } catch {
    return null;
  }
}

async function writeGitHubReadmeCache(
  cacheKey: Request,
  entry: GitHubReadmeCacheEntry
) {
  try {
    const cache = getDefaultCloudflareCache();
    if (!cache) return;

    await cache.put(
      cacheKey,
      new Response(JSON.stringify(entry), {
        headers: {
          "Cache-Control": `public, max-age=${GITHUB_README_CACHE_TTL_SECONDS}`,
          "Content-Type": "application/json; charset=utf-8"
        }
      })
    );
  } catch {
    // README loading should still work when Cache API is unavailable locally.
  }
}

function getDefaultCloudflareCache() {
  try {
    return (caches as CacheStorage & { default?: Cache }).default ?? null;
  } catch {
    return null;
  }
}

export function getGitHubRepoPath(url: string) {
  const normalized = normalizeGitHubUrlInput(url);

  if (!normalized) {
    return "";
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host !== "github.com" && host !== "www.github.com") {
      return "";
    }

    const [owner, repo] = parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2);

    if (!owner || !repo) {
      return "";
    }

    return `${owner}/${repo.replace(/\.git$/i, "")}`;
  } catch {
    return "";
  }
}

function normalizeGitHubUrlInput(value: string) {
  return normalizeLooseHttpUrl(value);
}

function normalizeLooseHttpUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function normalizeGitHubLicense(value: GitHubRepoResponse["license"]) {
  const spdxId = readOptionalString(value?.spdx_id);

  if (spdxId && spdxId.toUpperCase() !== "NOASSERTION") {
    return spdxId;
  }

  return readOptionalString(value?.name);
}

function normalizeGitHubTopics(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((topic): topic is string => typeof topic === "string")
        .map((topic) => topic.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function normalizeProxyBaseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return `${url.origin}${url.pathname.replace(/\/?$/, "/")}`;
  } catch {
    return "";
  }
}

export function normalizeUmamiScriptUrl(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed || trimmed.length > 2048) {
    return "";
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeUmamiWebsiteId(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function normalizeProxyMode(value: unknown): ProxySettings["mode"] {
  return value === "edgeone-proxy" ||
    value === "edgeone-advanced" ||
    value === "prefix"
    ? value
    : "prefix";
}

function normalizeProxyScope(value: unknown): ProxySettings["scope"] {
  return value === "images" || value === "all" ? value : "all";
}

function createProxyQueryUrl(baseUrl: string, route: string, targetUrl: string) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/?$/, "/");
  url.pathname = `${basePath}${route}`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.searchParams.set("url", targetUrl);
  url.hash = "";

  return url.toString();
}

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

// 只剩 verifyPassword 一个调用点:新部署还没写过密码哈希时,用 env 明文让管理员首次登录。
// 令牌签名已经不再用它,见 ensureSessionSecret。
function getSecret(env: Env) {
  if (!env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  return env.ADMIN_PASSWORD;
}

// 会话签名密钥:**只有签发路径(createToken)允许创建它**,校验路径只读不写 ——
// 没有密钥就不可能存在合法令牌,所以整个站的生命周期里"写密钥"只发生一次。
async function ensureSessionSecret(env: Env) {
  const db = await getDatabase(env);
  const existing = await readSessionSecret(db);
  if (existing) {
    return existing;
  }

  const generated = bytesToBase64Url(
    crypto.getRandomValues(new Uint8Array(SESSION_SECRET_BYTES))
  );

  // 必须是 DO NOTHING,不能用 INSERT OR REPLACE:两个冷启动实例同时生成时,覆盖写会让
  // 先拿到令牌的管理员瞬间失效。让先写入的那枚获胜、其他实例读回同一枚,两张令牌都有效。
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO NOTHING`
  )
    .bind(SESSION_SECRET_KEY, generated)
    .run();

  const stored = await readSessionSecret(db);
  if (!stored) {
    // fail-closed:读不回来就拒绝签发,绝不"临时生成一枚先用"——
    // 多实例各持一枚会表现成随机掉登录,把配置故障伪装成偶发问题。
    throw new Error("Session secret is not available.");
  }

  return stored;
}

async function readSessionSecret(db: D1Database) {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(SESSION_SECRET_KEY)
    .first<{ value: string }>();

  return normalizeSessionSecret(row?.value);
}

function normalizeSessionSecret(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// 鉴权时用这一条查询同时取回会话密钥和改密时间:D1 往返次数和改造前完全一样。
async function getAuthSettings(env: Env) {
  const db = await getDatabase(env);
  const result = await db.prepare(
    "SELECT key, value FROM app_settings WHERE key IN (?, ?)"
  )
    .bind(SESSION_SECRET_KEY, ADMIN_PASSWORD_KEY)
    .all<{ key: string; value: string }>();

  let sessionSecret: string | null = null;
  let passwordSettings: AdminPasswordSettings | null = null;

  for (const row of result.results ?? []) {
    if (row.key === SESSION_SECRET_KEY) {
      sessionSecret = normalizeSessionSecret(row.value);
    } else if (row.key === ADMIN_PASSWORD_KEY) {
      passwordSettings = parseAdminPasswordSettings(row.value);
    }
  }

  return { sessionSecret, passwordSettings };
}

async function getAdminPasswordSettings(env: Env) {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(ADMIN_PASSWORD_KEY)
    .first<{ value: string }>();

  if (!row) {
    return null;
  }

  return parseAdminPasswordSettings(row.value);
}

// 单独抽出来是因为 getAuthSettings 那条合并查询也要解析同一份 JSON,
// 两处必须用同一套校验规则,不许各写一份。
function parseAdminPasswordSettings(value: string) {
  try {
    const parsed = JSON.parse(value) as Partial<AdminPasswordSettings>;

    if (
      parsed.algorithm !== "PBKDF2-SHA256" ||
      typeof parsed.salt !== "string" ||
      typeof parsed.hash !== "string" ||
      typeof parsed.iterations !== "number"
    ) {
      return null;
    }

    return {
      algorithm: "PBKDF2-SHA256",
      iterations: parsed.iterations,
      salt: parsed.salt,
      hash: parsed.hash,
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    } satisfies AdminPasswordSettings;
  } catch {
    return null;
  }
}

async function createAdminPasswordSettings(password: string): Promise<AdminPasswordSettings> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, ADMIN_PASSWORD_ITERATIONS);

  return {
    algorithm: "PBKDF2-SHA256",
    iterations: ADMIN_PASSWORD_ITERATIONS,
    salt: bytesToBase64Url(salt),
    hash,
    updatedAt: new Date().toISOString()
  };
}

async function verifyAdminPasswordHash(
  password: string,
  settings: AdminPasswordSettings
) {
  const hash = await derivePasswordHash(
    password,
    base64UrlToBytes(settings.salt),
    settings.iterations
  );

  return timingSafeEqual(hash, settings.hash);
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number
) {
  const saltBuffer = new Uint8Array(salt).buffer;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations
    },
    key,
    256
  );

  return bytesToBase64Url(new Uint8Array(bits));
}

function bytesToBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function verifyToken(token: string, env: Env) {
  const [issuedAt, signature] = token.split(".");
  const timestamp = Number(issuedAt);

  if (!issuedAt || !signature || !Number.isFinite(timestamp)) {
    return false;
  }

  if (Date.now() - timestamp > TOKEN_TTL_MS) {
    return false;
  }

  const { sessionSecret, passwordSettings } = await getAuthSettings(env);

  // 校验路径只读不建:没有密钥就不可能存在合法令牌,直接拒绝(fail-closed)。
  if (!sessionSecret) {
    return false;
  }

  const expected = await sign(issuedAt, sessionSecret);
  if (!timingSafeEqual(signature, expected)) {
    return false;
  }

  if (!passwordSettings) {
    return true;
  }

  const passwordUpdatedAt = Date.parse(passwordSettings.updatedAt);
  return !Number.isFinite(passwordUpdatedAt) || timestamp >= passwordUpdatedAt;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function timingSafeEqual(a: string, b: string) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (aBytes[index] ?? 0) ^ (bBytes[index] ?? 0);
  }

  return diff === 0;
}
