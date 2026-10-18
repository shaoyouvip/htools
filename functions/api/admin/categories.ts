import {
  getDatabase,
  getAdminCategorySettings,
  InvalidRequestError,
  json,
  jsonError,
  invalidatePublicApiCache,
  requireAdmin,
  saveAdminCategorySettings,
  writeErrorResponse,
  type AdminCategoryScope,
  type Env
} from "../../_shared";
import { deleteTelegramPushCategory } from "../../_telegram";
import { getCategoryIconSettings, removeCategoryIcon } from "../../_category-icons";

const ADMIN_CATEGORY_SCOPES = ["tools", "articles", "push", "content"] as const;
const ADMIN_ALL_CATEGORY = "All";
const ADMIN_FEATURED_CATEGORY = "__admin_featured__";
const TELEGRAM_PUSH_RESOURCE_FILTERS = {
  __telegram_tool__: "tool",
  __telegram_article__: "article",
  __telegram_content__: "content"
} as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const [settings, icons] = await Promise.all([
      getAdminCategorySettings(env), getCategoryIconSettings(env)
    ]);
    return json({
      settings, icons
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load categories.";
    return jsonError(message, "SERVER_ERROR", { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = (await request.json()) as Partial<
      Record<AdminCategoryScope, unknown>
    >;

    const settings = await saveAdminCategorySettings(env, payload);
    await invalidatePublicApiCache(env);
    return json({ settings });
  } catch (error) {
    return writeErrorResponse(error, "Unable to save categories.");
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = (await request.json()) as {
      action?: unknown;
      category?: unknown;
      scope?: unknown;
      targetCategory?: unknown;
    };
    const scope = readCategoryScope(payload.scope);
    const action = payload.action === "delete" ? "delete" : "migrate";
    const category = readCategoryName(payload.category, "category", {
      allowAll: action === "delete",
      allowPushFilter: scope === "push" && action === "delete"
    });
    const targetCategory =
      action === "migrate"
        ? readCategoryName(payload.targetCategory, "targetCategory")
        : "";

    if (category === ADMIN_FEATURED_CATEGORY && action !== "delete") {
      throw new InvalidRequestError("featured category can only be cleared.");
    }

    if (action === "migrate" && targetCategory === category) {
      throw new InvalidRequestError("target category must be different.");
    }

    const db = await getDatabase(env);
    const affected =
      action === "delete"
        ? await deleteCategoryContent(db, scope, category)
        : await migrateCategoryContent(db, scope, category, targetCategory);
    const settings = await updateCategorySettings(
      env,
      scope,
      category,
      action === "migrate" ? targetCategory : ""
    );
    await removeCategoryIcon(env, scope, category);
    const icons = await getCategoryIconSettings(env);
    await invalidatePublicApiCache(env);

    return json({ affected, settings, icons });
  } catch (error) {
    return writeErrorResponse(error, "Unable to update category.");
  }
};

function readCategoryScope(value: unknown): AdminCategoryScope {
  if (
    typeof value === "string" &&
    (ADMIN_CATEGORY_SCOPES as readonly string[]).includes(value)
  ) {
    return value as AdminCategoryScope;
  }

  throw new InvalidRequestError("category scope is invalid.");
}

function readCategoryName(
  value: unknown,
  field: string,
  options: { allowAll?: boolean; allowPushFilter?: boolean } = {}
) {
  if (typeof value !== "string") {
    throw new InvalidRequestError(`${field} is required.`);
  }

  const category = value.trim().slice(0, 48);

  if (!category) {
    throw new InvalidRequestError(`${field} is invalid.`);
  }

  if (options.allowAll && isAllCategory(category)) {
    return ADMIN_ALL_CATEGORY;
  }

  if (options.allowPushFilter && getTelegramPushResourceType(category)) {
    return category;
  }

  if (category !== ADMIN_FEATURED_CATEGORY && isReservedCategory(category)) {
    throw new InvalidRequestError(`${field} is invalid.`);
  }

  return category;
}

function isAllCategory(category: string) {
  const normalized = category.toLowerCase();

  return category === "全部" || normalized === "all";
}

function isReservedCategory(category: string) {
  const normalized = category.toLowerCase();

  return (
    category === "全部" ||
    category === "精选" ||
    normalized === "all" ||
    normalized === "featured" ||
    normalized === "__telegram_tool__" ||
    normalized === "__telegram_article__" ||
    normalized === "__telegram_content__"
  );
}

function getTelegramPushResourceType(category: string) {
  return TELEGRAM_PUSH_RESOURCE_FILTERS[
    category as keyof typeof TELEGRAM_PUSH_RESOURCE_FILTERS
  ];
}

async function updateCategorySettings(
  env: Env,
  scope: AdminCategoryScope,
  category: string,
  targetCategory: string
) {
  const current = await getAdminCategorySettings(env);

  if (isAllCategory(category) || (scope === "push" && getTelegramPushResourceType(category))) {
    return current;
  }

  const nextCategories = current[scope].filter((item) => item !== category);

  if (
    targetCategory &&
    targetCategory !== ADMIN_FEATURED_CATEGORY &&
    !nextCategories.includes(targetCategory)
  ) {
    nextCategories.push(targetCategory);
  }

  return saveAdminCategorySettings(env, {
    [scope]: nextCategories
  });
}

async function migrateCategoryContent(
  db: D1Database,
  scope: AdminCategoryScope,
  category: string,
  targetCategory: string
) {
  if (scope === "tools") {
    if (category === ADMIN_FEATURED_CATEGORY) {
      throw new InvalidRequestError("featured category cannot be migrated.");
    }

    return getChanges(
      await db.prepare("UPDATE tools SET category = ?, updated_at = ? WHERE category = ?")
        .bind(targetCategory, new Date().toISOString(), category)
        .run()
    );
  }

  if (scope === "articles") {
    return getChanges(
      await db.prepare(
        "UPDATE articles SET category = ?, updated_at = ? WHERE category = ?"
      )
        .bind(targetCategory, new Date().toISOString(), category)
        .run()
    );
  }

  if (scope === "push") {
    return getChanges(
      await db.prepare(
        "UPDATE telegram_messages SET category = ? WHERE category = ?"
      ).bind(targetCategory, category).run()
    );
  }

  const now = new Date().toISOString();
  const [sourceResult, itemResult] = await db.batch([
    db.prepare("UPDATE content_sources SET category = ?, updated_at = ? WHERE category = ?")
      .bind(targetCategory, now, category),
    db.prepare("UPDATE content_items SET category = ?, updated_at = ? WHERE category = ?")
      .bind(targetCategory, now, category)
  ]);

  return getChanges(sourceResult) + getChanges(itemResult);
}

async function deleteCategoryContent(
  db: D1Database,
  scope: AdminCategoryScope,
  category: string
) {
  if (scope === "tools") {
    if (isAllCategory(category)) {
      return getChanges(await db.prepare("DELETE FROM tools").run());
    }

    if (category === ADMIN_FEATURED_CATEGORY) {
      return getChanges(
        await db.prepare("UPDATE tools SET featured = 0, updated_at = ? WHERE featured = 1")
          .bind(new Date().toISOString())
          .run()
      );
    }

    return getChanges(
      await db.prepare("DELETE FROM tools WHERE category = ?").bind(category).run()
    );
  }

  if (scope === "articles") {
    if (isAllCategory(category)) {
      await db.prepare("UPDATE content_items SET article_id = NULL").run();

      return getChanges(await db.prepare("DELETE FROM articles").run());
    }

    await db.prepare(
      `UPDATE content_items
       SET article_id = NULL
       WHERE article_id IN (SELECT id FROM articles WHERE category = ?)`
    )
      .bind(category)
      .run();
    return getChanges(
      await db.prepare("DELETE FROM articles WHERE category = ?")
        .bind(category)
        .run()
    );
  }

  if (scope === "push") {
    if (isAllCategory(category)) {
      return deleteTelegramPushCategory(db);
    }

    const resourceType = getTelegramPushResourceType(category);
    if (resourceType) {
      return deleteTelegramPushCategory(db, { resourceType });
    }

    return deleteTelegramPushCategory(db, { category });
  }

  if (isAllCategory(category)) {
    const [itemResult, sourceResult] = await db.batch([
      db.prepare("DELETE FROM content_items"),
      db.prepare("DELETE FROM content_sources")
    ]);

    return getChanges(itemResult) + getChanges(sourceResult);
  }

  const [itemResult, sourceResult] = await db.batch([
    db.prepare(
      `DELETE FROM content_items
       WHERE category = ?
          OR source_id IN (SELECT id FROM content_sources WHERE category = ?)`
    ).bind(category, category),
    db.prepare("DELETE FROM content_sources WHERE category = ?").bind(category)
  ]);

  return getChanges(itemResult) + getChanges(sourceResult);
}

function getChanges(result: { meta?: { changes?: number } }) {
  return Number(result.meta?.changes ?? 0);
}
