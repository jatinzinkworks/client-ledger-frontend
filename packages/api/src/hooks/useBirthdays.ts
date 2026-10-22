import { useListBirthdays } from '../generated/birthdays/birthdays';

/**
 * The Birthdays screen, shared by web and mobile: every client whose birthday falls in `month`
 * (1 = January … 12 = December), whatever the year, ordered by day then name by the backend. The
 * month is in the query key, so changing it fetches that month. Client changes (add, edit,
 * delete, import) refresh every month's list.
 */
export function useBirthdays(month: number) {
  const query = useListBirthdays({ month });
  return {
    birthdays: query.data ?? [],
    isLoading: query.isPending,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    /** A background re-fetch is running (not the first load). */
    isRefreshing: query.isFetching && !query.isPending,
  };
}
