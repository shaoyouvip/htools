import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const fallbackModule = await compileTypescriptModule(new URL("../../src/site-logo-fallback.ts", import.meta.url));
const { SITE_LOGO_FALLBACK_DATA_URL } = await import(fallbackModule.url.href);
after(() => fallbackModule.cleanup());

const [sharedSource, publicSource, adminSource, styles, siteHelpersSource, indexHtml] = await Promise.all([
  readFile(new URL("../../src/shared-ui.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../src/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../src/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../../src/site-helpers.ts", import.meta.url), "utf8"),
  readFile(new URL("../../index.html", import.meta.url), "utf8")
]);

test("one shared site identity owns the configured logo, name, and subtitle", () => {
  assert.match(sharedSource, /export function SiteBrandIdentity/);
  assert.match(sharedSource, /<SiteBrandMark className=\{markClassName\}/);
  assert.match(sharedSource, /getSiteDisplayName\(settings\)/);
  assert.match(sharedSource, /getSiteSubtitle\(settings\)/);
  assert.match(sharedSource, /showSubtitle/);
});

test("public header, mobile drawer, footer, admin sidebar, and login share the identity", () => {
  assert.equal((publicSource.match(/<SiteBrandIdentity/g) ?? []).length, 3);
  assert.equal((adminSource.match(/<SiteBrandIdentity/g) ?? []).length, 2);
  assert.match(adminSource, /className="auth-home-brand"[\s\S]*<SiteBrandIdentity showSubtitle \/>/);
  assert.match(adminSource, /className="admin-brand"[\s\S]*markClassName="compact-mark" showSubtitle/);
  assert.doesNotMatch(adminSource, /auth-mark/);
  assert.doesNotMatch(adminSource, /auth-heading|t\.admin\.description/);
  assert.match(adminSource, /<form className="auth-form"/);
  assert.match(styles, /\.auth-home-brand/);
  assert.match(styles, /\.auth-form\s*\{[\s\S]*border-top:\s*1px solid var\(--border-soft\)/);
});

test("the project brand logo is a display fallback and never becomes a stored default", () => {
  assert.match(siteHelpersSource, /export const DEFAULT_SITE_ICON_URL = "\/htools-logo\.png"/);
  assert.match(siteHelpersSource, /iconUrl: "",/);
  assert.match(sharedSource, /const displayIconUrl = useDefaultIcon \? DEFAULT_SITE_ICON_URL : iconUrl \|\| DEFAULT_SITE_ICON_URL/);
  assert.match(indexHtml, /href="\/htools-logo\.png" type="image\/png" sizes="512x512"/);
});

test("site settings preview shares brand rendering and the same image fallback", () => {
  assert.match(adminSource, /<SiteBrandMark className="compact-mark" iconUrl=\{siteForm\.iconUrl\} \/>/);
  assert.doesNotMatch(adminSource, /handleSitePreviewError|sitePreviewFailed|sitePreviewRetryToken/);
});

test("the last image fallback embeds the same circular brand as the shipped favicon", async () => {
  const favicon = await readFile(new URL("../../public/favicon.ico", import.meta.url));
  const count = favicon.readUInt16LE(4);
  const entries = Array.from({ length: count }, (_, index) => 6 + index * 16);
  const entry = entries.find((offset) => favicon[offset] === 128 && favicon[offset + 1] === 128);
  assert.notEqual(entry, undefined);
  const start = favicon.readUInt32LE(entry + 12);
  const length = favicon.readUInt32LE(entry + 8);
  const embedded = Buffer.from(SITE_LOGO_FALLBACK_DATA_URL.split(",")[1], "base64");
  assert.deepEqual(embedded, favicon.subarray(start, start + length));
  assert.equal(embedded.readUInt32BE(16), 128);
  assert.equal(embedded.readUInt32BE(20), 128);
  assert.match(sharedSource, /useEmbeddedIcon \? SITE_LOGO_FALLBACK_DATA_URL/);
  assert.match(sharedSource, /onError=\{useEmbeddedIcon \? undefined : handleImageError\}/);
  assert.doesNotMatch(sharedSource, /\bWand(?:2|Sparkles)?\b/);
});

test("admin tool library uses the same wrench icon as the public tools entry", () => {
  assert.match(
    adminSource,
    /adminView === "tools"[\s\S]*?<Wrench size=\{18\} \/>[\s\S]*?\{t\.admin\.toolLibrary\}/
  );
});
