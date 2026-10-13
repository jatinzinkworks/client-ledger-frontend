import { useGetManager } from '../generated/manager-catalog/manager-catalog';
import type { ManagerResponse } from '../generated/model';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';
import { sortClientsByName } from './useClients';

// Module-level so React Query can memoise the selection between renders.
const clientsOf = (manager: ManagerResponse) => sortClientsByName(manager.clients ?? []);

/**
 * The clients a manager looks after, as the client list shows them (companies, what each
 * still owes), sorted by name. Only fetching a manager by id carries them.
 */
export function useManagerClients(managerId: string | undefined) {
  const enabled = !!managerId;
  // orval interpolates path params as-is, so encode the id here.
  const query = useGetManager(encodeURIComponent(managerId ?? ''), {
    query: { enabled, retry: retryUnlessNotFound, select: clientsOf },
  });
  return {
    // Only what was fetched since the panel opened — never an older cached copy.
    clients: freshData(query) ?? [],
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}
