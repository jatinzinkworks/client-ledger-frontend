import { ACCOUNT_STATUS_LABELS, accountStatus, type AccountStatus } from '@cl/schemas';

import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';

const TONE: Readonly<Record<AccountStatus, StatusTone>> = {
  OVERDUE: 'danger',
  SETTLED: 'success',
  IN_CREDIT: 'brand',
};

/** Where an account stands, from what is pending: Overdue, Settled or In Credit; nothing when unknown. */
export function AccountStatusBadge({ pending, className }: { pending: number | undefined; className?: string }) {
  const status = accountStatus(pending);
  return status ? <StatusPill tone={TONE[status]} label={ACCOUNT_STATUS_LABELS[status]} className={className} /> : null;
}
