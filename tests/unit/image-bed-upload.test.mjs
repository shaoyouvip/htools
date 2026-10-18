import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const compiledValidation = await compileTypescriptModule(
  new URL("../../shared/image-upload.ts", import.meta.url)
);
const sharedStub = `data:text/javascript,${encodeURIComponent(`
  export class InvalidRequestError extends Error {}
  export async function getDatabase(env) { return env.DB; }
  export function jsonError(error, code, init) {
    return new Response(JSON.stringify({ error, code }), {
      status: init.status,
      headers: { "Content-Type": "application/json" }
    });
  }
  export function writeErrorResponse(error, fallback) {
    return jsonError(error instanceof Error ? error.message : fallback, "SERVER_ERROR", { status: 500 });
  }
`)}`;
const compiledService = await compileTypescriptModule(
  new URL("../../functions/_image-bed.ts", import.meta.url),
  {
    importReplacements: {
      "./_shared": sharedStub,
      "../shared/image-upload": compiledValidation.url.href
    }
  }
);
const validation = await import(`${compiledValidation.url.href}?image-validation=1`);
const service = await import(`${compiledService.url.href}?image-bed=1`);
const compiledApiClient = await compileTypescriptModule(
  new URL("../../src/api-client.ts", import.meta.url)
);
const compiledProxy = await compileTypescriptModule(
  new URL("../../src/proxy.ts", import.meta.url)
);
const compiledAdminApi = await compileTypescriptModule(
  new URL("../../src/admin-api.ts", import.meta.url),
  {
    importReplacements: {
      "./api-client": compiledApiClient.url.href,
      "./proxy": compiledProxy.url.href
    },
    transformSource(source) {
      const start = source.indexOf("export async function loadImageBedSettings(");
      const end = source.indexOf("export async function uploadAdminImage(", start);
      assert.ok(start >= 0 && end > start);
      return `
        import { requestJsonWithTimeout, confirmTimedOutWrite, TIMED_OUT_WRITE_CONFIRM_TIMEOUT_MS } from "./api-client";
        import { normalizeProxyBaseUrl } from "./proxy";
        ${source.slice(start, end)}
      `;
    }
  }
);
const apiClient = await import(compiledApiClient.url.href);
const adminApi = await import(compiledAdminApi.url.href);

test.after(async () => {
  await Promise.all([
    compiledValidation.cleanup(), compiledService.cleanup(),
    compiledApiClient.cleanup(), compiledProxy.cleanup(), compiledAdminApi.cleanup()
  ]);
});

function createSettingsDatabase(initialValue = null) {
  let value = initialValue;
  return {
    get value() {
      return value;
    },
    prepare() {
      let bindings = [];
      return {
        bind(...nextBindings) {
          bindings = nextBindings;
          return this;
        },
        async first() {
          return value === null ? null : { value };
        },
        async run() {
          value = bindings[1];
          return { success: true };
        }
      };
    }
  };
}

function createFile(size, type = "image/png") {
  return new File([new Uint8Array(size)], "test.png", { type });
}

const settingsInput = {
  enabled: true,
  baseUrl: "https://image.example/root/",
  uploadChannel: "cfr2",
  channelName: "main",
  uploadNameType: "short",
  uploadFolder: "htools/images"
};

function stallUntilAbort(signal) {
  return new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

function mockSettingsRequests(t, fetchImpl) {
  const calls = [];
  const timers = [];
  const originalSetTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => {
    timers.push(delay);
    return originalSetTimeout(callback, 0, ...args);
  });
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/admin/image-bed-settings");
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer local-test-token");
    calls.push({ method: init.method ?? "GET", body: init.body });
    return fetchImpl(init);
  });
  return { calls, timers };
}

function assertOriginalWriteTimeout(error) {
  assert.ok(error instanceof apiClient.ApiRequestTimeoutError);
  assert.equal(error.timeoutMs, apiClient.DEFAULT_API_REQUEST_TIMEOUT_MS);
  return true;
}

