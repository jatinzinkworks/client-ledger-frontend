import { useOverviewMonthly, type MonthlyTrend } from '@cl/api'
import {
  financialYearLabel,
  formatInr,
  isFutureMonth,
  monthAxisLabel,
  monthTitle,
  monthlyMax,
  monthlyTotals,
  shareOf,
} from '@cl/schemas'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { OverviewPanel } from './OverviewPanel'

// The two series, from the validated chart tokens; the legend and readout name them too.
const SERIES = [
  { key: 'billed', label: 'Billed', swatch: 'bg-chart-billed' },
  { key: 'received', label: 'Received', swatch: 'bg-chart-received' },
] as const

const Legend = () => (
  <div className="flex gap-4 text-sm text-muted-foreground">
    {SERIES.map(({ key, label, swatch }) => (
      <span key={key} className="flex items-center gap-1.5">
        <span aria-hidden className={cn('size-2.5 rounded-full', swatch)} />
        {label}
      </span>
    ))}
  </div>
)

/**
 * The hovered month's figures, floating over its column. Columns near either edge anchor it to
 * that side so it never spills out of the chart.
 */
function MonthTooltip({ month, index, count }: { month: MonthlyTrend; index: number; count: number }) {
  const shift = index < 2 ? '0%' : index >= count - 2 ? '-100%' : '-50%'
  const anchor = index < 2 ? index / count : index >= count - 2 ? (index + 1) / count : (index + 0.5) / count
  const rows = [
    ...SERIES.map(({ key, label, swatch }) => ({ label, value: month[key] ?? 0, swatch })),
    { label: 'Discount', value: month.discount ?? 0, swatch: undefined },
  ]
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-6 z-10 flex min-w-48 flex-col gap-1.5 rounded-md border border-border bg-popover p-3 text-sm text-popover-foreground shadow-md"
      style={{ left: `${anchor * 100}%`, transform: `translateX(${shift})` }}
    >
      <span className="font-bold">{monthTitle(month.month)}</span>
      {rows.map(({ label, value, swatch }) => (
        <span key={label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden className={cn('size-2.5 rounded-full', swatch ?? 'bg-transparent')} />
            {label}
          </span>
          <span className="font-bold tabular-nums">{formatInr(value)}</span>
        </span>
      ))}
    </div>
  )
}

/** The whole year's figures, above the chart. */
function Readout({ title, billed, received }: { title: string; billed: number; received: number }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-6 pb-3 text-sm">
      <span className="font-bold">{title}</span>
      <span className="text-muted-foreground">
        Billed <span className="font-bold text-foreground tabular-nums">{formatInr(billed)}</span>
      </span>
      <span className="text-muted-foreground">
        Received <span className="font-bold text-foreground tabular-nums">{formatInr(received)}</span>
      </span>
    </div>
  )
}

/** One month: billed and received side by side, from a shared baseline; a hit target the column's full height. */
function MonthColumn({
  month,
  max,
  active,
  onActivate,
  onDeactivate,
}: {
  month: MonthlyTrend
  max: number
  active: boolean
  onActivate: () => void
  onDeactivate: () => void
}) {
  const future = isFutureMonth(month.month)
  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`${monthTitle(month.month)}: Billed ${formatInr(month.billed ?? 0)}, Received ${formatInr(month.received ?? 0)}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      className={cn(
        'flex h-full flex-1 cursor-default items-end justify-center gap-0.5 rounded-t-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active && 'bg-muted/60',
        future && 'opacity-40',
      )}
    >
      {SERIES.map(({ key, swatch }) => (
        <span
          key={key}
          className={cn('w-full max-w-4 rounded-t-[4px]', swatch)}
          // A sliver for a month with a little, nothing for none.
          style={{ height: month[key] ? `max(2px, ${shareOf(month[key], max) * 100}%)` : 0 }}
        />
      ))}
    </div>
  )
}

/** Billed and received in each month of the year, April first, with a readout of the hovered month. */
export function MonthlyTrendChart({ financialYear }: { financialYear: string }) {
  const { months, isLoading, error, refetch } = useOverviewMonthly(financialYear)
  const [active, setActive] = useState<number>()
  const list = months ?? []
  const max = monthlyMax(list)
  const totals = monthlyTotals(list)
  const hovered = active != null ? list[active] : undefined

  return (
    <OverviewPanel
      title="Billed And Received By Month"
      hint={financialYearLabel(financialYear)}
      actions={<Legend />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {months && (
        <>
          <Readout title="Whole Year" billed={totals.billed} received={totals.received} />
          <div className="flex flex-1 flex-col gap-2 px-6 pb-6" onMouseLeave={() => setActive(undefined)}>
            <div className="relative flex flex-1 flex-col">
              {/* The scale: the largest month at the top, recessive. */}
              <span className="absolute -top-1 right-0 text-xs text-muted-foreground tabular-nums">{formatInr(max)}</span>
              <div className="flex min-h-52 flex-1 items-end gap-1 border-b border-border pt-5">
                {list.map((month, index) => (
                  <MonthColumn
                    key={month.month}
                    month={month}
                    max={max}
                    active={active === index}
                    onActivate={() => setActive(index)}
                    onDeactivate={() => setActive(undefined)}
                  />
                ))}
              </div>
              {hovered && active != null && <MonthTooltip month={hovered} index={active} count={list.length} />}
            </div>
            <div aria-hidden className="flex gap-1">
              {list.map((month) => (
                <span key={month.month} className="flex-1 text-center text-xs text-muted-foreground">
                  {monthAxisLabel(month.month)}
                </span>
              ))}
            </div>
          </div>
          {/* The same figures as a table, for screen readers. */}
          <table className="sr-only">
            <caption>Billed And Received By Month, {financialYearLabel(financialYear)}</caption>
            <thead>
              <tr>
                <th>Month</th>
                <th>Billed</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {list.map((month) => (
                <tr key={month.month}>
                  <td>{monthTitle(month.month)}</td>
                  <td>{formatInr(month.billed ?? 0)}</td>
                  <td>{formatInr(month.received ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </OverviewPanel>
  )
}
