import type { CompanyResponse } from '@cl/api'
import { companyDiscountLabel, companyTypeLabel } from '@cl/schemas'
import { Link, useNavigate } from 'react-router'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { companyPath } from '@/utils/routes'

interface CompaniesTableProps {
  clientId: string
  companies: readonly CompanyResponse[]
}

// Services, Billed, Received, Pending and Status from the mock join here once the API
// carries billing figures.
const columns = (clientId: string): readonly DataColumn<CompanyResponse>[] => [
  {
    header: 'Company',
    render: (company) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* The name is the row's keyboard target; a click anywhere on the row does the same. */}
        <Link
          to={companyPath(clientId, company.id ?? '')}
          onClick={(e) => e.stopPropagation()}
          className="text-base font-bold text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {company.companyName}
        </Link>
        <span className="text-[13px] whitespace-normal text-muted-foreground">{company.address}</span>
      </div>
    ),
  },
  { header: 'Type', render: (company) => companyTypeLabel(company.companyType) },
  { header: 'Discount', align: 'right', render: (company) => companyDiscountLabel(company.discountPercent) },
]

/** A client's companies: name and address, legal form and discount. Rows open the company page. */
export function CompaniesTable({ clientId, companies }: CompaniesTableProps) {
  const navigate = useNavigate()
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="px-6 pt-6 pb-4 text-2xl font-bold">Companies</h2>
      <DataTable
        columns={columns(clientId)}
        rows={companies}
        rowKey={(company) => company.id ?? company.companyName ?? ''}
        onRowClick={(company) => company.id && navigate(companyPath(clientId, company.id))}
      />
    </section>
  )
}
