import type { ServiceAssignmentResponse } from '@cl/api'
import { assignmentSummary, companyDiscountLabel, formatApiDate, servicesCountLabel } from '@cl/schemas'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'

interface CompanyServicesTableProps {
  services: readonly ServiceAssignmentResponse[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

// Charge, Payment and Balance from the mock's ledger join here once the API carries billing.
const COLUMNS: readonly DataColumn<ServiceAssignmentResponse>[] = [
  { header: 'Delivered', render: (s) => <span className="whitespace-nowrap">{formatApiDate(s.deliveryDate)}</span> },
  {
    header: 'Service',
    render: (s) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{s.serviceName}</span>
        <span className="text-[13px] text-muted-foreground">{assignmentSummary(s)}</span>
      </div>
    ),
  },
  { header: 'Comment', render: (s) => <span className="whitespace-normal text-muted-foreground">{s.comment ?? '—'}</span> },
  { header: 'Discount', align: 'right', render: (s) => companyDiscountLabel(s.discountPercent) },
]

/** The services assigned to a company, most recent delivery first. */
export function CompanyServicesTable({ services, isLoading, error, onRetry }: CompanyServicesTableProps) {
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
          <DataTable columns={COLUMNS} rows={services} rowKey={(s) => s.id ?? `${s.serviceId}-${s.deliveryDate}`} />
        ) : (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No Services Recorded For This Company Yet.
          </p>
        ))}
    </section>
  )
}
