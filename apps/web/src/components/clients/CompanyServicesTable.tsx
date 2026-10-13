import type { ServiceAssignmentResponse } from '@cl/api'
import {
  DELETE_SERVICE_WARNING,
  chargeBreakdown,
  companyDiscountLabel,
  formatApiDate,
  formatInr,
  gstRateLabel,
  servicesCountLabel,
} from '@cl/schemas'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { DeleteButton } from '@/components/DeleteButton'
import { LoadError } from '@/components/LoadError'
import { BillingBadge } from '@/components/services/BillingBadge'
import { Spinner } from '@/components/Spinner'
import { cn } from '@/lib/utils'

interface CompanyServicesTableProps {
  /** Starts collapsed to its heading unless set; the heading toggles it. */
  defaultExpanded?: boolean
  services: readonly ServiceAssignmentResponse[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  /** Opens Edit Service; a click anywhere on the row does the same. */
  onEdit: (service: ServiceAssignmentResponse) => void
  onDelete: (assignmentId: string) => Promise<unknown>
  deleting: boolean
}

/** The row's charge; only rendered once the fee is known. */
const charge = (s: ServiceAssignmentResponse) =>
  chargeBreakdown(s.serviceFee ?? 0, s.discountPercent ?? 0, s.gstRatePercent)

// Charge, Payment and Balance from the mock's ledger join here once the API carries billing.
function columns({
  onEdit,
  onDelete,
  deleting,
}: Pick<CompanyServicesTableProps, 'onEdit' | 'onDelete' | 'deleting'>): readonly DataColumn<ServiceAssignmentResponse>[] {
  return [
    {
      header: 'Service',
      render: (s) => (
        // The name is the row's keyboard target.
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(s)
          }}
          aria-label={`Edit ${s.serviceName}`}
          className="text-left text-base font-bold text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {s.serviceName}
        </button>
      ),
    },
    {
      header: 'Billing',
      align: 'center',
      render: (s) => s.serviceType && <BillingBadge billing={s.serviceType} />,
    },
    {
      header: 'Delivery Date',
      align: 'center',
      render: (s) => <span className="whitespace-nowrap">{formatApiDate(s.deliveryDate)}</span>,
    },
    {
      header: 'Next Due Date',
      align: 'center',
      render: (s) => <span className="whitespace-nowrap">{formatApiDate(s.nextDueDate) || '—'}</span>,
    },
    {
      header: 'Comment',
      render: (s) => <span className="whitespace-normal text-muted-foreground">{s.comment ?? '—'}</span>,
    },
    // The catalog's standard fee, before this assignment's discount and GST.
    {
      header: 'Fee',
      align: 'right',
      render: (s) => (s.serviceFee != null ? formatInr(s.serviceFee) : '—'),
    },
    {
      header: 'Discount',
      align: 'center',
      render: (s) => companyDiscountLabel(s.discountPercent),
    },
    {
      header: 'Net Charge',
      align: 'right',
      render: (s) =>
        s.serviceFee != null ? <span className="font-bold whitespace-nowrap">{formatInr(charge(s).net)}</span> : '—',
    },
    // The rate added on the invoice, on top of the net charge.
    {
      header: 'GST',
      align: 'center',
      render: (s) => gstRateLabel(s.gstRatePercent),
    },
    {
      header: 'Total',
      align: 'right',
      render: (s) =>
        s.serviceFee != null ? <span className="font-bold whitespace-nowrap">{formatInr(charge(s).total)}</span> : '—',
    },
    {
      header: 'Delete',
      hideHeader: true,
      align: 'right',
      render: (s) => (
        // React events bubble out of the dialog's portal too, so stop every click here from
        // reaching the row (which would open Edit Service).
        <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
          <DeleteButton
            iconOnly
            label="Delete Service"
            itemName={s.serviceName ?? 'This Service'}
            description={DELETE_SERVICE_WARNING}
            onDelete={() => onDelete(s.id ?? '')}
            deleting={deleting}
          />
        </span>
      ),
    },
  ]
}

/** The section's body: loading, error, the table, or a note that there are no services yet. */
function ServicesBody({
  services,
  isLoading,
  error,
  onRetry,
  onEdit,
  onDelete,
  deleting,
}: Omit<CompanyServicesTableProps, 'defaultExpanded'>) {
  if (isLoading) return <Spinner className="mx-6 mb-6" />
  if (error) {
    return (
      <div className="px-6 pb-6">
        <LoadError error={error} onRetry={onRetry} />
      </div>
    )
  }
  return services.length ? (
    <DataTable
      columns={columns({ onEdit, onDelete, deleting })}
      rows={services}
      rowKey={(s) => s.id ?? `${s.serviceId}-${s.deliveryDate}`}
      onRowClick={onEdit}
    />
  ) : (
    <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
      No Services Recorded For This Company Yet.
    </p>
  )
}

/**
 * The services assigned to a company, most recent delivery first, collapsed to its heading by
 * default; the heading (with the count) toggles it. Rows open Edit Service.
 */
export function CompanyServicesTable({ defaultExpanded = false, ...props }: CompanyServicesTableProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { services, isLoading, error } = props
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <h2>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="company-services-body"
          className="flex w-full items-center justify-between gap-4 px-6 py-3 text-left hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
        >
          <span className="flex items-center gap-2 text-xl font-bold">
            <ChevronDown className={cn('size-5 transition-transform', !expanded && '-rotate-90')} aria-hidden />
            Services
          </span>
          {!isLoading && !error && (
            <span className="text-sm font-normal text-muted-foreground">{servicesCountLabel(services.length)}</span>
          )}
        </button>
      </h2>
      {expanded && (
        <div id="company-services-body">
          <ServicesBody {...props} />
        </div>
      )}
    </section>
  )
}
