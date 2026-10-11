import type { ServiceAssignmentResponse } from '@cl/api'
import {
  DELETE_SERVICE_WARNING,
  chargeBreakdown,
  companyDiscountLabel,
  formatApiDate,
  formatInr,
  servicesCountLabel,
} from '@cl/schemas'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { DeleteButton } from '@/components/DeleteButton'
import { LoadError } from '@/components/LoadError'
import { BillingBadge } from '@/components/services/BillingBadge'
import { Spinner } from '@/components/Spinner'

interface CompanyServicesTableProps {
  services: readonly ServiceAssignmentResponse[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  /** Opens Edit Service; a click anywhere on the row does the same. */
  onEdit: (service: ServiceAssignmentResponse) => void
  onDelete: (assignmentId: string) => Promise<unknown>
  deleting: boolean
}

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
      render: (s) => s.serviceType && <BillingBadge billing={s.serviceType} />,
    },
    {
      header: 'Delivery Date',
      render: (s) => <span className="whitespace-nowrap">{formatApiDate(s.deliveryDate)}</span>,
    },
    {
      header: 'Next Due Date',
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
      align: 'right',
      render: (s) => companyDiscountLabel(s.discountPercent),
    },
    {
      header: 'Net Charge',
      align: 'right',
      render: (s) =>
        s.serviceFee != null ? (
          <span className="font-bold">{formatInr(chargeBreakdown(s.serviceFee, s.discountPercent ?? 0).net)}</span>
        ) : (
          '—'
        ),
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

/** The services assigned to a company, most recent delivery first. Rows open Edit Service. */
export function CompanyServicesTable({
  services,
  isLoading,
  error,
  onRetry,
  onEdit,
  onDelete,
  deleting,
}: CompanyServicesTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-baseline justify-between gap-4 px-6 pt-6 pb-4">
        <h2 className="text-2xl font-bold">Services</h2>
        {!isLoading && !error && <span className="text-sm text-muted-foreground">{servicesCountLabel(services.length)}</span>}
      </div>
      {isLoading && <Spinner className="mx-6 mb-6" />}
      {error && (
        <div className="px-6 pb-6">
          <LoadError error={error} onRetry={onRetry} />
        </div>
      )}
      {!isLoading &&
        !error &&
        (services.length ? (
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
        ))}
    </section>
  )
}
