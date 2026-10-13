import type { ClientLedgerStatusResponse, CompanyYearStatus, FinancialYearStatus } from '@cl/api'
import { YEAR_STATUS_LABELS, clientYearsNote, formatInr, yearNote, yearTitle, type YearStatus } from '@cl/schemas'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'
import { StatusPill, type StatusTone } from '@/components/StatusPill'
import { cn } from '@/lib/utils'

const TONE: Readonly<Record<YearStatus, StatusTone>> = { PENDING: 'warning', CARRIED: 'danger', SETTLED: 'success' }

/** A year, or one company's share of it (shown under the year when it is open). */
type Row = { kind: 'year'; year: FinancialYearStatus } | { kind: 'company'; year: FinancialYearStatus; company: CompanyYearStatus }

type Figures = Pick<FinancialYearStatus, 'billed' | 'discount' | 'received' | 'closingBalance' | 'status'>
const figures = (row: Row): Figures => (row.kind === 'year' ? row.year : row.company)
const amount = (value: number | undefined) => formatInr(value ?? 0)

function columns(open: ReadonlySet<string>, toggle: (fy: string) => void): DataColumn<Row>[] {
  return [
    {
      header: 'Financial Year',
      render: (row) =>
        row.kind === 'year' ? (
          <div className="flex items-start gap-2">
            <ChevronDown
              aria-hidden
              className={cn(
                'mt-1 size-4 shrink-0 text-muted-foreground transition-transform',
                !open.has(row.year.financialYear ?? '') && '-rotate-90',
              )}
            />
            <div className="flex flex-col gap-0.5">
              {/* The year is the row's keyboard target; a click anywhere on the row does the same. */}
              <button
                type="button"
                aria-expanded={open.has(row.year.financialYear ?? '')}
                onClick={(event) => {
                  event.stopPropagation()
                  toggle(row.year.financialYear ?? '')
                }}
                className="cursor-pointer text-left text-base font-bold hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {yearTitle(row.year)}
              </button>
              <span className="text-[13px] text-muted-foreground">{yearNote(row.year)}</span>
            </div>
          </div>
        ) : (
          <span className="block pl-6 font-medium">{row.company.companyName}</span>
        ),
    },
    { header: 'Billed', align: 'right', render: (row) => amount(figures(row).billed) },
    {
      header: 'Discount',
      align: 'right',
      render: (row) => <span className="text-success">− {amount(figures(row).discount)}</span>,
    },
    { header: 'Received', align: 'right', render: (row) => amount(figures(row).received) },
    {
      header: 'Closing Balance',
      align: 'right',
      render: (row) => <span className="font-bold">{amount(figures(row).closingBalance)}</span>,
    },
    {
      header: 'Status',
      render: (row) => {
        const status = figures(row).status
        return status ? <StatusPill tone={TONE[status]} label={YEAR_STATUS_LABELS[status]} /> : '—'
      },
    },
  ]
}

interface YearBalancesProps {
  status: ClientLedgerStatusResponse | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

/**
 * Balance By Financial Year on the client page: every year since the client became one, latest
 * first, one row per year; click a year to open its companies.
 */
export function YearBalances({ status, isLoading, error, onRetry }: YearBalancesProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const toggle = (fy: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(fy)) next.add(fy)
      return next
    })

  const rows: Row[] = (status?.years ?? []).flatMap((year) => [
    { kind: 'year' as const, year },
    ...(open.has(year.financialYear ?? '')
      ? (year.companies ?? []).map((company) => ({ kind: 'company' as const, year, company }))
      : []),
  ])

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 px-6 pt-6 pb-4">
        <h2 className="text-2xl font-bold">Balance By Financial Year</h2>
        {status && <p className="text-[15px] text-muted-foreground">{clientYearsNote(status)}. Click A Year To Open It.</p>}
      </div>

      {isLoading && (
        <div className="px-6 pb-6">
          <Spinner />
        </div>
      )}
      {error && (
        <div className="px-6 pb-6">
          <LoadError error={error} onRetry={onRetry} />
        </div>
      )}
      {status &&
        (rows.length ? (
          <DataTable
            columns={columns(open, toggle)}
            rows={rows}
            rowKey={(row) => (row.kind === 'year' ? row.year.financialYear ?? '' : `${row.year.financialYear}/${row.company.companyId}`)}
            onRowClick={(row) => row.kind === 'year' && toggle(row.year.financialYear ?? '')}
          />
        ) : (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">No Ledger Activity Yet.</p>
        ))}
    </section>
  )
}
