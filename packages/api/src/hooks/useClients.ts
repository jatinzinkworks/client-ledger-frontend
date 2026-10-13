import { useQueryClient } from '@tanstack/react-query';

import { getListClientsQueryKey, useCreateClient, useListClients } from '../generated/clients/clients';
import type { ClientRequest, ClientSummaryResponse } from '../generated/model';

const fullName = (c: ClientSummaryResponse) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
const byName = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

// The backend orders by last name; screens list clients by full name, A to Z, like managers.
// Module-level so React Query can memoise the selection between renders.
export const sortClientsByName = (clients: ClientSummaryResponse[]) =>
  [...clients].sort((a, b) => byName.compare(fullName(a), fullName(b)));

/**
 * The client list for a screen, shared by web and mobile: every client (the endpoint is not
 * paged) sorted by name, plus onboarding a new client with their companies.
 */
export function useClients() {
  const queryClient = useQueryClient();
  // Every client; the screens filter by manager in memory (the endpoint's managerId param is unused).
  const query = useListClients(undefined, { query: { select: sortClientsByName } });
  const create = useCreateClient({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }) },
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isPending,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    /** A background re-fetch is running (not the first load). */
    isRefreshing: query.isFetching && !query.isPending,
    create: (data: ClientRequest) => create.mutateAsync({ data }),
    creating: create.isPending,
  };
}
