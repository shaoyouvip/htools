import { CategoryIconCapacityError, getCategoryIconSettings, saveCategoryIconSettings } from "../../_category-icons";
import { invalidatePublicApiCache, json, jsonError, requireAdmin, writeErrorResponse, type Env } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  try {
    return json({ icons: await getCategoryIconSettings(env) });
  } catch (error) {
    return writeErrorResponse(error, "Unable to load category icons.");
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  try {
    const icons = await saveCategoryIconSettings(env, await request.json());
    await invalidatePublicApiCache(env);
    return json({ icons });
  } catch (error) {
    if (error instanceof CategoryIconCapacityError) {
      return jsonError(error.message, "CATEGORY_ICONS_CAPACITY", { status: 400 });
    }
    return writeErrorResponse(error, "Unable to save category icon.");
  }
};
