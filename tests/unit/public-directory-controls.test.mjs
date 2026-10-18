import assert from "node:assert/strict";
import { after, test } from "node:test";
import { Children, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { compileTypescriptModule } from "../helpers/compile-typescript.mjs";

const compiled = [];
after(async () => Promise.all(compiled.map((module) => module.cleanup())));
async function compile(path, importReplacements = {}, transformSource) {
  const module = await compileTypescriptModule(new URL(`../../src/${path}`, import.meta.url), {
    importReplacements,
    transformSource
  });
  compiled.push(module);
  return module.url.href;
}
const fieldExamples = await compile("admin-field-examples.ts");
const adminHelpers = await compile("admin-helpers.ts");
const localeImports = { "../admin-field-examples": fieldExamples };
const zhUrl = await compile("i18n/zh.ts", localeImports);
const enUrl = await compile("i18n/en.ts", localeImports);
const i18nUrl = await compile("i18n/index.ts", { "./zh": zhUrl, "./en": enUrl });
const articleHelpers = await compile("article-helpers.ts", {
  "lucide-react": import.meta.resolve("lucide-react"),
  "./admin-field-examples": fieldExamples,
  "./admin-helpers": adminHelpers,
  "./i18n": i18nUrl
});
const toolHelpers = await compile("tool-helpers.ts", { "./admin-helpers": adminHelpers });
const categoryIconUrl = await compile("components/CategoryIcon.tsx", {
  "react": import.meta.resolve("react"),
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "lucide-react": import.meta.resolve("lucide-react"),
  "../article-helpers": articleHelpers
}, (source) => ts.transpileModule(source, {
  fileName: "CategoryIcon.tsx",
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
}).outputText);
const controlsUrl = await compile("components/PublicDirectoryControls.tsx", {
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "lucide-react": import.meta.resolve("lucide-react"),
  "./CategoryIcon": categoryIconUrl,
  "../tool-helpers": toolHelpers
}, (source) => ts.transpileModule(source, {
  fileName: "PublicDirectoryControls.tsx",
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
}).outputText);
const { CategoryRail, DirectoryPagination } = await import(controlsUrl);
const { CategoryIcon } = await import(categoryIconUrl);
const { translations } = await import(i18nUrl);
const defaults = {
  currentPage: 1, totalPages: 10, hasNextPage: true, isLoading: false,
  onPageChange() {}, t: translations.zh
};
const pagination = (props = {}) => DirectoryPagination({ ...defaults, ...props });
const buttons = (tree) => Children.toArray(tree.props.children).filter((child) => child.type === "button");
const pageValues = (tree) => buttons(tree).map((button) => button.props.children)
  .filter((value) => typeof value === "number" || value === "...");

test("公共分页保留首页、中间页和末页的页码窗口", () => {
  assert.deepEqual(pageValues(pagination()), [1, 2, 3, 4, 5, "...", 10]);
  assert.deepEqual(pageValues(pagination({ currentPage: 5 })), [1, "...", 4, 5, 6, "...", 10]);
  assert.deepEqual(pageValues(pagination({ currentPage: 6, totalPages: 12 })), [1, "...", 5, 6, 7, "...", 12]);
  assert.deepEqual(pageValues(pagination({ currentPage: 10, hasNextPage: false })), [1, "...", 6, 7, 8, 9, 10]);
  assert.deepEqual(pageValues(pagination({ totalPages: 3 })), [1, 2, 3]);
});

test("总数未知时只显示当前页，以 hasNextPage 决定能否继续", () => {
  const first = pagination({ totalPages: null });
  assert.deepEqual(pageValues(first), [1]);
  assert.equal(buttons(first)[0].props.disabled, true);
  assert.equal(buttons(first).at(-1).props.disabled, false);
  const last = pagination({ totalPages: null, currentPage: 3, hasNextPage: false });
  assert.deepEqual(pageValues(last), [3]);
  assert.equal(buttons(last)[0].props.disabled, false);
  assert.equal(buttons(last).at(-1).props.disabled, true);
});

test("加载期间所有分页按钮禁用，当前页状态保留", () => {
  const pending = buttons(pagination({ currentPage: 6, totalPages: 12, isLoading: true }));
  assert.ok(pending.every((button) => button.props.disabled));
  assert.equal(pending.find((button) => button.props["aria-current"] === "page").props.children, 6);
});

test("上一页、指定页与下一页把实际页码交给原调用方", () => {
  const requests = [];
  const actions = buttons(pagination({ currentPage: 3, onPageChange: (page) => requests.push(page) }));
  actions[0].props.onClick();
  actions.find((button) => button.props.children === 5).props.onClick();
  actions.at(-1).props.onClick();
  assert.deepEqual(requests, [2, 5, 4]);
});

for (const [locale, labels] of [
  ["zh", ["分页", "上一页", "下一页", "第 3 页", "更多页码"]],
  ["en", ["Pagination", "Previous page", "Next page", "Page 3", "More pages"]]
]) {
  test(`${locale} 公共分页渲染导航、箭头、页码与省略号无障碍文案`, () => {
    const html = renderToStaticMarkup(createElement(DirectoryPagination, {
      ...defaults, currentPage: 3, t: translations[locale]
    }));
    for (const label of labels) assert.ok(html.includes(`aria-label="${label}"`), label);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  });
}

test("公共分类栏保留分类标签、选中状态与回调原值", () => {
  const selected = [];
  const rail = CategoryRail({
    activeCategory: "All", categories: ["All", "自定义分类"], categoryIcons: {}, isLoading: false,
    onSelect: (value) => selected.push(value), showSkeletons: false, skeletonItems: 12,
    t: translations.zh
  });
  const actions = buttons(rail);
  assert.deepEqual(actions.map((button) => button.props["aria-pressed"]), [true, false]);
  actions[1].props.onClick();
  assert.deepEqual(selected, ["自定义分类"]);
  const html = renderToStaticMarkup(rail);
  assert.ok(html.includes("全部"));
  assert.ok(html.includes("自定义分类"));
});

test("分类图标覆盖只影响指定分类，未设置与无效设置继续回退", () => {
  const html = renderToStaticMarkup(createElement(CategoryRail, {
    activeCategory: "All", categories: ["All", "自定义分类", "Database", "其他分类"],
    categoryIcons: {
      "自定义分类": { type: "lucide", value: "folder" },
      Database: { type: "lucide", value: "invalid-icon" }
    },
    isLoading: false, onSelect() {}, showSkeletons: false, skeletonItems: 12,
    t: translations.zh
  }));
  assert.equal((html.match(/lucide-folder\b/g) ?? []).length, 1);
  assert.equal((html.match(/lucide-database\b/g) ?? []).length, 1);
  assert.equal((html.match(/lucide-tags\b/g) ?? []).length, 1);
  assert.equal((html.match(/class="category-icon"/g) ?? []).length, 4);
});

test("与对象属性重名的自建分类仍显示原名和默认标签图标", () => {
  const names = ["constructor", "toString", "__proto__"];
  const html = renderToStaticMarkup(createElement(CategoryRail, {
    activeCategory: "All", categories: names, categoryIcons: {},
    isLoading: false, onSelect() {}, showSkeletons: false, skeletonItems: 12,
    t: translations.zh
  }));
  for (const name of names) assert.ok(html.includes(`>${name}</span>`), name);
  assert.equal((html.match(/lucide-tags\b/g) ?? []).length, names.length);
});

for (const [category, expectedIcon] of [
  ["__telegram_tool__", "wrench"],
  ["__telegram_article__", "file-text"],
  ["__telegram_content__", "rss"]
]) {
  test(`消息推送固定来源 ${category} 使用对应入口图标 ${expectedIcon}`, () => {
    const html = renderToStaticMarkup(createElement(CategoryIcon, { category, size: 16 }));
    assert.match(html, new RegExp(`lucide-${expectedIcon}(?:\\s|\")`));
    assert.doesNotMatch(html, /lucide-tags(?:\s|")/);
    assert.match(html, /width="16" height="16"/);
  });
}

test("分类骨架继续按页面指定数量显示，延迟显示期间不闪现分类按钮", () => {
  const props = {
    activeCategory: "All", categories: ["All"], categoryIcons: {}, isLoading: true, onSelect() {},
    showSkeletons: true, t: translations.zh
  };
  for (const skeletonItems of [6, 12]) {
    const html = renderToStaticMarkup(createElement(CategoryRail, { ...props, skeletonItems }));
    assert.equal((html.match(/class="category-item category-item-skeleton"/g) ?? []).length, skeletonItems);
    assert.equal((html.match(/skeleton-shimmer skeleton-line is-long/g) ?? []).length, skeletonItems);
    assert.ok(!html.includes('category-rail-skeleton'));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(!html.includes("<button"));
  }
  const hidden = renderToStaticMarkup(createElement(CategoryRail, {
    ...props, skeletonItems: 12, showSkeletons: false
  }));
  assert.equal(hidden, '<aside class="category-rail"></aside>');
});
