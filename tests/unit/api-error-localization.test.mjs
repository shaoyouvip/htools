import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [apiClientSource, siteHelpersSource, appSource, adminSource, publicApiSource] =
  await Promise.all([
    readFile(new URL("../../src/api-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/site-helpers.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/public-api.ts", import.meta.url), "utf8")
  ]);

const compiledApiClient = ts.transpileModule(apiClientSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;
const apiClient = await import(
  `data:text/javascript;base64,${Buffer.from(compiledApiClient).toString("base64")}`
);

test("API errors preserve stable response codes and HTTP status", async () => {
  const response = new Response(
    JSON.stringify({ error: "Conflict detail.", code: "CONFLICT" }),
    { status: 409, headers: { "Content-Type": "application/json" } }
  );

  await assert.rejects(apiClient.readJson(response), (error) => {
    assert.equal(error.name, "ApiClientError");
    assert.equal(error.status, 409);
    assert.equal(error.code, "CONFLICT");
    return true;
  });
});

test("invalid JSON rejects successful responses while preserving HTTP errors", async () => {
  for (const body of ["", "<html>Unavailable</html>", '{"incomplete":']) {
    await assert.rejects(apiClient.readJson(new Response(body)), SyntaxError);
    await assert.rejects(apiClient.readJson(new Response(body, { status: 502 })), {
      name: "ApiClientError", status: 502, message: "Request failed"
    });
  }
});

test("localized error helper has code, status, and safe fallback layers", () => {
  for (const code of [
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "RATE_LIMITED",
    "INVALID_REQUEST",
    "SERVER_ERROR"
  ]) {
    assert.ok(siteHelpersSource.includes(`${code}: t.errors.`));
  }

  for (const status of [400, 401, 403, 404, 409, 429]) {
    assert.match(siteHelpersSource, new RegExp(`status === ${status}`));
  }
  assert.match(siteHelpersSource, /status >= 500/);
  assert.match(siteHelpersSource, /return fallback;/);
});

test("business API error codes have localized messages", () => {
  for (const code of [
    "INVALID_PASSWORD",
    "TURNSTILE_CONFIG_ERROR",
    "TURNSTILE_REQUIRED",
    "TURNSTILE_FAILED",
    "TURNSTILE_UNAVAILABLE",
    "GITHUB_METADATA_TIMEOUT",
    "TELEGRAM_TEST_TIMEOUT"
  ]) {
    assert.ok(siteHelpersSource.includes(`${code}:`));
  }
});

test("public and admin UI do not display raw caught API messages", () => {
  assert.doesNotMatch(appSource, /setArticleLoadError\(error instanceof Error/);
  assert.doesNotMatch(publicApiSource, /error: error instanceof Error/);
  assert.doesNotMatch(
    adminSource,
    /setStatus\(error instanceof Error \? error\.message/
  );
  assert.match(appSource, /setToolLoadError\(getLocalizedErrorMessage\(error, t\)\)/);
  for (const field of ["toolLoadError", "articleError", "error", "loadErrorMessage"]) {
    assert.match(appSource, new RegExp(`<PublicLoadError[^>]*message=\\{${field}\\}`));
  }
  assert.doesNotMatch(
    appSource,
    /toolLoadError\s*\? t\.empty\.connectionDescription/
  );
});

test("shared network failures stay localized across public, settings, feed, and link-check paths", () => {
  assert.match(siteHelpersSource, /return t\.errors\.networkError/);
  assert.doesNotMatch(siteHelpersSource, /本地预览服务|local preview server/);
  assert.doesNotMatch(adminSource, /return message \|\| fallback/);
  assert.match(adminSource, /getLocalizedErrorMessage\(error, t, fallback\)/);
  assert.match(adminSource, /getLinkCheckErrorText\(result, t\)/);
  assert.match(adminSource, /result\.status === 0 \? t\.errors\.networkError/);
});
