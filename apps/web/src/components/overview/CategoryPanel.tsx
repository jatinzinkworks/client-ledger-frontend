import { useBillingByCategory } from '@cl/api'
import { CATEGORY_LABELS, financialYearLabel, formatInr, percentLabel, servicesCountLabel, shareOf } from '@cl/schemas'

import { OverviewPanel } from './OverviewPanel'

/** The year's billing split across the practice areas: a bar each, with its most billed services. */
export function CategoryPanel({ financialYear }: { financialYear: string }) {
  const { categories, isLoading, error, refetch } = useBillingByCategory(financialYear)
  const list = categories ?? []
  const total = list.reduce((sum, c) => sum + (c.billed ?? 0), 0)
  const max = Math.max(0, ...list.map((c) => c.billed ?? 0))
  return (
    <OverviewPanel
      title="Billing By Practice Area"
      hint={`${financialYearLabel(financialYear)} · Billed After Discount, GST Included.`}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {categories &&
        (total <= 0 ? (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
            Nothing Was Billed In {financialYearLabel(financialYear)}.
          </p>
        ) : (
          <ul className="flex flex-col gap-5 px-6 pb-6">
            {list.map((c) => (
              <li key={c.category} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold">{c.category ? CATEGORY_LABELS[c.category] : ''}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[13px] text-muted-foreground tabular-nums">{percentLabel(shareOf(c.billed, total))}</span>
                    <span className="font-bold tabular-nums">{formatInr(c.billed ?? 0)}</span>
                  </span>
                </div>
                <span aria-hidden className="h-2.5 w-full rounded-full bg-muted">
                  {!!c.billed && (
                    <span
                      className="block h-full rounded-full bg-chart-billed"
                      style={{ width: `max(4px, ${shareOf(c.billed, max) * 100}%)` }}
                    />
                  )}
                </span>
                {!!c.topServices?.length && (
                  <span className="text-[13px] text-muted-foreground">
                    {servicesCountLabel(c.serviceCount ?? 0)} Billed ·{' '}
                    {c.topServices.map((s) => `${s.serviceName} ${formatInr(s.billed ?? 0)}`).join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ))}
    </OverviewPanel>
  )
}
