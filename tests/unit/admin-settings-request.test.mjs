import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const apiClientSource = await readFile(
  new URL("../../src/api-client.ts", import.meta.url),
  "utf8"
);
const adminApiSource = await readFile(
  new URL("../../src/admin-api.ts", import.meta.url),
  "utf8"
);
const publicApiSource = await readFile(
  new URL("../../src/public-api.ts", import.meta.url),
  "utf8"
);
const adminSource = await readFile(
  new URL("../../src/AdminApp.tsx", import.meta.url),
  "utf8"
);
const appSource = await readFile(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8"
);
const siteHelpersSource = await readFile(
  new URL("../../src/site-helpers.ts", import.meta.url),
  "utf8"
);
const settingsCardsSource = (
  await Promise.all(
    [
      "GitHubSettingsForm",
      "ImageBedSettingsCard",
      "RssHubSettingsCard",
      "TelegramSettingsCard",
      "TurnstileSettingsCard",
      "UmamiSettingsCard",
      "SecuritySettingsCard",
      "LegalSettingsCard",
      "SettingsStatusBadge"
    ].map((name) =>
      readFile(
        new URL(
          `../../src/components/admin-settings/${name}.tsx`,
          import.meta.url
        ),
        "utf8"
      )
    )
  )
).join("\n");
const turnstileCardSource = await readFile(
  new URL("../../src/components/admin-settings/TurnstileSettingsCard.tsx", import.meta.url),
  "utf8"
);
const umamiCardSource = await readFile(
  new URL("../../src/components/admin-settings/UmamiSettingsCard.tsx", import.meta.url),
  "utf8"
);
const securityCardSource = await readFile(
  new URL("../../src/components/admin-settings/SecuritySettingsCard.tsx", import.meta.url),
  "utf8"
);

const compiledApiClient = ts.transpileModule(apiClientSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;
const apiClient = await import(
  `data:text/javascript;base64,${Buffer.from(compiledApiClient).toString("base64")}`
);

function createAbortableFetch() {
  return (_input, init = {}) =>
    new Promise((_resolve, reject) => {
      const rejectAbort = () =>
        reject(new DOMException("The operation was aborted.", "AbortError"));

      if (init.signal?.aborted) {
        rejectAbort();
        return;
      }

      init.signal?.addEventListener("abort", rejectAbort, { once: true });
    });
}

test("settings requests use a stable timeout error", async () => {
  await assert.rejects(
    apiClient.requestJsonWithTimeout(
      "/api/test",
      {},
      { fetchImpl: createAbortableFetch(), timeoutMs: 20 }
    ),
    (error) => {
      assert.equal(error.name, "ApiRequestTimeoutError");
      assert.equal(error.code, "REQUEST_TIMEOUT");
      assert.equal(error.timeoutMs, 20);
      return true;
    }
  );
});

test("caller cancellation stays an AbortError instead of becoming a timeout", async () => {
  const controller = new AbortController();
  const request = apiClient.requestJsonWithTimeout(
    "/api/test",
    { signal: controller.signal },
    { fetchImpl: createAbortableFetch(), timeoutMs: 500 }
  );

  controller.abort();

  await assert.rejects(request, (error) => {
    assert.equal(error.name, "AbortError");
    assert.notEqual(error.code, "REQUEST_TIMEOUT");
    return true;
  });
});

test("timeout also covers a stalled JSON response body", async () => {
  await assert.rejects(
    apiClient.requestJsonWithTimeout(
      "/api/test",
      {},
      {
        fetchImpl: async (_input, init = {}) => ({
          ok: true,
          status: 200,
          json: () =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener(
                "abort",
                () =>
                  reject(
                    new DOMException("The operation was aborted.", "AbortError")
                  ),
                { once: true }
              );
            })
        }),
        timeoutMs: 20
      }
    ),
    (error) => {
      assert.equal(error.code, "REQUEST_TIMEOUT");
      return true;
    }
  );
});

test("successful timed requests still use the shared JSON error handling", async () => {
  const payload = await apiClient.requestJsonWithTimeout(
    "/api/test",
    {},
    {
      fetchImpl: async () =>
        new Response(JSON.stringify({ settings: { enabled: true } }), {
          headers: { "Content-Type": "application/json" }
        }),
      timeoutMs: 100
    }
  );

  assert.deepEqual(payload, { settings: { enabled: true } });
});

test("timed-out settings writes confirm once without repeating the write", async () => {
  let writeCalls = 0;
  let confirmCalls = 0;
  const current = { enabled: true };
  const recovered = await apiClient.confirmTimedOutWrite({
    delayMs: 0,
    write: async () => {
      writeCalls += 1;
      throw new apiClient.ApiRequestTimeoutError(20);
    },
    confirm: async () => {
      confirmCalls += 1;
      return current;
    },
    matches: (settings) => settings.enabled === true
  });

  assert.equal(recovered, current);
  assert.equal(writeCalls, 1);
  assert.equal(confirmCalls, 1);
});

