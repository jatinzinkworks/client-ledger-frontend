import { BILLING_LABELS, type BillingFrequency } from '@cl/schemas'

import { cn } from '@/lib/utils'

// Billing pill styles from the mock; semantic tokens, so each works in both themes.
const BILLING_BADGE: Readonly<Record<BillingFrequency, string>> = {
  MONTHLY: 'bg-brand/10 text-brand',
  QUARTERLY: 'bg-primary text-primary-foreground',
  ANNUAL: 'bg-muted text-foreground',
  ONE_OFF: 'border border-border text-muted-foreground',
}

/** A service's billing cycle as a pill: Monthly, Quarterly, Annual or One-Off. */
export function BillingBadge({ billing, className }: { billing: BillingFrequency; className?: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide uppercase',
        BILLING_BADGE[billing],
        className,
      )}
    >
      {BILLING_LABELS[billing]}
    </span>
  )
}
