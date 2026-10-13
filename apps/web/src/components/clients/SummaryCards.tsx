import type { SummaryCard, SummaryTone } from '@cl/schemas'

import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'
import { cn } from '@/lib/utils'

interface SummaryCardsProps {
  /** Names the row for screen readers, e.g. "Summary For FY 2026–27". */
  label: string
  /** The cards to show; undefined until the summary has loaded. */
  cards?: readonly SummaryCard[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

const TONE_CLASS: Readonly<Record<SummaryTone, string>> = {
  default: 'text-foreground',
  positive: 'text-success',
  negative: 'text-destructive',
}

/** A row of figure cards (Billed, Received, Pending…) for a client or company's financial year. */
export function SummaryCards({ label, cards, isLoading, error, onRetry }: SummaryCardsProps) {
  if (isLoading) return <Spinner />
  if (error) return <LoadError error={error} onRetry={onRetry} />
  if (!cards) return null
  return (
    <section aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-4">
      {cards.map(({ label: cardLabel, value, note, tone }) => (
        <dl key={cardLabel} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
          <dt className="text-[15px] text-foreground">{cardLabel}</dt>
          <dd className={cn('text-2xl font-black tracking-tight tabular-nums', TONE_CLASS[tone])}>{value}</dd>
          {note && <dd className="text-[13px] text-muted-foreground">{note}</dd>}
        </dl>
      ))}
    </section>
  )
}
