import {
  LEDGER_PAGE_SIZE,
  useClient,
  useCompany,
  useCompanyLedger,
  useCompanyLedgerEmail,
  useCompanyLedgerExport,
  useServiceCatalog,
  type LedgerEntryResponse,
  type ServiceAssignmentResponse,
} from '@cl/api'
import {
  DELETE_PAYMENT_WARNING,
  clientName,
  companyDetails,
  companyLedgerEmailDescription,
  ledgerEmailTooltip,
  financialYearLabel,
  isPayment,
  isServiceCharge,
  ledgerEntryName,
  ledgerSummaryCards,
} from '@cl/schemas'
import { IndianRupee, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { AddServiceForm } from '@/components/clients/AddServiceForm'
import { CompanyLedger } from '@/components/clients/CompanyLedger'
import { EmailLedgerButton } from '@/components/clients/EmailLedgerButton'
import { DeleteButton } from '@/components/DeleteButton'
import { CompanyServicesTable } from '@/components/clients/CompanyServicesTable'
import { EditCompanyForm } from '@/components/clients/EditCompanyForm'
import { EditLedgerEntryForm } from '@/components/clients/EditLedgerEntryForm'
import { EditServiceForm } from '@/components/clients/EditServiceForm'
import { ExportLedgerButton } from '@/components/clients/ExportLedgerButton'
import { SummaryCards } from '@/components/clients/SummaryCards'
import { RecordPaymentForm } from '@/components/clients/RecordPaymentForm'
import { DetailHeader } from '@/components/DetailHeader'
import { LoadError } from '@/components/LoadError'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useFinancialYear } from '@/financialYear/useFinancialYear'
import { saveLedgerExport } from '@/utils/download'
import { clientPath } from '@/utils/routes'

type SheetState =
  | 'edit'
  | 'add-service'
  | 'record-payment'
  | { service: ServiceAssignmentResponse }
  | { entry: LedgerEntryResponse }
  | null

/**
 * One company of a client: its details, the services assigned to it and its ledger. Keyed by
 * company, so opening another one starts afresh — no state, page number or data carried over.
 */
export function CompanyDetailPage() {
  const { id = '', companyId = '' } = useParams()
  return <CompanyDetail key={`${id}/${companyId}`} id={id} companyId={companyId} />
}

