import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

const [adminSource, styles] = await Promise.all([
  readFile(new URL("../../src/AdminApp.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../src/styles.css", import.meta.url), "utf8")
]);

test("mobile admin topbar keeps two stable rows with compact text actions", () => {
  assert.match(adminSource, /admin-create-button[\s\S]*?<Plus size=\{16\}[\s\S]*?admin-create-label-full/);
  assert.match(adminSource, /admin-sort-button[\s\S]*?<ArrowDownUp size=\{16\}[\s\S]*?admin-sort-label-full/);
  assert.match(adminSource, /admin-create-label-compact[\s\S]*?t\.actions\.add/);
  assert.match(adminSource, /admin-sort-label-compact[\s\S]*?shortLabel/);
  assert.match(adminSource, /admin-clear-filter[\s\S]*?<Eraser size=\{16\}[\s\S]*?<span>/);
  assert.match(adminSource, /admin-category-filter-trigger[\s\S]*?<CategoryIcon[^>]*size=\{16\}/);
  assert.match(
    styles,
    /@media \(max-width: 920px\)[\s\S]*?\.admin-topbar-actions\s*\{[\s\S]*?grid-template-columns:\s*auto auto minmax\(0, 1fr\)/
  );
  assert.match(
    styles,
    /\.admin-create-button,\s*\n\s*\.admin-sort-button\s*\{[\s\S]*?width:\s*auto;[\s\S]*?justify-content:\s*center;[\s\S]*?padding-inline:\s*8px;/
  );
  assert.match(styles, /\.admin-create-button svg,\s*\n\s*\.admin-sort-button svg,\s*\n\s*\.admin-clear-filter svg\s*\{[\s\S]*?display:\s*none;/);
  assert.match(styles, /\.admin-create-label-full,\s*\n\s*\.admin-sort-label-full\s*\{[\s\S]*?display:\s*none;/);
  assert.match(styles, /\.admin-create-label-compact,\s*\n\s*\.admin-sort-label-compact\s*\{[\s\S]*?display:\s*inline;/);
  assert.doesNotMatch(styles, /\.admin-sort-label\s*\{\s*position:\s*absolute;/);
  assert.doesNotMatch(styles, /grid-template-columns:\s*auto 40px minmax\(0, 1fr\)/);
  assert.match(styles, /\.admin-filter-row \.admin-category-filter-popover\s*\{[\s\S]*?width:\s*100%;/);
  assert.match(styles, /\.admin-category-select-option > span\s*\{[\s\S]*?text-overflow:\s*ellipsis;/);
  assert.doesNotMatch(styles, /\.admin-filter-row \.admin-category-filter-popover\s*\{[\s\S]*?width:\s*min\(3[26]0px,/);
});
