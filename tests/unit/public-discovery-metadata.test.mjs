import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

const [helperSource, rssSource, jsonFeedSource, sitemapSource, appSource] =
  await Promise.all([
    readSource("functions/_public-discovery.ts"),
    readSource("functions/rss.xml.ts"),
    readSource("functions/rss.json.ts"),
    readSource("functions/sitemap.xml.ts"),
    readSource("src/App.tsx")
  ]);

test("public discovery outputs share one article URL, image, and date normalizer", () => {
  assert.match(helperSource, /export function createPublicArticleMetadata/);
  assert.match(helperSource, /`\/articles\/\$\{encodeURIComponent\(article\.slug\)\}`/);
  assert.match(helperSource, /normalizePublicHttpUrl\(article\.cover_image, requestUrl\)/);
  assert.match(
    helperSource,
    /datePublished: getFirstPublicDate\([\s\S]*article\.published_at,[\s\S]*article\.created_at,[\s\S]*article\.updated_at/
  );
  assert.match(
    helperSource,
    /dateModified: getFirstPublicDate\([\s\S]*article\.updated_at,[\s\S]*article\.published_at,[\s\S]*article\.created_at/
  );
  assert.match(helperSource, /url\.protocol === "http:" \|\| url\.protocol === "https:"/);
  assert.match(helperSource, /hasTime && !hasTimezone/);
});

test("public feeds use the project logo only when no custom site icon is stored", () => {
  assert.match(helperSource, /const DEFAULT_PUBLIC_LOGO_PATH = "\/htools-logo\.png"/);
  assert.match(helperSource, /iconUrl: site\.iconUrl \|\| DEFAULT_PUBLIC_LOGO_PATH/);
  assert.match(helperSource, /iconUrl: DEFAULT_PUBLIC_LOGO_PATH/);
});

test("RSS exposes canonical article URLs, covers, and modification dates", () => {
  assert.match(rssSource, /createPublicArticleMetadata\(request\.url, article\)/);
  assert.match(rssSource, /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/);
  assert.match(rssSource, /<media:content url=/);
  assert.match(rssSource, /<atom:updated>/);
  assert.match(rssSource, /getLatestPublicDate/);
  assert.doesNotMatch(rssSource, /function parseDate/);
  assert.doesNotMatch(rssSource, /function parseTags/);
});

test("public feeds share the same real-tag and category-fallback rule", () => {
  assert.match(helperSource, /getEffectiveTags\(tags, category\)/);
  assert.match(
    rssSource,
    /parsePublicArticleTags\(article\.tags, article\.category\)/
  );
  assert.match(
    jsonFeedSource,
    /parsePublicArticleTags\(article\.tags, article\.category\)/
  );
});

test("JSON Feed resolves site and article media to standard public URLs", () => {
  assert.match(jsonFeedSource, /home_page_url: siteUrl/);
  assert.match(jsonFeedSource, /feed_url: createPublicUrl\(request\.url, "\/rss\.json"\)/);
  assert.match(jsonFeedSource, /normalizePublicHttpUrl\(site\.iconUrl, request\.url\)/);
  assert.match(jsonFeedSource, /image: metadata\.image \|\| undefined/);
  assert.match(jsonFeedSource, /date_published: metadata\.datePublished \|\| undefined/);
  assert.match(jsonFeedSource, /date_modified: metadata\.dateModified \|\| undefined/);
  assert.doesNotMatch(jsonFeedSource, /function parseDate/);
});

test("sitemap lastmod follows the same actual modification date", () => {
  assert.match(sitemapSource, /const metadata = createPublicArticleMetadata/);
  assert.match(sitemapSource, /metadata\.dateModified/);
  assert.match(sitemapSource, /return date \? date\.toISOString\(\) : ""/);
  assert.doesNotMatch(
    sitemapSource,
    /article\.published_at \?\? article\.updated_at/
  );
});

test("article JSON-LD uses the same publication and modification fallbacks", () => {
  assert.match(
    appSource,
    /publishedAt:[\s\S]*article\.published_at \?\?[\s\S]*article\.publishedAt \?\?[\s\S]*article\.created_at \?\?[\s\S]*article\.updated_at/
  );
  assert.match(
    appSource,
    /modifiedAt:[\s\S]*article\.updated_at \?\?[\s\S]*article\.published_at \?\?[\s\S]*article\.publishedAt \?\?[\s\S]*article\.created_at/
  );
});
