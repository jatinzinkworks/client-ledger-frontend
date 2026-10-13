import { useClientLedgerStatus } from '../generated/ledger/ledger';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * A client's balance for every financial year since they became one, latest first, each with
 * the same figures per company. Ledger changes refresh it through `refreshLedgers`.
 */
export function useClientYearBalances(clientId: string) {
  const enabled = !!clientId;
  // orval interpolates path params as-is, so encode the id here.
  const query = useClientLedgerStatus(encodeURIComponent(clientId), { query: { enabled, retry: retryUnlessNotFound } });
  return {
    // Only what was fetched since the page opened — never an older cached copy.
    status: freshData(query),
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
  };
}