test("timed-out settings confirmation preserves the original timeout when uncertain", async () => {
  const timeout = new apiClient.ApiRequestTimeoutError(20);
  let confirmCalls = 0;

  await assert.rejects(
    apiClient.confirmTimedOutWrite({
      delayMs: 0,
      write: async () => {
        throw timeout;
      },
      confirm: async () => {
        confirmCalls += 1;
        return { enabled: false };
      },
      matches: (settings) => settings.enabled === true
    }),
    (error) => error === timeout
  );
  assert.equal(confirmCalls, 1);

  await assert.rejects(
    apiClient.confirmTimedOutWrite({
      delayMs: 0,
      write: async () => {
        throw timeout;
      },
      confirm: async () => {
        throw new Error("confirmation failed");
      },
      matches: () => true
    }),
    (error) => error === timeout
  );
});

test("non-timeout write failures never trigger confirmation reads", async () => {
  let confirmCalls = 0;
  const failure = new Error("save failed");

  await assert.rejects(
    apiClient.confirmTimedOutWrite({
      delayMs: 0,
      write: async () => {
        throw failure;
      },
      confirm: async () => {
        confirmCalls += 1;
        return { enabled: true };
      },
      matches: () => true
    }),
    (error) => error === failure
  );
  assert.equal(confirmCalls, 0);
});

