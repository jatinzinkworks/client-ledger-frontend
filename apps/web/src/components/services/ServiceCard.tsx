import type { CatalogServiceResponse } from '@cl/api'
import { CATEGORY_LABELS, formatGst, formatInr, scheduleSummary, usageLabel } from '@cl/schemas'

import { BillingBadge } from './BillingBadge'

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
      className="flex h-full cursor-pointer flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left text-card-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">
          {service.category ? CATEGORY_LABELS[service.category] : ''}
        </span>
        {billing && <BillingBadge billing={billing} />}
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

      <div className="flex flex-col gap-1 border-t border-border pt-4 text-base">
        <span className="font-medium">{usageLabel(service.usedByCompanies)}</span>
        <span className="text-sm text-muted-foreground">{scheduleSummary(billing, service.invoiceSchedule)}</span>
      </div>
    </button>
  )
}
