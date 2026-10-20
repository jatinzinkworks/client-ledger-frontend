import {
  getListCompanyEntriesQueryKey,
  isNotFound,
  useClient,
  useCompanyLedger,
  useGetEntry,
  type LedgerEntryResponse,
  type LedgerListResponse,
} from '@cl/api';
import { OPENING_BALANCE_LABEL, clientName, isOpeningBalance, isPayment } from '@cl/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { FormScreen } from '@/components/ui/FormScreen';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { companyHref } from '@/utils/routes';

import { EditLedgerEntryForm } from './EditLedgerEntryForm';
import { goBack } from './formHelpers';
import { OpeningBalanceView } from './OpeningBalanceView';
import { RecordPaymentForm } from './RecordPaymentForm';

interface LedgerEntryScreenProps {
  clientId: string;
  companyId: string;
  entryId: string;
}

/**
 * One ledger entry, full screen: a service charge opens Edit Ledger Entry, a payment opens Edit
 * Payment, an opening balance is shown read-only with Delete. The entry is the row just tapped on the company page (its ledger page, fetched since
 * that page opened); opened any other way it is fetched.
 */
export function LedgerEntryScreen({ clientId, companyId, entryId }: LedgerEntryScreenProps) {
  // orval interpolates path params as-is, so encode the ids here.
  const ids = [encodeURIComponent(clientId), encodeURIComponent(companyId)] as const;
  const queryClient = useQueryClient();
  // Read once: the form starts from the entry as it was when the screen opened.
  const [listed] = useState<LedgerEntryResponse | undefined>(() =>
    queryClient
      .getQueriesData<LedgerListResponse>({ queryKey: getListCompanyEntriesQueryKey(...ids) })
      .flatMap(([, list]) => list?.entries ?? [])
      .find((e) => e.id === entryId),
  );
  const fetched = useGetEntry(...ids, encodeURIComponent(entryId), {
    query: { enabled: !listed && !!entryId, retry: false },
  });
  // Never an older cached copy: only what was fetched since the screen opened.
  const entry = listed ?? (fetched.isFetchedAfterMount ? fetched.data : undefined);
  const ledger = useCompanyLedger(clientId, companyId);
  const owner = useClient(clientId);
  const company = owner.companies.find((c) => c.id === companyId);
  const close = () => goBack(companyHref(clientId, companyId));
  const payment = entry && isPayment(entry);
  const opening = entry && isOpeningBalance(entry);

  const body = () => {
    if (!entry && fetched.error) {
      return isNotFound(fetched.error) ? (
        <EmptyState title="Entry Not Found" description="This Entry May Have Been Removed From The Ledger." />
      ) : (
        <LoadError error={fetched.error} onRetry={() => fetched.refetch()} />
      );
    }
    if (!entry || (payment && owner.isLoading)) return <Loading />;
    if (opening) {
      return (
        <OpeningBalanceView
          entry={entry}
          onDelete={() => ledger.deleteEntry(entry.id ?? '')}
          deleting={ledger.deletingEntry}
          onDone={close}
        />
      );
    }
    if (payment) {
      return (
        <RecordPaymentForm
          key={entry.id}
          payment={entry}
          clientName={owner.client ? clientName(owner.client) : ''}
          companies={[{ id: companyId, name: company?.companyName ?? '' }]}
          pendingFor={() => ledger.balance}
          onSave={(_, data) => ledger.updatePayment(entry.id ?? '', data)}
          saving={ledger.updatingPayment}
          onDelete={() => ledger.deleteEntry(entry.id ?? '')}
          deleting={ledger.deletingEntry}
          onDone={close}
        />
      );
    }
    return (
      <EditLedgerEntryForm
        key={entry.id}
        entry={entry}
        onSave={(data) => ledger.updateEntry(entry.id ?? '', data)}
        saving={ledger.updatingEntry}
        onDelete={() => ledger.deleteEntry(entry.id ?? '')}
        deleting={ledger.deletingEntry}
        onDone={close}
      />
    );
  };

  const title = !entry ? 'Ledger Entry' : opening ? OPENING_BALANCE_LABEL : payment ? 'Edit Payment' : 'Edit Ledger Entry';
  return <FormScreen title={title}>{body()}</FormScreen>;
}
