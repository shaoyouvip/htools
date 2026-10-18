import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export async function compileTypescriptModule(
  sourceUrl,
  { importReplacements = {}, transformSource = (source) => source } = {}
) {
  const source = transformSource(await readFile(sourceUrl, "utf8"));
  const replacements = { ...importReplacements };
  const dependencies = [];

  for (const match of source.matchAll(/from\s+["']([^"']*\/(?:category-icon-settings|category-svg))["']/g)) {
    const specifier = match[1];
    if (replacements[specifier]) continue;
    const icons = await compileTypescriptModule(new URL(`${specifier}.ts`, sourceUrl));
    replacements[specifier] = icons.url.href;
    dependencies.push(icons);
  }

  for (const match of source.matchAll(/from\s+["']([^"']*\/_category-icons)["']/g)) {
    const specifier = match[1];
    if (replacements[specifier]) continue;
    let sharedUrl = replacements[specifier.replace(/_category-icons$/, "_shared")];
    if (!sharedUrl) {
      const shared = await compileTypescriptModule(new URL(`${specifier.replace(/_category-icons$/, "_shared")}.ts`, sourceUrl));
      dependencies.push(shared);
      sharedUrl = shared.url.href;
    }
    const icons = await compileTypescriptModule(new URL(`${specifier}.ts`, sourceUrl), {
      importReplacements: { "./_shared": sharedUrl }
    });
    replacements[specifier] = icons.url.href;
    dependencies.push(icons);
  }

  if (
    basename(sourceUrl.pathname) === "_shared.ts" &&
    !replacements["../shared/admin-ai"]
  ) {
    const adminAi = await compileTypescriptModule(
      new URL("../shared/admin-ai.ts", sourceUrl)
    );
    replacements["../shared/admin-ai"] = adminAi.url.href;
    dependencies.push(adminAi);
  }

  if (
    basename(sourceUrl.pathname) === "_shared.ts" &&
    !replacements["../shared/rsshub"]
  ) {
    const rssHub = await compileTypescriptModule(
      new URL("../shared/rsshub.ts", sourceUrl)
    );
    replacements["../shared/rsshub"] = rssHub.url.href;
    dependencies.push(rssHub);
  }

  let compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;

  for (const [specifier, replacement] of Object.entries(replacements)) {
    compiled = compiled.replaceAll(`from "${specifier}"`, `from "${replacement}"`);
    compiled = compiled.replaceAll(`from '${specifier}'`, `from '${replacement}'`);
  }

  const outputPath = join(
    tmpdir(),
    `htools-${basename(sourceUrl.pathname, ".ts")}-${randomUUID()}.mjs`
  );
  await writeFile(outputPath, compiled, "utf8");

  return {
    url: pathToFileURL(outputPath),
    async cleanup() {
      await Promise.all([
        rm(outputPath, { force: true }),
        ...dependencies.map((dependency) => dependency.cleanup())
      ]);
    }
  };
}