test("image bed normal saves return the server result without a confirmation read", async (t) => {
  const env = { DB: createSettingsDatabase(), IMGBED_TOKEN: "local-test-token" };
  const { calls, timers } = mockSettingsRequests(t, async (init) =>
    Response.json({ settings: await service.saveImageBedSettings(env, JSON.parse(init.body)) })
  );

  assert.deepEqual(await adminApi.saveImageBedSettings(settingsInput, "local-test-token"), {
    available: true, ...settingsInput
  });
  assert.deepEqual(calls, [{ method: "PUT", body: JSON.stringify(settingsInput) }]);
  assert.deepEqual(timers, [12_000]);
});

test("image bed lost save responses confirm once using the server's normalized fields", async (t) => {
  const cases = [
    settingsInput,
    {
      ...settingsInput,
      baseUrl: " image.example:443/root?ignored=true#fragment ",
      channelName: ` ${"名称".repeat(50)} `,
      uploadFolder: " \\photos\\2026\\ "
    },
    {
      ...settingsInput,
      baseUrl: "HTTPS://fake-user:fake-password@IMAGE.EXAMPLE:443/root?query=yes#fragment",
      uploadChannel: "unknown-channel",
      uploadNameType: "unknown-type",
      uploadFolder: "a".repeat(210)
    },
    { ...settingsInput, enabled: false, baseUrl: " ", uploadFolder: "///" }
  ];

  for (const [index, input] of cases.entries()) {
    await t.test(`normalization ${index + 1}`, async (t) => {
      const env = { DB: createSettingsDatabase(), IMGBED_TOKEN: input.enabled ? "local-test-token" : "" };
      let saved;
      const { calls, timers } = mockSettingsRequests(t, async (init) => {
        if (init.method === "PUT") {
          saved = await service.saveImageBedSettings(env, JSON.parse(init.body));
          return stallUntilAbort(init.signal);
        }
        return Response.json({ settings: await service.getImageBedSettings(env) });
      });

      const recovered = await adminApi.saveImageBedSettings(input, "local-test-token");
      assert.deepEqual(recovered, saved);
      assert.equal(recovered.available, input.enabled);
      assert.deepEqual(calls, [
        { method: "PUT", body: JSON.stringify(input) },
        { method: "GET", body: undefined }
      ]);
      assert.deepEqual(timers, [12_000, 400, 3_000]);
    });
  }
});

test("image bed confirmation checks every field written by the save", async (t) => {
  const mismatches = {
    enabled: false,
    baseUrl: "https://old-image.example/",
    uploadChannel: "s3",
    channelName: "other-channel",
    uploadNameType: "origin",
    uploadFolder: "other-folder"
  };
  for (const [field, value] of Object.entries(mismatches)) {
    await t.test(field, async (t) => {
      const { calls } = mockSettingsRequests(t, (init) => init.method === "PUT"
        ? stallUntilAbort(init.signal)
        : Response.json({ settings: { available: true, ...settingsInput, [field]: value } })
      );
      await assert.rejects(
        adminApi.saveImageBedSettings(settingsInput, "local-test-token"),
        assertOriginalWriteTimeout
      );
      assert.deepEqual(calls.map(({ method }) => method), ["PUT", "GET"]);
    });
  }
});

test("image bed failed confirmation reads preserve the write timeout without retrying", async (t) => {
  const failures = {
    "HTTP 500": () => Response.json({ error: "read failed" }, { status: 500 }),
    "network failure": () => { throw new TypeError("Failed to fetch"); },
    "invalid JSON": () => new Response("not json"),
    "read timeout": (init) => stallUntilAbort(init.signal)
  };
  for (const [name, failRead] of Object.entries(failures)) {
    await t.test(name, async (t) => {
      const { calls, timers } = mockSettingsRequests(t, (init) => init.method === "PUT"
        ? stallUntilAbort(init.signal)
        : failRead(init)
      );
      await assert.rejects(
        adminApi.saveImageBedSettings(settingsInput, "local-test-token"),
        assertOriginalWriteTimeout
      );
      assert.deepEqual(calls.map(({ method }) => method), ["PUT", "GET"]);
      assert.deepEqual(timers, [12_000, 400, 3_000]);
    });
  }
});

