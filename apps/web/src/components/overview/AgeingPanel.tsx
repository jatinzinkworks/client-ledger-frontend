import { useReceivablesAgeing } from '@cl/api'
import {
  NO_AGEING,
  ageingBucketLabel,
  ageingOverdueNote,
  companyCountLabel,
  formatApiDate,
  formatInr,
  percentLabel,
  shareOf,
} from '@cl/schemas'

import { cn } from '@/lib/utils'

import { OverviewPanel } from './OverviewPanel'

/** One hue, darker the longer it has been due (newest range first, as the API lists them). */
const BUCKET_SHADES = ['bg-destructive/25', 'bg-destructive/45', 'bg-destructive/70', 'bg-destructive'] as const
const shade = (index: number) => BUCKET_SHADES[Math.min(index, BUCKET_SHADES.length - 1)]

/** What the firm is owed by how long it has been due: a split bar, then each range with its companies. */
export function AgeingPanel() {
  const { ageing, isLoading, error, refetch } = useReceivablesAgeing()
  const buckets = ageing?.buckets ?? []
  const total = ageing?.total ?? 0
  return (
    <OverviewPanel
      title="How Long It Has Been Due"
      hint={ageing && `As Of ${formatApiDate(ageing.asOf)} · ${companyCountLabel(ageing.companyCount)} Owe`}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {ageing &&
        (total <= 0 ? (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">{NO_AGEING}</p>
        ) : (
          <div className="flex flex-col gap-5 px-6 pb-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Owed</span>
                <span className="text-3xl font-black tracking-tight tabular-nums">{formatInr(total)}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-xl font-black text-destructive tabular-nums">{formatInr(ageing.overdue ?? 0)} Overdue</span>
                <span className="text-[13px] text-muted-foreground">{ageingOverdueNote(ageing)}</span>
              </div>
            </div>

            {/* Each range's share of what is owed, 2px apart; the list below gives the figures. */}
            <div aria-hidden className="flex h-3 gap-0.5">
              {buckets.map((bucket, index) =>
                bucket.amount ? (
                  <span
                    key={bucket.label}
                    className={cn('rounded-full', shade(index))}
                    style={{ width: `${shareOf(bucket.amount, total) * 100}%` }}
                    title={`${ageingBucketLabel(bucket)}: ${formatInr(bucket.amount)}`}
                  />
                ) : null,
              )}
            </div>

            <dl className="flex flex-col divide-y divide-border">
              {buckets.map((bucket, index) => (
                <div key={bucket.label} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden className={cn('size-3 shrink-0 rounded-full', shade(index))} />
                  <dt className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold">{ageingBucketLabel(bucket)}</span>
                    <span className="text-[13px] text-muted-foreground">{companyCountLabel(bucket.companyCount)}</span>
                  </dt>
                  <dd className="flex flex-col items-end">
                    <span className="font-bold tabular-nums">{formatInr(bucket.amount ?? 0)}</span>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      {percentLabel(shareOf(bucket.amount, total))}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
    </OverviewPanel>
  )
}
