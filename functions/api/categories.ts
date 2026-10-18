import {
  PUBLIC_API_CACHE_KEYS,
  cachedPublicJson,
  getAdminCategorySettings,
  getDatabase,
  getPublicApiCacheVersion,
  type Env
} from "../_shared";
import { getCategoryIconSettings } from "../_category-icons";

type CategoryRow = {
  category: string;
  total: number;
  featured_total: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const cacheVersion = await getPublicApiCacheVersion(env);
  return cachedPublicJson(request, async () => {
    const db = await getDatabase(env);
    const [result, settings, icons] = await Promise.all([
      db.prepare(
        `SELECT category, COUNT(*) AS total,
                SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) AS featured_total
         FROM tools
         GROUP BY category
         ORDER BY category ASC`
      ).all<CategoryRow>(),
      getAdminCategorySettings(env),
      getCategoryIconSettings(env)
    ]);

    return {
      categories: result.results,
      settings,
      icons: { tools: icons.tools, articles: icons.articles, push: {}, content: {} }
    };
  }, {
    cacheKey: PUBLIC_API_CACHE_KEYS.categories,
    cacheVersion,
    ttlSeconds: 30,
    waitUntil,
    shouldCache: (data) =>
      Array.isArray((data as { categories?: unknown }).categories) &&
      (data as { categories: unknown[] }).categories.length > 0
  });
};