test("image bed invalid targets cannot be confirmed as a successful default configuration", async (t) => {
  const env = { DB: createSettingsDatabase(), IMGBED_TOKEN: "local-test-token" };
  const defaults = await service.getImageBedSettings(env);
  const { available: _available, ...emptyInput } = defaults;
  for (const input of [
    { ...emptyInput, baseUrl: "javascript:alert(1)" },
    { ...emptyInput, baseUrl: `https://image.example/${"a".repeat(2050)}` },
    { ...emptyInput, enabled: true },
    { ...emptyInput, uploadFolder: "a/../b" },
    { ...emptyInput, uploadFolder: "a//b" }
  ]) {
    await t.test(JSON.stringify(input).slice(0, 100), async (t) => {
      await assert.rejects(service.saveImageBedSettings(env, input));
      const { calls } = mockSettingsRequests(t, (init) => init.method === "PUT"
        ? stallUntilAbort(init.signal)
        : Response.json({ settings: defaults })
      );
      await assert.rejects(
        adminApi.saveImageBedSettings(input, "local-test-token"),
        assertOriginalWriteTimeout
      );
      assert.deepEqual(calls.map(({ method }) => method), ["PUT", "GET"]);
    });
  }
});

test("image bed rejected saves keep the server error without a confirmation read", async (t) => {
  const { calls, timers } = mockSettingsRequests(t, () => Response.json(
    { error: "invalid settings", code: "IMAGE_BED_URL_INVALID" }, { status: 400 }
  ));
  await assert.rejects(
    adminApi.saveImageBedSettings(settingsInput, "local-test-token"),
    (error) => error.code === "IMAGE_BED_URL_INVALID" && error.status === 400
  );
  assert.deepEqual(calls.map(({ method }) => method), ["PUT"]);
  assert.deepEqual(timers, [12_000]);
});

test("shared image validation accepts supported files up to 10 MB", () => {
  assert.equal(validation.ADMIN_IMAGE_UPLOAD_MAX_BYTES, 10 * 1024 * 1024);
  assert.equal(
    validation.getAdminImageUploadValidationCode(
      createFile(validation.ADMIN_IMAGE_UPLOAD_MAX_BYTES)
    ),
    ""
  );
  assert.equal(
    validation.getAdminImageUploadValidationCode(createFile(1, "text/plain")),
    "IMAGE_FILE_INVALID"
  );
  assert.equal(
    validation.getAdminImageUploadValidationCode(
      createFile(validation.ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1)
    ),
    "IMAGE_FILE_TOO_LARGE"
  );
});

test("image bed settings default to disabled and never expose or store the token", async () => {
  const database = createSettingsDatabase();
  const token = "private-image-bed-token";
  const env = { DB: database, IMGBED_TOKEN: token };
  const defaults = await service.getImageBedSettings(env);

  assert.equal(defaults.available, true);
  assert.equal(defaults.enabled, false);
  assert.doesNotMatch(JSON.stringify(defaults), new RegExp(token));

  const saved = await service.saveImageBedSettings(env, {
    enabled: true,
    baseUrl: "https://img.example.com/root",
    uploadChannel: "cfr2",
    channelName: "main",
    uploadNameType: "short",
    uploadFolder: "htools/images"
  });
  assert.equal(saved.enabled, true);
  assert.equal(saved.baseUrl, "https://img.example.com/root/");
  assert.equal(saved.uploadNameType, "short");
  assert.doesNotMatch(database.value, new RegExp(token));
});

test("invalid image bed URLs fail explicitly even while the service is disabled", async () => {
  await assert.rejects(
    () => service.saveImageBedSettings(
      { DB: createSettingsDatabase(), IMGBED_TOKEN: "token" },
      {
        enabled: false,
        baseUrl: "javascript:alert(1)",
        uploadChannel: "telegram",
        channelName: "",
        uploadNameType: "default",
        uploadFolder: ""
      }
    ),
    (error) => error?.code === "IMAGE_BED_URL_INVALID"
  );
});

