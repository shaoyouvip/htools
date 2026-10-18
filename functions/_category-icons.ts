import {
  CATEGORY_ICON_SCOPES,
  MAX_CATEGORY_ICONS_PER_SCOPE,
  MAX_CATEGORY_ICON_SETTINGS_BYTES,
  createEmptyCategoryIconSettings,
  isEditableCategoryIconCategory,
  normalizeCategoryIcon,
  normalizeCategoryIconSettings,
  type CategoryIcon,
  type CategoryIconSettings
} from "../src/category-icon-settings";
import { getDatabase, InvalidRequestError, type AdminCategoryScope, type Env } from "./_shared";

export const CATEGORY_ICONS_KEY = "category_icons";

export class CategoryIconCapacityError extends InvalidRequestError {
  constructor() {
    super("category icon settings exceed the capacity limit.");
    this.name = "CategoryIconCapacityError";
  }
}

export function parseCategoryIconSettings(value: string): CategoryIconSettings {
  try {
    return normalizeCategoryIconSettings(JSON.parse(value) as unknown);
  } catch {
    return createEmptyCategoryIconSettings();
  }
}

export async function getCategoryIconSettings(env: Env): Promise<CategoryIconSettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(CATEGORY_ICONS_KEY).first<{ value: string }>();
  return row ? parseCategoryIconSettings(row.value) : createEmptyCategoryIconSettings();
}

export function readCategoryIconUpdate(payload: unknown): {
  scope: AdminCategoryScope;
  category: string;
  icon: CategoryIcon | null;
} {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new InvalidRequestError("category icon settings are invalid.");
  }
  const input = payload as Record<string, unknown>;
  if (typeof input.scope !== "string" || !(CATEGORY_ICON_SCOPES as readonly string[]).includes(input.scope)) {
    throw new InvalidRequestError("category scope is invalid.");
  }
  const category = typeof input.category === "string" ? input.category.trim() : "";
  if (!isEditableCategoryIconCategory(category)) {
    throw new InvalidRequestError("category is invalid.");
  }
  const icon = normalizeCategoryIcon(input.icon);
  if (input.icon !== null && !icon) {
    throw new InvalidRequestError("category icon is invalid.");
  }
  return { scope: input.scope as AdminCategoryScope, category, icon };
}

export async function saveCategoryIconSettings(env: Env, payload: unknown): Promise<CategoryIconSettings> {
  const { scope, category, icon } = readCategoryIconUpdate(payload);
  const db = await getDatabase(env);
  const patch = JSON.stringify({ [scope]: { [category]: icon } });
  const scopePath = `$.${scope}`;
  // 只补丁本次分类；并发修改其他分类或分区不会被整份旧设置覆盖。
  const row = await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, json_patch('{}', ?), CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = json_patch(CASE WHEN json_valid(app_settings.value) THEN app_settings.value ELSE '{}' END, ?),
       updated_at = CURRENT_TIMESTAMP
     WHERE ? = 1 OR (
       ((SELECT COUNT(*) FROM json_each(CASE WHEN json_valid(app_settings.value) THEN app_settings.value ELSE '{}' END, ?)) < ${MAX_CATEGORY_ICONS_PER_SCOPE}
         OR EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(app_settings.value) THEN app_settings.value ELSE '{}' END, ?) WHERE key = ?))
       AND length(CAST(json_patch(CASE WHEN json_valid(app_settings.value) THEN app_settings.value ELSE '{}' END, ?) AS BLOB)) <= ${MAX_CATEGORY_ICON_SETTINGS_BYTES}
     )
     RETURNING value`
  ).bind(CATEGORY_ICONS_KEY, patch, patch, icon === null ? 1 : 0, scopePath, scopePath, category, patch)
    .first<{ value: string }>();
  if (!row) throw new CategoryIconCapacityError();
  return parseCategoryIconSettings(row.value);
}

export async function removeCategoryIcon(env: Env, scope: AdminCategoryScope, category: string) {
  if (!isEditableCategoryIconCategory(category)) return;
  const db = await getDatabase(env);
  await db.prepare(
    `UPDATE app_settings SET
       value = json_patch(CASE WHEN json_valid(value) THEN value ELSE '{}' END, ?),
       updated_at = CURRENT_TIMESTAMP
     WHERE key = ?`
  ).bind(JSON.stringify({ [scope]: { [category]: null } }), CATEGORY_ICONS_KEY).run();
}
