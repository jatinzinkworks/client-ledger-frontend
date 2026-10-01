import type { CatalogServiceResponse } from '@cl/api'
import {
  BILLING_LABELS,
  CATEGORY_LABELS,
  formatGst,
  formatInr,
  scheduleSummary,
  usageLabel,
  type BillingFrequency,
} from '@cl/schemas'

import { cn } from '@/lib/utils'

// Billing pill styles from the mock; semantic tokens, so each works in both themes.
const BILLING_BADGE: Readonly<Record<BillingFrequency, string>> = {
  MONTHLY: 'bg-brand/10 text-brand',
  QUARTERLY: 'bg-primary text-primary-foreground',
  ANNUAL: 'bg-muted text-foreground',
  ONE_OFF: 'border border-border text-muted-foreground',
}

interface ServiceCardProps {
  service: CatalogServiceResponse
  onSelect: (service: CatalogServiceResponse) => void
}

/** One catalog entry; the whole card opens the editor. */
export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const billing = service.billingFrequency
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-label={`Edit ${service.serviceName}`}
      className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left text-card-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">
          {service.category ? CATEGORY_LABELS[service.category] : ''}
        </span>
        {billing && (
          <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide uppercase', BILLING_BADGE[billing])}>
            {BILLING_LABELS[billing]}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-snug font-bold">{service.serviceName}</h2>
        {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
      </div>

      <div className="mt-auto flex items-baseline gap-2">
        <span className="text-[32px] leading-none font-black tracking-tight tabular-nums">
          {formatInr(service.standardFee ?? 0)}
        </span>
        <span className="text-xs text-muted-foreground">{formatGst(service.gstRatePercent)}</span>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border pt-4 text-sm">
        <span>{usageLabel(service.usedByCompanies)}</span>
        <span className="text-xs text-muted-foreground">{scheduleSummary(billing, service.invoiceSchedule)}</span>
      </div>
    </button>
  )
}
