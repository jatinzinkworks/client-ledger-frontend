import { useGetClient } from '../generated/clients/clients';
import { isNotFound } from '../errors';
import { retryUnlessNotFound } from './singletonSetting';

/** One client in full — details, manager name and every company — for the client page. */
export function useClient(id: string) {
  // orval interpolates path params as-is, so encode the id here.
  const query = useGetClient(encodeURIComponent(id), { query: { enabled: !!id, retry: retryUnlessNotFound } });
  const notFound = isNotFound(query.error);
  return {
    client: query.data,
    isLoading: query.isPending && !notFound,
    /** No client carries this id (deleted, or a stale link). */
    notFound,
    loadError: notFound ? null : (query.error as Error | null),
    refetch: query.refetch,
    isRefreshing: query.isFetching && !query.isPending,
  };
}
