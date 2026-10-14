import { useOverviewRanking, type RankEntry, type RankMeasure, type RankSubject } from '@cl/api'
import {
  PENDING_RANKING_TITLES,
  RANKING_COPY,
  RANK_SUBJECT_OPTIONS,
  formatInr,
  noRankingMessage,
  percentLabel,
  rankEntryNote,
  rankPeriodOptions,
  rankingMax,
  shareOf,
  type RankPeriod,
} from '@cl/schemas'
import { useState } from 'react'
import { Link } from 'react-router'

import { SegmentedControl } from '@/components/SegmentedControl'
import { cn } from '@/lib/utils'
import { clientPath, companyPath } from '@/utils/routes'

import { OverviewPanel } from './OverviewPanel'

/** A ranked client or company opens its page; managers have none. */
function entryPath(subject: RankSubject, e: RankEntry): string | undefined {
  if (subject === 'clients') return clientPath(e.id)
  if (subject === 'companies' && e.clientId && e.companyId) return companyPath(e.clientId, e.companyId)
  return undefined
}

/** The ranked name, linked to its page when it has one, with who it is underneath. */
function EntryName({ subject, entry }: { subject: RankSubject; entry: RankEntry }) {
  const path = entryPath(subject, entry)
  const note = rankEntryNote(subject, entry)
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {path ? (
        <Link to={path} className="truncate font-bold text-foreground hover:underline">
          {entry.name}
        </Link>
      ) : (
        <span className="truncate font-bold">{entry.name}</span>
      )}
      {note && <span className="truncate text-[13px] text-muted-foreground">{note}</span>}
    </div>
  )
}

const RankBadge = ({ rank }: { rank: number }) => (
  <span
    className={cn(
      'inline-flex size-7 items-center justify-center rounded-full text-xs font-black tabular-nums',
      rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
    )}
  >
    {rank}
  </span>
)

/** Who owes most, compact enough for a third of the row: each pending amount over a bar drawn against the largest. */
// Each row is one fixed height (names and notes truncate to one line), so the list can show
// exactly PENDING_ROWS_SHOWN of them and scroll the rest.
const PENDING_ROW_HEIGHT = 84
const PENDING_ROWS_SHOWN = 5

function PendingList({ subject, entries }: { subject: RankSubject; entries: RankEntry[] }) {
  const max = rankingMax(entries, 'pending')
  return (
    <ol
      className="flex flex-col divide-y divide-border overflow-y-auto border-t border-border"
      style={{ maxHeight: PENDING_ROW_HEIGHT * PENDING_ROWS_SHOWN }}
    >
      {entries.map((e) => (
        <li
          key={e.id}
          className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-6 py-3"
          style={{ height: PENDING_ROW_HEIGHT }}
        >
          <RankBadge rank={e.rank} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <EntryName subject={subject} entry={e} />
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-bold text-destructive tabular-nums">{formatInr(e.pending)}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">Of {formatInr(e.billed)}</span>
              </div>
            </div>
            <span
              className="h-1.5 w-full rounded-full bg-muted"
              title={`${formatInr(e.billed)} Billed · ${formatInr(e.received)} Received`}
              aria-hidden
            >
              <span className="block h-full rounded-full bg-destructive/70" style={{ width: `${shareOf(e.pending, max) * 100}%` }} />
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Billed most: one bar each against the largest, green for what was received, red for the rest. */
function BilledBars({ subject, entries }: { subject: RankSubject; entries: RankEntry[] }) {
  const max = rankingMax(entries, 'billed')
  return (
    <div className="flex flex-col gap-4 border-t border-border px-6 pt-4 pb-6">
      <ol className="flex flex-col gap-4">
        {entries.map((e) => {
          const received = shareOf(e.received, e.billed)
          return (
            <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
              <RankBadge rank={e.rank} />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <EntryName subject={subject} entry={e} />
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-bold tabular-nums">{formatInr(e.billed)}</span>
                    <span className="text-[13px] text-muted-foreground tabular-nums">{percentLabel(received)} Received</span>
                  </div>
                </div>
                <div
                  className="flex h-2.5 gap-0.5"
                  style={{ width: `${Math.max(shareOf(e.billed, max) * 100, 2)}%` }}
                  title={`${formatInr(e.received)} Received · ${formatInr(Math.max(e.pending, 0))} Pending`}
                  aria-hidden
                >
                  {received > 0 && <span className="rounded-full bg-success" style={{ width: `${received * 100}%` }} />}
                  {received < 1 && <span className="flex-1 rounded-full bg-destructive/70" />}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="flex gap-5 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-success" />
          Received
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-destructive/70" />
          Pending
        </span>
      </div>
    </div>
  )
}

interface RankingPanelProps {
  measure: RankMeasure
  /** Ranks only this subject, with no Clients / Companies / Managers toggle. */
  subject?: RankSubject
  /** The year the "FY" period means: the app's selected financial year. */
  financialYear: string
  defaultPeriod: RankPeriod
}

/** A ranking of clients, companies or managers by what they owe or were billed, in a year or all years. */
export function RankingPanel({ measure, subject: fixedSubject, financialYear, defaultPeriod }: RankingPanelProps) {
  const [chosenSubject, setSubject] = useState<RankSubject>('clients')
  const subject = fixedSubject ?? chosenSubject
  const [period, setPeriod] = useState<RankPeriod>(defaultPeriod)
  const { entries, isLoading, error, refetch } = useOverviewRanking(
    measure,
    subject,
    period === 'year' ? financialYear : undefined,
  )
  const copy = RANKING_COPY[measure]
  return (
    <OverviewPanel
      title={fixedSubject && measure === 'pending' ? PENDING_RANKING_TITLES[fixedSubject] : copy.title}
      hint={copy.hint}
      actions={
        <>
          {!fixedSubject && (
            <SegmentedControl label="Rank" options={RANK_SUBJECT_OPTIONS} value={subject} onChange={setSubject} />
          )}
          <SegmentedControl label="Period" options={rankPeriodOptions(financialYear)} value={period} onChange={setPeriod} />
        </>
      }
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {entries &&
        (entries.length === 0 ? (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {noRankingMessage(measure, period, financialYear)}
          </p>
        ) : measure === 'pending' ? (
          <PendingList subject={subject} entries={entries} />
        ) : (
          <BilledBars subject={subject} entries={entries} />
        ))}
    </OverviewPanel>
  )
}
