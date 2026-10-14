import type { SummaryCard, SummaryChange, SummaryTone } from '@cl/schemas'
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

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

const CHANGE_ICONS: Readonly<Record<SummaryChange['direction'], LucideIcon>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

/** "↗ 12% vs FY 2025–26 To Date", green when the move is good and red when it is bad. */
function ChangeLine({ change }: { change: SummaryChange }) {
  const Icon = CHANGE_ICONS[change.direction]
  return (
    <dd className={cn('flex items-center gap-1.5 text-sm font-bold', TONE_CLASS[change.tone])}>
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>
        <span className="sr-only">{change.direction === 'up' ? 'Up ' : change.direction === 'down' ? 'Down ' : ''}</span>
        {change.label}
      </span>
    </dd>
  )
}

/** A row of figure cards (Billed, Received, Pending…) for a client or company's financial year. */
export function SummaryCards({ label, cards, isLoading, error, onRetry }: SummaryCardsProps) {
  if (isLoading) return <Spinner />
  if (error) return <LoadError error={error} onRetry={onRetry} />
  if (!cards) return null
  return (
    <section aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-4">
      {cards.map(({ label: cardLabel, value, note, tone, change }) => (
        <dl key={cardLabel} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
          <dt className="text-lg font-bold text-foreground">{cardLabel}</dt>
          <dd className={cn('text-2xl font-black tracking-tight tabular-nums', TONE_CLASS[tone])}>{value}</dd>
          {note && <dd className="text-[15px] text-muted-foreground">{note}</dd>}
          {change && <ChangeLine change={change} />}
        </dl>
      ))}
    </section>
  )
}
