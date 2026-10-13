import { errorMessage, type LedgerEntryResponse } from '@cl/api'
import {
  companyDiscountLabel,
  deleteEntryWarning,
  financialYearLabel,
  formatApiDate,
  formatInr,
  generatedEntriesMessage,
  gstRateLabel,
  isPayment,
  ledgerEntryCountLabel,
  ledgerEntryName,
  noLedgerEntries,
  pageRangeLabel,
  paymentMethodLabel,
} from '@cl/schemas'
import { ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { DeleteButton } from '@/components/DeleteButton'
import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CompanyLedgerProps {
  /** The financial year shown, from the app-wide filter; every year when undefined. */
  financialYear?: string
  entries: readonly LedgerEntryResponse[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  /** The page shown, counting from 0. */
  page: number
  pageSize: number
  pageCount: number
  totalEntries: number
  onPageChange: (page: number) => void
  /** Posts the services that are due; resolves to the entries created. */
  onGenerate: () => Promise<readonly unknown[]>
  generating: boolean
  /** Opens Edit Ledger Entry for a service charge, or Edit Payment for a payment; a click anywhere on the row does the same. */
  onEdit: (entry: LedgerEntryResponse) => void
  onDelete: (entryId: string) => Promise<unknown>
  deleting: boolean
}

const amount = (value: number | undefined) => (value != null ? formatInr(value) : '—')

/** An amount with its rate underneath, e.g. ₹855 over 18%. */
const amountWithRate = (value: number | undefined, rate: string) => (
  <div className="flex flex-col items-end">
    <span>{amount(value)}</span>
    <span className="text-xs text-muted-foreground">{rate}</span>
  </div>
)

/** A service charge's own figure; a payment has none. */
const chargeOnly =
  (render: (e: LedgerEntryResponse) => ReactNode) =>
  (e: LedgerEntryResponse): ReactNode =>
    isPayment(e) ? '—' : render(e)

/** "Bank Transfer · UTR123" under a payment. */
const paymentDetails = (e: LedgerEntryResponse) =>
  [paymentMethodLabel(e.paymentMethod), e.paymentReference].filter(Boolean).join(' · ')

const columns = ({
  onEdit,
  onDelete,
  deleting,
}: Pick<CompanyLedgerProps, 'onEdit' | 'onDelete' | 'deleting'>): readonly DataColumn<LedgerEntryResponse>[] => [
  // The due date of a service charge; the date received of a payment.
  { header: 'Date', align: 'center', render: (e) => <span className="whitespace-nowrap">{formatApiDate(e.dueDate)}</span> },
  {
    header: 'Description',
    render: (e) => (
      <div className="flex flex-col">
        {/* The name is the row's keyboard target. */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(e)
          }}
          aria-label={`Edit ${ledgerEntryName(e)}`}
          className="text-left font-bold text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {isPayment(e) ? 'Payment' : e.serviceName}
        </button>
        {isPayment(e) && (
          <>
            <span className="text-xs text-muted-foreground">{paymentDetails(e)}</span>
            {e.comment && <span className="text-xs whitespace-normal text-muted-foreground">{e.comment}</span>}
          </>
        )}
      </div>
    ),
  },
  { header: 'FY', align: 'center', render: (e) => e.financialYear },
  { header: 'Posted On', align: 'center', render: (e) => <span className="whitespace-nowrap">{formatApiDate(e.entryDate)}</span> },
  { header: 'Fee', align: 'right', render: chargeOnly((e) => amount(e.serviceFee)) },
  {
    header: 'Discount',
    align: 'right',
    render: chargeOnly((e) => amountWithRate(e.discountAmount, companyDiscountLabel(e.discountPercent))),
  },
  { header: 'Taxable', align: 'right', render: chargeOnly((e) => amount(e.taxableAmount)) },
  {
    header: 'GST',
    align: 'right',
    render: chargeOnly((e) => amountWithRate(e.gstAmount, gstRateLabel(e.gstRatePercent))),
  },
  {
    header: 'Total',
    align: 'right',
    // A payment's total is stored negative; show it as an amount received.
    render: (e) =>
      isPayment(e) ? (
        <span className="font-bold whitespace-nowrap text-success">− {amount(Math.abs(e.totalAmount ?? 0))}</span>
      ) : (
        <span className="font-bold whitespace-nowrap">{amount(e.totalAmount)}</span>
      ),
  },
  {
    header: 'Delete',
    hideHeader: true,
    align: 'right',
    render: (e) => (
      // React events bubble out of the dialog's portal too, so stop every click here from
      // reaching the row (which would open Edit Ledger Entry).
      <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
        <DeleteButton
          iconOnly
          label="Delete Entry"
          itemName={ledgerEntryName(e)}
          description={deleteEntryWarning(e)}
          onDelete={() => onDelete(e.id ?? '')}
          deleting={deleting}
        />
      </span>
    ),
  },
]

/**
 * A company's ledger: Generate Service Entries and its service charges and payments, a page at a
 * time. A row opens Edit Ledger Entry (service charge) or Edit Payment (payment).
 */
export function CompanyLedger({
  financialYear,
  entries,
  isLoading,
  error,
  onRetry,
  page,
  pageSize,
  pageCount,
  totalEntries,
  onPageChange,
  onGenerate,
  generating,
  onEdit,
  onDelete,
  deleting,
}: CompanyLedgerProps) {
  // What the last Generate did, or why it failed.
  const [result, setResult] = useState<{ message: string; failed?: boolean }>()

  const generate = async () => {
    setResult(undefined)
    try {
      const created = await onGenerate()
      setResult({ message: generatedEntriesMessage(created.length) })
    } catch (e) {
      setResult({ message: errorMessage(e), failed: true })
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="company-ledger-title">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-baseline gap-4">
          <h2 id="company-ledger-title" className="text-xl font-bold">
            Ledger
          </h2>
          {!isLoading && !error && (
            <span className="text-sm text-muted-foreground">
              {[ledgerEntryCountLabel(totalEntries), financialYear && financialYearLabel(financialYear)]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </div>
        <Button size="touch" onClick={generate} disabled={generating}>
          <ReceiptText /> {generating ? 'Generating…' : 'Generate Service Entries'}
        </Button>
      </div>
      <p role="status" className={cn('px-6 text-sm empty:hidden', result?.failed ? 'pb-4 text-destructive' : 'pb-4 text-success')}>
        {result?.message}
      </p>

      {isLoading && <Spinner className="mx-6 mb-6" />}
      {error && (
        <div className="px-6 pb-6">
          <LoadError error={error} onRetry={onRetry} />
        </div>
      )}
      {!isLoading &&
        !error &&
        (totalEntries ? (
          <>
            <DataTable
              columns={columns({ onEdit, onDelete, deleting })}
              rows={entries}
              rowKey={(e) => e.id ?? `${e.companyServiceId}-${e.dueDate}`}
              onRowClick={onEdit}
            />
            <nav
              aria-label="Ledger Pages"
              className="flex items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground"
            >
              <span>{pageRangeLabel(page, pageSize, totalEntries)}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= pageCount - 1}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </nav>
          </>
        ) : (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">{noLedgerEntries(financialYear)}</p>
        ))}
    </section>
  )
}
