import { ACCOUNT_STATUS_LABELS, type AccountStatus } from '@cl/schemas'

import { cn } from '@/lib/utils'

// Status pill styles from the mock; semantic tokens, so each works in both themes.
const STATUS_BADGE: Readonly<Record<AccountStatus, string>> = {
  OVERDUE: 'bg-destructive/10 text-destructive',
  SETTLED: 'bg-success/10 text-success',
  IN_CREDIT: 'bg-brand/10 text-brand',
}

/** Where an account stands as a pill: Overdue, Settled or In Credit. */
export function AccountStatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full px-3 py-1 text-[11px] font-black tracking-wide whitespace-nowrap uppercase',
        STATUS_BADGE[status],
        className,
      )}
    >
      {ACCOUNT_STATUS_LABELS[status]}
    </span>
  )
}