function CompanyDetail({ id, companyId }: { id: string; companyId: string }) {
  const page = useCompany(id, companyId)
  const { financialYear } = useFinancialYear()
  const ledger = useCompanyLedger(id, companyId, financialYear)
  const ledgerExport = useCompanyLedgerExport(id, companyId)
  const ledgerEmail = useCompanyLedgerEmail(id, companyId)
  const navigate = useNavigate()
  const catalog = useServiceCatalog(financialYear)
  // Which side sheet is open: none, Edit Company, Add Service, Record Payment, or editing one
  // service or one ledger entry.
  const [sheet, setSheet] = useState<SheetState>(null)
  const closeSheet = () => setSheet(null)
  const editingService = sheet && typeof sheet === 'object' && 'service' in sheet ? sheet.service : null
  const editingEntry = sheet && typeof sheet === 'object' && 'entry' in sheet ? sheet.entry : null
  // For the breadcrumb and Delete Company — usually already cached from the client page.
  const ownerPage = useClient(id)
  const owner = ownerPage.client
  const ownerName = owner ? clientName(owner) : 'Client'

  if (page.notFound) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-lg font-bold">Company Not Found</p>
        <p className="text-sm text-muted-foreground">This Company May Have Been Removed.</p>
        <Link to={clientPath(id)} className="font-bold text-brand hover:underline">
          Back To {ownerName}
        </Link>
      </div>
    )
  }

  const { company } = page
  // The status badge, CIN / GSTIN and Export To Excel from the mock come once the API supports them.
  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        crumbs={[
          { label: 'Clients', to: '/clients' },
          { label: ownerName, to: clientPath(id) },
          { label: company?.companyName ?? 'Company' },
        ]}
      />
      {page.isLoading && <Spinner />}
      {page.loadError && <LoadError error={page.loadError} onRetry={() => page.refetch()} />}

      {company && (
        <>
          <DetailHeader
            level="company"
            owner={owner ? { name: ownerName, to: clientPath(id) } : undefined}
            title={company.companyName ?? ''}
            details={companyDetails(company)}
            onEdit={() => setSheet('edit')}
            editLabel="Edit Company"
            actions={
              <>
                <RefreshButton
                  onRefresh={() => Promise.all([page.refetch(), ledger.refetch()])}
                  refreshing={page.isRefreshing || ledger.isRefreshing}
                />
                <ExportLedgerButton
                  onExport={saveLedgerExport(ledgerExport.exportLedger, company.companyName ?? '', financialYear)}
                  exporting={ledgerExport.exporting}
                />
                <EmailLedgerButton
                  description={companyLedgerEmailDescription(company.companyName ?? '')}
                  tooltip={ledgerEmailTooltip('company')}
                  onSend={ledgerEmail.send}
                  sending={ledgerEmail.sending}
                />
                <Button size="touch" onClick={() => setSheet('record-payment')}>
                  <IndianRupee /> Record Payment
                </Button>
                <Button size="touch" onClick={() => setSheet('add-service')}>
                  <Plus /> Add Service
                </Button>
              </>
            }
          />
          {ledgerExport.error && (
            <LoadError
              error={ledgerExport.error}
              onRetry={saveLedgerExport(ledgerExport.exportLedger, company.companyName ?? '', financialYear)}
            />
          )}
          <SummaryCards
            label={`Summary For ${financialYearLabel(financialYear)}`}
            cards={ledger.yearSummary && ledgerSummaryCards(ledger.yearSummary, financialYear)}
            isLoading={ledger.yearSummaryLoading}
            error={ledger.yearSummaryError}
            onRetry={() => ledger.refetch()}
          />
          <CompanyServicesTable
            services={page.services}
            isLoading={page.servicesLoading}
            error={page.servicesError}
            onRetry={() => page.refetch()}
            onEdit={(service) => setSheet({ service })}
            onDelete={page.deleteService}
            deleting={page.deletingService}
          />
          <CompanyLedger
            financialYear={financialYear}
            entries={ledger.entries}
            isLoading={ledger.isLoading}
            error={ledger.error}
            onRetry={() => ledger.refetch()}
            page={ledger.page}
            pageSize={LEDGER_PAGE_SIZE}
            pageCount={ledger.pageCount}
            totalEntries={ledger.totalEntries}
            onPageChange={ledger.setPage}
            onGenerate={ledger.generate}
            generating={ledger.generating}
            onEdit={(entry) => setSheet({ entry })}
            onDelete={ledger.deleteEntry}
            deleting={ledger.deletingEntry}
          />

          <Sheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent
              className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]"
            >
              {sheet === 'edit' && (
                <EditCompanyForm
                  company={company}
                  onSave={page.update}
                  saving={page.saving}
                  onDone={closeSheet}
                  onDelete={() => ownerPage.deleteCompany(companyId)}
                  deleting={ownerPage.deletingCompany}
                  onDeleted={() => navigate(clientPath(id), { replace: true })}
                  onlyCompany={(owner?.companies?.length ?? 0) <= 1}
                  hasServices={page.services.length > 0}
                />
              )}
              {editingService && (
                <EditServiceForm
                  company={company}
                  assignment={editingService}
                  catalog={catalog.services}
                  catalogLoading={catalog.isLoading}
                  catalogError={catalog.loadError}
                  onRetryCatalog={() => catalog.refetch()}
                  onSave={(data) => page.updateService(editingService.id ?? '', data)}
                  saving={page.updatingService}
                  onDelete={() => page.deleteService(editingService.id ?? '')}
                  deleting={page.deletingService}
                  onDone={closeSheet}
                />
              )}
              {editingEntry && isPayment(editingEntry) && (
                <RecordPaymentForm
                  key={editingEntry.id}
                  payment={editingEntry}
                  clientName={ownerName}
                  companies={[{ id: companyId, name: company.companyName ?? '' }]}
                  pendingFor={() => ledger.balance}
                  onSave={(_, data) => ledger.updatePayment(editingEntry.id ?? '', data)}
                  saving={ledger.updatingPayment}
                  onDone={closeSheet}
                  footerStart={
                    <DeleteButton
                      label="Delete Payment"
                      itemName={ledgerEntryName(editingEntry)}
                      description={DELETE_PAYMENT_WARNING}
                      onDelete={async () => {
                        await ledger.deleteEntry(editingEntry.id ?? '')
                        closeSheet()
                      }}
                      deleting={ledger.deletingEntry}
                    />
                  }
                />
              )}
              {editingEntry && isServiceCharge(editingEntry) && (
                <EditLedgerEntryForm
                  // Re-mount for another entry, so the form starts from its rates.
                  key={editingEntry.id}
                  entry={editingEntry}
                  onSave={(data) => ledger.updateEntry(editingEntry.id ?? '', data)}
                  saving={ledger.updatingEntry}
                  onDelete={() => ledger.deleteEntry(editingEntry.id ?? '')}
                  deleting={ledger.deletingEntry}
                  onDone={closeSheet}
                />
              )}
              {sheet === 'record-payment' && (
                <RecordPaymentForm
                  clientName={ownerName}
                  companies={[{ id: companyId, name: company.companyName ?? '' }]}
                  pendingFor={() => ledger.balance}
                  onSave={(_, data) => ledger.recordPayment(data)}
                  saving={ledger.recordingPayment}
                  onDone={closeSheet}
                />
              )}
              {sheet === 'add-service' && (
                <AddServiceForm
                  company={company}
                  catalog={catalog.services}
                  catalogLoading={catalog.isLoading}
                  catalogError={catalog.loadError}
                  onRetryCatalog={() => catalog.refetch()}
                  onAdd={page.addService}
                  saving={page.addingService}
                  onDone={closeSheet}
                />
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