test("all system settings reads share timeout and cancellation support", () => {
  for (const functionName of [
    "loadSourceSettings",
    "loadAdminSecuritySettings",
    "loadGitHubSettings",
    "loadRssHubSettings",
    "loadUmamiSettings"
  ]) {
    const start = adminApiSource.indexOf(`export async function ${functionName}`);
    const end = adminApiSource.indexOf("\nexport ", start + 1);
    const source = adminApiSource.slice(start, end < 0 ? undefined : end);
    assert.match(source, /requestJsonWithTimeout/);
    assert.match(source, /signal: options\.signal/);
  }

  for (const functionName of ["loadProxySettings", "loadSiteConfiguration"]) {
    const start = publicApiSource.indexOf(`export async function ${functionName}`);
    const end = publicApiSource.indexOf("\nexport ", start + 1);
    const source = publicApiSource.slice(start, end < 0 ? undefined : end);
    assert.match(source, /requestJsonWithTimeout/);
    assert.match(source, /signal: options\.signal/);
  }

  assert.match(
    publicApiSource,
    /loadSiteSettings\([\s\S]*loadSiteConfiguration\(options\)/
  );
});

test("external service setting writes release their UI through the shared timeout", () => {
  for (const functionName of [
    "saveSourceSettings",
    "saveProxySettings",
    "saveRssHubSettings",
    "saveImageBedSettings",
    "saveTurnstileSettings",
    "saveUmamiSettings",
    "saveTelegramSettings",
    "saveGitHubSettings",
    "saveAdminCategorySettings",
    "patchSiteSettings"
  ]) {
    const start = adminApiSource.indexOf(`export async function ${functionName}`);
    const end = adminApiSource.indexOf("\nexport ", start + 1);
    const source = adminApiSource.slice(start, end < 0 ? undefined : end);
    assert.match(source, /requestJsonWithTimeout/);
    assert.match(source, /confirmTimedOutWrite/);
    assert.doesNotMatch(source, /await fetch\(/);
  }

  assert.match(apiClientSource, /TIMED_OUT_WRITE_CONFIRM_DELAY_MS = 400/);
  assert.match(apiClientSource, /TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS = 3_000/);
  assert.match(adminApiSource, /timeoutMs: TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS/);

  assert.match(
    adminSource,
    /async function togglePublicSource\(\)[\s\S]*?finally \{[\s\S]*?setSourceSettingsSaving\(false\)/
  );
  assert.match(
    adminSource,
    /async function saveProxy\([\s\S]*?finally \{[\s\S]*?setProxySaving\(false\)/
  );
  assert.match(
    turnstileCardSource,
    /async function toggleEnabled\(\)[\s\S]*?finally \{[\s\S]*?setSaving\(false\)/
  );
  assert.match(
    umamiCardSource,
    /async function persist\([\s\S]*?finally \{[\s\S]*?setSaving\(false\)/
  );
});

test("non-idempotent admin mutations do not inherit the settings timeout", () => {
  for (const functionName of [
    "createTool",
    "deleteTool",
    "createArticle",
    "deleteArticle",
    "createContentSource",
    "syncContentSource",
    "applyAdminCategoryAction",
    "importTools",
    "restoreBackupData",
    "resetFactorySettings",
    "updateAdminPassword",
    "sendTelegramMessage",
    "updateTelegramMessage",
    "deleteTelegramPush"
  ]) {
    const start = adminApiSource.indexOf(`export async function ${functionName}`);
    const end = adminApiSource.indexOf("\nexport ", start + 1);
    const source = adminApiSource.slice(start, end < 0 ? undefined : end);
    assert.match(source, /await fetch\(/);
    assert.doesNotMatch(source, /requestJsonWithTimeout/);
  }
});

test("settings cards abort stale loads and accept only the latest response", () => {
  const sources = `${adminSource}\n${settingsCardsSource}`;

  for (const prefix of [
    "settingsLoad",
    "sourceSettingsLoad",
    "siteSettingsLoad",
    "proxySettingsLoad",
    "telegramSettingsLoad"
  ]) {
    assert.match(sources, new RegExp(`${prefix}RequestRef = useRef\\(0\\)`));
    assert.match(
      sources,
      new RegExp(`${prefix}AbortRef = useRef<AbortController \\| null>\\(null\\)`)
    );
    assert.match(sources, new RegExp(`${prefix}AbortRef\\.current\\?\\.abort\\(\\)`));
  }

  for (const cardSource of [
    turnstileCardSource,
    umamiCardSource,
    securityCardSource
  ]) {
    assert.match(
      cardSource,
      /const controller = new AbortController\(\);[\s\S]*?void loadSettings\(controller\.signal\);[\s\S]*?controller\.abort\(\);[\s\S]*?loadRequestRef\.current \+= 1/
    );
    assert.match(cardSource, /if \(signal\?\.aborted \|\| loadRequestRef\.current !== requestId\) return/);
    assert.match(cardSource, /if \(!signal\?\.aborted && loadRequestRef\.current === requestId\) setLoading\(false\)/);
  }

  assert.match(sources, /!controller\.signal\.aborted/);
});

test("system settings reuse the outer site, proxy and Telegram requests", () => {
  assert.match(adminSource, /siteSettingsReady/);
  assert.match(adminSource, /proxySettingsReady/);
  assert.match(adminSource, /telegramSettingsLoading/);
  assert.match(adminSource, /onReloadTelegramSettings/);
  assert.doesNotMatch(
    adminSource,
    /void loadSiteSettingsCards\(\);\s*void loadProxySettingsCard\(\);/
  );

  assert.match(appSource, /siteSettingsRequestSettled/);
  assert.match(appSource, /proxySettingsRequestSettled/);
  assert.match(appSource, /siteSettingsLoadError=\{siteSettingsRequestError\}/);
  assert.match(appSource, /proxySettingsLoadError=\{proxySettingsRequestError\}/);

  const telegramLoaderUsesSignal =
    /loadTelegramSettings\(token,\s*\{\s*signal: controller\.signal/.test(adminSource);
  assert.equal(telegramLoaderUsesSignal, true);
  assert.equal(
    (adminSource.match(/loadTelegramSettings\(token/g) ?? []).length,
    2,
    "one shared loader and one maintenance refresh are expected"
  );
});

test("every readable settings area exposes the same card retry pattern", () => {
  const sources = `${adminSource}\n${settingsCardsSource}`;

  assert.equal((sources.match(/<AdminSettingsLoadError\b/g) ?? []).length, 11);
  assert.doesNotMatch(sources, /className="settings-card-error"/);
  assert.match(adminSource, /onRetry=\{\(\) => void loadSiteSettingsCards\(\)\}/);
  assert.match(adminSource, /onRetry=\{\(\) => void loadSourceSettingsCard\(\)\}/);
  assert.match(adminSource, /onRetry=\{\(\) => void onReloadAdminAiSettings\(\)\}/);
  assert.match(settingsCardsSource, /onRetry=\{\(\) => void loadSettings\(\)\}/);
  assert.match(adminSource, /onRetry=\{\(\) => void loadProxySettingsCard\(\)\}/);
  assert.match(settingsCardsSource, /onRetry=\{\(\) => void onReload\(\)\}/);
  for (const cardSource of [turnstileCardSource, umamiCardSource, securityCardSource]) {
    assert.match(cardSource, /<AdminSettingsLoadError\b/);
    assert.match(cardSource, /onRetry=\{\(\) => void loadSettings\(\)\}/);
  }
  assert.match(settingsCardsSource, /setSettingsReloadKey\(\(current\) => current \+ 1\)/);
  assert.doesNotMatch(
    sources,
    /setSettingsError\(message\);\s*onStatus\(message\)/
  );
});

test("timeout errors are localized and empty request status preserves the shared notification queue", () => {
  assert.match(siteHelpersSource, /errorCode === "REQUEST_TIMEOUT"/);
  assert.match(siteHelpersSource, /请求超时，请稍后重试。/);
  assert.match(siteHelpersSource, /Request timed out\. Try again shortly\./);
  assert.match(
    adminSource,
    /setAuthStatus\(""\);\s*if \(message\) onNotify\(\{ message, tone: "info" \}\);/
  );
  assert.doesNotMatch(adminSource, /adminStatusCurrentRef|setStatusEvent|adminStatusTimer/);
});
