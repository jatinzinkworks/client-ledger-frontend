import { useQueryClient } from '@tanstack/react-query';

import { useListClientEntries, useRecordPayment } from '../generated/ledger/ledger';
import type { PaymentRequest } from '../generated/model';
import { freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';
import { refreshLedgers } from './useCompanyLedger';

/**
 * Recording a payment from the client page, for any of the client's companies, with what each
 * company still owes. The balances come from the client ledger's per-company totals; only the
 * summary is needed, so a single entry is fetched.
 */
export function useClientPayments(clientId: string) {
  // orval interpolates path params as-is, so encode the id here.
  const encodedId = encodeURIComponent(clientId);
  const queryClient = useQueryClient();
  const ledger = useListClientEntries(
    encodedId,
    { size: 1 },
    { query: { enabled: !!clientId, retry: retryUnlessNotFound } },
  );
  const pay = useRecordPayment();

  // Only balances fetched since the page opened — never an older cached copy.
  const fresh = freshData(ledger);
  const balances = new Map(
    (fresh?.summary?.byCompany ?? []).map((totals) => [totals.companyId ?? '', totals.balance]),
  );
  return {
    /**
     * What a company still owes (negative when overpaid): 0 once the ledger has loaded and the
     * company has no entries, undefined while it is loading or failed.
     */
    balanceOf: (companyId: string) => (fresh ? (balances.get(companyId) ?? 0) : undefined),
    /** Records a payment received from one of the client's companies. */
    recordPayment: async (companyId: string, data: PaymentRequest) => {
      const encodedCompanyId = encodeURIComponent(companyId);
      const saved = await pay.mutateAsync({ clientId: encodedId, companyId: encodedCompanyId, data });
      await refreshLedgers(queryClient, encodedId, encodedCompanyId);
      return saved;
    },
    recordingPayment: pay.isPending,
  };
}
