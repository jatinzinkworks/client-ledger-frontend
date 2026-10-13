import { useSummarizeClient } from '../generated/ledger/ledger';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * A client's billed / received / pending / discount for one financial year, across all of their
 * companies. Ledger changes refresh it through `refreshLedgers`.
 */
export function useClientLedgerSummary(clientId: string, financialYear: string) {
  // orval interpolates path params as-is, so encode the id here.
  const enabled = !!clientId && !!financialYear;
  const query = useSummarizeClient(encodeURIComponent(clientId), { financialYear }, { query: { enabled, retry: retryUnlessNotFound } });
  return {
    // Only what was fetched since the page opened — never an older cached copy.
    summary: freshData(query),
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
  };
}
