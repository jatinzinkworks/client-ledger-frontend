import { formatDate, formatInr } from '@cl/schemas'

import { FIELD_HINT, FIELD_LABEL } from '@/components/form/fieldStyles'

interface DueScheduleProps {
  dates: readonly Date[]
  /** Total per invoice with GST; omitted while the discount entry is invalid. */
  amount?: number
}

/** The upcoming due dates of the service, each with its total including GST. */
export function DueSchedule({ dates, amount }: DueScheduleProps) {
  if (!dates.length) return null
  const title = dates.length === 1 ? 'Due Date' : `Next ${dates.length} Due Dates`
  return (
    <section aria-label="Payment Schedule" className="flex flex-col gap-1.5">
      <h3 className={FIELD_LABEL}>{title}</h3>
      <ol className="divide-y divide-border rounded-md bg-muted px-1">
        {dates.map((date, i) => (
          <li key={date.getTime()} className="flex items-center gap-3 px-4 py-2.5 text-[15px]">
            <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
            <span className="flex-1">{formatDate(date)}</span>
            {amount != null && <span className="font-bold">{formatInr(amount)}</span>}
          </li>
        ))}
      </ol>
      {amount != null && <p className={FIELD_HINT}>Total Per Invoice, Including GST.</p>}
    </section>
  )
}
