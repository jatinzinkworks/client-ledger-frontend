import { ACCOUNT_STATUS_LABELS, type AccountStatus } from '@cl/schemas'

import { StatusPill, type StatusTone } from '@/components/StatusPill'

const TONE: Readonly<Record<AccountStatus, StatusTone>> = {
  OVERDUE: 'danger',
  SETTLED: 'success',
  IN_CREDIT: 'brand',
}

/** Where an account stands as a pill: Overdue, Settled or In Credit. */
export function AccountStatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  return <StatusPill tone={TONE[status]} label={ACCOUNT_STATUS_LABELS[status]} className={className} />
}
