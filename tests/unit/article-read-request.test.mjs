import assert from "node:assert/strict";
import { after, test } from "node:test";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const client = await compileTypescriptModule(new URL("../../src/api-client.ts", import.meta.url));
const publicBuild = await compileTypescriptModule(new URL("../../src/public-api.ts", import.meta.url), {
  importReplacements: { "./api-client": client.url.href }
});
const adminBuild = await compileTypescriptModule(new URL("../../src/admin-api.ts", import.meta.url), {
  importReplacements: { "./api-client": client.url.href },
  transformSource: (source) => `import { requestJsonWithTimeout } from "./api-client";
    ${source.slice(source.indexOf("export async function loadArticlePreview("), source.indexOf("export async function loadAdminAuthConfig("))}
  `
});
const publicApi = await import(publicBuild.url.href);
const adminApi = await import(adminBuild.url.href);
after(async () => { await publicBuild.cleanup(); await adminBuild.cleanup(); await client.cleanup(); });

for (const [name, address, load, authorized] of [
  ["公开文章", "/api/articles/a%2Fb", (options) => publicApi.loadArticle("a/b", options), false],
  ["文章预览", "/api/admin/articles/preview/a%2Fb", (options) => adminApi.loadArticlePreview("a/b", "test-preview-token", options), true],
  ["订阅预览", "/api/admin/content-items/a%2Fb/preview", (options) => adminApi.loadContentItemArticlePreview("a/b", "test-preview-token", options), true]
]) {
  test(`${name}保留不存在与服务器错误，只有主动重试才再读取`, async (t) => {
    let status = 404;
    let calls = 0;
    const article = { id: "read-test", title: "本地测试" };
    t.mock.method(globalThis, "fetch", async (url, init) => {
      calls += 1;
      assert.equal(url, address);
      assert.equal(init.headers.Authorization, authorized ? "Bearer test-preview-token" : undefined);
      assert.equal(init.method, undefined);
      return status === 200 ? Response.json({ article }) : new Response("Unavailable", { status });
    });
    await assert.rejects(load(), { status: 404 });
    assert.equal(calls, 1);
    status = 503;
    await assert.rejects(load(), { status: 503 });
    assert.equal(calls, 2);
    status = 200;
    assert.deepEqual(await load(), article);
    assert.equal(calls, 3);
  });

  test(`${name}超时结束读取且支持离开页面时取消`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, "fetch", (_url, { signal }) => {
      calls += 1;
      return new Promise((_resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (signal.aborted) abort();
        else signal.addEventListener("abort", abort, { once: true });
      });
    });
    await assert.rejects(load({ timeoutMs: 10 }), { code: "REQUEST_TIMEOUT" });
    assert.equal(calls, 1);
    const controller = new AbortController();
    const pending = load({ signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(calls, 2);
  });
}
