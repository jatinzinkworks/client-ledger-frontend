import { useListCategories } from '../generated/service-catalog/service-catalog';

/** Categories change only with a backend release, so one fetch an hour is plenty. */
const CATEGORIES_STALE_MS = 60 * 60 * 1000;

/**
 * The categories a catalog service can belong to (`GET /services/categories`), in the backend's
 * order, for the service editor's Category drop-down. Undefined until loaded, or if it failed.
 */
export function useServiceCategories() {
  const query = useListCategories({ query: { staleTime: CATEGORIES_STALE_MS } });
  return { categories: query.data, isLoading: query.isPending, error: query.error as Error | null };
}
