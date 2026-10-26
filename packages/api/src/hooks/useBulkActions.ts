import { useQueryClient } from '@tanstack/react-query';

import { usePostAllDueServices } from '../generated/ledger/ledger';
import { getListManagersQueryKey } from '../generated/manager-catalog/manager-catalog';
import { useSendAllClientLedgerSummaries, useSendPaymentReminders } from '../generated/notifications/notifications';
import { getListServicesQueryKey } from '../generated/service-catalog/service-catalog';
import { refreshOverview } from './useOverview';

/** One bulk run: start it, whether it is running, what it did, or why it failed. */
export interface BulkRun<T> {
  run: () => Promise<T>;
  running: boolean;
  result: T | undefined;
  error: Error | null;
  reset: () => void;
}

const asRun = <T>(m: {
  mutateAsync: () => Promise<T>;
  isPending: boolean;
  data: T | undefined;
  error: unknown;
  reset: () => void;
}): BulkRun<T> => ({
  run: () => m.mutateAsync(),
  running: m.isPending,
  result: m.data,
  error: (m.error as Error | null) ?? null,
  reset: m.reset,
});

/**
 * The firm-wide runs on Settings, shared by web and mobile: payment reminders to every client
 * owing (`POST /notifications/payment-reminders`), every client's ledger summary email
 * (`POST /notifications/ledger-summary-emails`) and posting every company's due services
 * (`POST /ledger-entries/post-due`). Each tries every client or company and lists failures; a
 * 502 from the emails means mail is not set up and nobody was emailed. Posting changes ledgers,
 * so it refreshes every client screen, the service and manager lists and the Overview.
 */
export function useBulkActions() {
  const queryClient = useQueryClient();
  const reminders = useSendPaymentReminders();
  const summaries = useSendAllClientLedgerSummaries();
  const postDue = usePostAllDueServices({
    mutation: {
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({
            predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/psc/cl/v1/clients'),
          }),
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListManagersQueryKey() }),
          refreshOverview(queryClient),
        ]),
    },
  });
  return {
    paymentReminders: asRun(reminders),
    ledgerSummaries: asRun(summaries),
    postDue: asRun(postDue),
  };
}
