import type { QueryClient } from '@tanstack/react-query';

import { getListClientsQueryKey } from '../generated/clients/clients';
import { getListManagersQueryKey } from '../generated/manager-catalog/manager-catalog';
import { getListServicesQueryKey } from '../generated/service-catalog/service-catalog';
import { refreshOverview } from './useOverview';

/**
 * Refreshes everything shown about one client after their details or a company of theirs changes
 * (Edit Client, Edit Company — a discount, an opening balance): every query under
 * `/clients/{clientId}` — the client, their companies and each company page, services, ledgers,
 * year summaries, Balance By Financial Year, payments — plus the figures built from them: the
 * client, manager and service lists and the Overview. `clientId` is the encoded id the query
 * keys hold. Active queries refetch at once; the rest when next shown.
 */
export function refreshClientData(queryClient: QueryClient, clientId: string) {
  const clientPath = `/psc/cl/v1/clients/${clientId}`;
  return Promise.all([
    queryClient.invalidateQueries({
      predicate: (q) => {
        const url = q.queryKey[0];
        return typeof url === 'string' && (url === clientPath || url.startsWith(`${clientPath}/`));
      },
    }),
    ...[getListClientsQueryKey(), getListManagersQueryKey(), getListServicesQueryKey()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
    refreshOverview(queryClient),
  ]);
}
