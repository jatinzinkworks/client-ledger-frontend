import type { CompanyResponse } from '@cl/api'
import {
  DELETE_COMPANY_IN_USE,
  DELETE_COMPANY_WARNING,
  LAST_COMPANY_REASON,
  companyDiscountLabel,
  companyTypeLabel,
} from '@cl/schemas'
import { Link, useNavigate } from 'react-router'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { DeleteButton } from '@/components/DeleteButton'
import { companyPath } from '@/utils/routes'

interface CompaniesTableProps {
  clientId: string
  companies: readonly CompanyResponse[]
  onDeleteCompany: (companyId: string) => Promise<unknown>
  deletingCompany: boolean
}

// Services, Billed, Received, Pending and Status from the mock join here once the API
// carries billing figures.
/** Why a company cannot be deleted right now: the backend refuses both (409). */
const deleteCompanyBlocker = (company: CompanyResponse, onlyCompany: boolean) =>
  onlyCompany ? LAST_COMPANY_REASON : company.serviceCount ? DELETE_COMPANY_IN_USE : undefined

function columns({ clientId, companies, onDeleteCompany, deletingCompany }: CompaniesTableProps): DataColumn<CompanyResponse>[] {
  const onlyCompany = companies.length <= 1
  return [
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
    { header: 'Services', align: 'right', render: (company) => company.serviceCount ?? '—' },
    { header: 'Discount', align: 'right', render: (company) => companyDiscountLabel(company.discountPercent) },
    {
      header: 'Delete',
      hideHeader: true,
      align: 'right',
      render: (company) => (
        // React events bubble out of the dialog's portal too, so stop every click here from
        // reaching the row (which would open the company).
        <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
          <DeleteButton
            iconOnly
            label="Delete Company"
            itemName={company.companyName ?? 'This Company'}
            description={DELETE_COMPANY_WARNING}
            disabledReason={deleteCompanyBlocker(company, onlyCompany)}
            conflictMessage={DELETE_COMPANY_IN_USE}
            onDelete={() => onDeleteCompany(company.id ?? '')}
            deleting={deletingCompany}
          />
        </span>
      ),
    },
  ]
}

/** A client's companies: name and address, legal form, discount and delete. Rows open the company page. */
export function CompaniesTable(props: CompaniesTableProps) {
  const { clientId, companies } = props
  const navigate = useNavigate()
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="px-6 pt-6 pb-4 text-2xl font-bold">Companies</h2>
      <DataTable
        columns={columns(props)}
        rows={companies}
        rowKey={(company) => company.id ?? company.companyName ?? ''}
        onRowClick={(company) => company.id && navigate(companyPath(clientId, company.id))}
      />
    </section>
  )
}
