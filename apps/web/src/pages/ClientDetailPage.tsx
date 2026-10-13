import { useClient, useClientLedgerExport, useClientLedgerSummary, useClientPayments, useManagerCatalog } from '@cl/api'
import {
  clientName,
  clientSinceLabel,
  clientSummaryCards,
  discountLabel,
  financialYearLabel,
} from '@cl/schemas'
import { IndianRupee, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { AddCompanyForm } from '@/components/clients/AddCompanyForm'
import { CompaniesTable } from '@/components/clients/CompaniesTable'
import { EditClientForm } from '@/components/clients/EditClientForm'
import { ExportLedgerButton } from '@/components/clients/ExportLedgerButton'
import { RecordPaymentForm } from '@/components/clients/RecordPaymentForm'
import { SummaryCards } from '@/components/clients/SummaryCards'
import { DetailHeader } from '@/components/DetailHeader'
import { LoadError } from '@/components/LoadError'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useFinancialYear } from '@/financialYear/useFinancialYear'
import { saveLedgerExport } from '@/utils/download'

/** One client: their details, manager and discount, and the companies they hold. */
export function ClientDetailPage() {
  const { id = '' } = useParams()
  const { financialYear } = useFinancialYear()
  // The companies list carries each company's billed / received / pending for the year.
  const page = useClient(id, financialYear)
  const { client, isLoading, notFound, loadError, refetch, isRefreshing, update, saving, remove, deleting } = page
  const navigate = useNavigate()
  const managers = useManagerCatalog()
  const payments = useClientPayments(id)
  const yearSummary = useClientLedgerSummary(id, financialYear)
  const ledgerExport = useClientLedgerExport(id)
  // Which side sheet is open: none, Edit Client, Add Company or Record Payment.
  const [sheet, setSheet] = useState<'edit' | 'add-company' | 'record-payment' | null>(null)
  const closeSheet = () => setSheet(null)

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-lg font-bold">Client Not Found</p>
        <p className="text-sm text-muted-foreground">This Client May Have Been Removed.</p>
        <Link to="/clients" className="font-bold text-brand hover:underline">
          Back To Clients
        </Link>
      </div>
    )
  }

  const name = client ? clientName(client) : ''
  // Downloads the selected year's ledger; a failure shows below the header with a Retry.
  const exportLedger = saveLedgerExport(ledgerExport.exportLedger, name, financialYear)
  // The client's services, for the Billed card's note: a sum over their companies' counts.
  const serviceCount = page.companies.reduce((total, c) => total + (c.serviceCount ?? 0), 0)
  const details = client
    ? [
        client.email,
        client.phone,
        client.managerName && `Manager: ${client.managerName}`,
        discountLabel(client.discountPercent),
        clientSinceLabel(client.createdAt),
      ].filter((detail): detail is string => !!detail)
    : []

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb crumbs={[{ label: 'Clients', to: '/clients' }, { label: name || 'Client' }]} />
      {isLoading && <Spinner />}
      {loadError && <LoadError error={loadError} onRetry={() => refetch()} />}

      {client && (
        <>
          <DetailHeader
            title={name}
            details={details}
            onEdit={() => setSheet('edit')}
            editLabel="Edit Client"
            actions={
              <>
                <RefreshButton
                  onRefresh={() => Promise.all([refetch(), yearSummary.refetch()])}
                  refreshing={isRefreshing || yearSummary.isRefreshing}
                />
                <ExportLedgerButton onExport={exportLedger} exporting={ledgerExport.exporting} />
                <Button size="touch" onClick={() => setSheet('record-payment')}>
                  <IndianRupee /> Record Payment
                </Button>
                <Button size="touch" onClick={() => setSheet('add-company')}>
                  <Plus /> Add Company
                </Button>
              </>
            }
          />
          {ledgerExport.error && <LoadError error={ledgerExport.error} onRetry={exportLedger} />}
          <SummaryCards
            label={`Summary For ${financialYearLabel(financialYear)}`}
            cards={yearSummary.summary && clientSummaryCards(yearSummary.summary, financialYear, serviceCount)}
            isLoading={yearSummary.isLoading}
            error={yearSummary.error}
            onRetry={() => yearSummary.refetch()}
          />
          <CompaniesTable
            clientId={id}
            companies={page.companies}
            onDeleteCompany={page.deleteCompany}
            deletingCompany={page.deletingCompany}
          />

          <Sheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
              {sheet === 'edit' && (
                <EditClientForm
                  client={client}
                  managers={managers.managers}
                  managersLoading={managers.isLoading}
                  onSave={update}
                  saving={saving}
                  onDelete={remove}
                  deleting={deleting}
                  onDone={closeSheet}
                  onDeleted={() => navigate('/clients', { replace: true })}
                />
              )}
              {sheet === 'record-payment' && (
                <RecordPaymentForm
                  clientName={name}
                  companies={page.companies.flatMap((c) => (c.id ? [{ id: c.id, name: c.companyName ?? '' }] : []))}
                  pendingFor={payments.balanceOf}
                  onSave={payments.recordPayment}
                  saving={payments.recordingPayment}
                  onDone={closeSheet}
                />
              )}
              {sheet === 'add-company' && (
                <AddCompanyForm client={client} onAdd={page.addCompany} saving={page.addingCompany} onDone={closeSheet} />
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
