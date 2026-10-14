import { useClient, useClientPayments, useCompanyLedger } from '@cl/api';
import { clientName } from '@cl/schemas';

import { FormScreen } from '@/components/ui/FormScreen';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { clientHref, companyHref } from '@/utils/routes';

import { goBack } from './formHelpers';
import { RecordPaymentForm } from './RecordPaymentForm';

interface RecordPaymentScreenProps {
  clientId: string;
  /** From the company page: that company, fixed. From the client page: omitted, so a Company choice. */
  companyId?: string;
}

/**
 * Record Payment, full screen. For one company its pending amount is the company ledger's
 * balance; for a choice of companies each one's comes from the client ledger — as on web.
 */
export function RecordPaymentScreen({ clientId, companyId }: RecordPaymentScreenProps) {
  const owner = useClient(clientId);
  // Each is idle without its ids, so only the one this screen needs fetches.
  const ledger = useCompanyLedger(clientId, companyId ?? '');
  const payments = useClientPayments(companyId ? '' : clientId);
  const close = () => goBack(companyId ? companyHref(clientId, companyId) : clientHref(clientId));

  const body = () => {
    if (owner.isLoading) return <Loading />;
    if (owner.loadError) return <LoadError error={owner.loadError} onRetry={() => owner.refetch()} />;
    if (!owner.client) return <EmptyState title="Client Not Found" description="This Client May Have Been Removed." />;
    const companies = owner.companies
      .filter((c) => !!c.id && (!companyId || c.id === companyId))
      .map((c) => ({ id: c.id ?? '', name: c.companyName ?? '' }));
    if (!companies.length) return <EmptyState title="Company Not Found" description="This Company May Have Been Removed." />;
    return (
      <RecordPaymentForm
        clientName={clientName(owner.client)}
        companies={companies}
        pendingFor={companyId ? () => ledger.balance : payments.balanceOf}
        onSave={(id, data) => (companyId ? ledger.recordPayment(data) : payments.recordPayment(id, data))}
        saving={companyId ? ledger.recordingPayment : payments.recordingPayment}
        onDone={close}
      />
    );
  };

  return <FormScreen title="Record Payment">{body()}</FormScreen>;
}