test("image upload enforces configuration, file type, size, and ImgBed request contract", async () => {
  const enabledSettings = JSON.stringify({
    enabled: true,
    baseUrl: "https://img.example.com/root/",
    uploadChannel: "telegram",
    channelName: "main",
    uploadNameType: "index",
    uploadFolder: "htools/images"
  });
  const disabledSettings = JSON.stringify({
    enabled: false,
    baseUrl: "https://img.example.com/",
    uploadChannel: "telegram",
    channelName: "",
    uploadFolder: ""
  });

  await assert.rejects(
    () => service.uploadImageToImageBed(
      { DB: createSettingsDatabase(enabledSettings) },
      createFile(1)
    ),
    (error) => error?.code === "IMAGE_BED_NOT_CONFIGURED"
  );
  await assert.rejects(
    () => service.uploadImageToImageBed(
      { DB: createSettingsDatabase(disabledSettings), IMGBED_TOKEN: "token" },
      createFile(1)
    ),
    (error) => error?.code === "IMAGE_BED_DISABLED"
  );
  await assert.rejects(
    () => service.uploadImageToImageBed(
      { DB: createSettingsDatabase(enabledSettings), IMGBED_TOKEN: "token" },
      createFile(1, "text/plain")
    ),
    (error) => error?.code === "IMAGE_FILE_INVALID"
  );
  await assert.rejects(
    () => service.uploadImageToImageBed(
      { DB: createSettingsDatabase(enabledSettings), IMGBED_TOKEN: "token" },
      createFile(validation.ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1)
    ),
    (error) => error?.code === "IMAGE_FILE_TOO_LARGE"
  );

  const originalFetch = globalThis.fetch;
  let capturedUrl;
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = new URL(url);
    capturedInit = init;
    return Response.json([{ src: "/file/test.png", publicUrl: "https://cdn.example/test.png" }]);
  };
  try {
    const result = await service.uploadImageToImageBed(
      { DB: createSettingsDatabase(enabledSettings), IMGBED_TOKEN: "secret-token" },
      createFile(32)
    );
    assert.equal(result.url, "https://cdn.example/test.png");
    assert.equal(capturedUrl.pathname, "/root/upload");
    assert.equal(capturedUrl.searchParams.get("returnFormat"), "full");
    assert.equal(capturedUrl.searchParams.get("uploadChannel"), "telegram");
    assert.equal(capturedUrl.searchParams.get("channelName"), "main");
    assert.equal(capturedUrl.searchParams.get("uploadNameType"), "index");
    assert.equal(capturedUrl.searchParams.get("uploadFolder"), "htools/images");
    assert.equal(new Headers(capturedInit.headers).get("Authorization"), "Bearer secret-token");
    assert.ok(capturedInit.body instanceof FormData);
    assert.ok(capturedInit.body.get("file") instanceof File);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin service settings and all three image fields reuse the shared upload path", async () => {
  const [admin, card, component, settingsEndpoint, uploadEndpoint, backup, publicApp] =
    await Promise.all([
      read("../../src/AdminApp.tsx"),
      read("../../src/components/admin-settings/ImageBedSettingsCard.tsx"),
      read("../../src/components/AdminImageUploadButton.tsx"),
      read("../../functions/api/admin/image-bed-settings.ts"),
      read("../../functions/api/admin/image-upload.ts"),
      read("../../functions/api/admin/backup.ts"),
      read("../../src/App.tsx")
    ]);

  assert.equal((admin.match(/<AdminImageUploadButton\b/g) ?? []).length, 3);
  assert.match(card, /getAdminLoadingProps\(loading && !loadError\)/);
  assert.match(card, /<AdminSkeletonLines loading=\{loading && !loadError\} \/>/);
  assert.doesNotMatch(card, /AdminSettingsFieldSkeleton/);
  for (const type of ["default", "index", "origin", "short"]) {
    assert.match(card, new RegExp(`\\b${type}\\b`));
  }
  assert.match(component, /getAdminImageUploadValidationCode\(file\)/);
  assert.match(settingsEndpoint, /requireAdmin\(request, env\)/);
  assert.ok(
    uploadEndpoint.indexOf("requireAdmin(request, env)") <
      uploadEndpoint.indexOf("request.formData()")
  );
  assert.match(backup, /"image_bed_settings"/);
  assert.doesNotMatch(backup, /IMGBED_TOKEN/);
  assert.doesNotMatch(publicApp, /ImageBedSettingsCard|AdminImageUploadButton/);
});
