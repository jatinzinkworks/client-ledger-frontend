import { useClient, useCompany, useServiceCatalog, type ServiceAssignmentResponse } from '@cl/api'
import { clientName, companyDetails } from '@cl/schemas'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { AddServiceForm } from '@/components/clients/AddServiceForm'
import { CompanyServicesTable } from '@/components/clients/CompanyServicesTable'
import { EditCompanyForm } from '@/components/clients/EditCompanyForm'
import { EditServiceForm } from '@/components/clients/EditServiceForm'
import { DetailHeader } from '@/components/DetailHeader'
import { LoadError } from '@/components/LoadError'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { clientPath } from '@/utils/routes'

/** One company of a client: its details and the services assigned to it. */
export function CompanyDetailPage() {
  const { id = '', companyId = '' } = useParams()
  const page = useCompany(id, companyId)
  const navigate = useNavigate()
  const catalog = useServiceCatalog()
  // Which side sheet is open: none, Edit Company, Add Service or Edit Service (of one service).
  const [sheet, setSheet] = useState<'edit' | 'add-service' | ServiceAssignmentResponse | null>(null)
  const closeSheet = () => setSheet(null)
  const editingService = typeof sheet === 'object' ? sheet : null
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
  // The status badge, CIN / GSTIN, the Billed / Received / Pending / Last Payment cards,
  // Record Payment and Export To Excel from the mock come once the API supports them.
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
            title={company.companyName ?? ''}
            details={companyDetails(company)}
            note={company.address}
            actions={
              <>
                <RefreshButton onRefresh={() => page.refetch()} refreshing={page.isRefreshing} />
                <Button variant="outline" size="touch" className="border-primary/50 bg-card" onClick={() => setSheet('edit')}>
                  <Pencil /> Edit Company
                </Button>
                <Button size="touch" onClick={() => setSheet('add-service')}>
                  <Plus /> Add Service
                </Button>
              </>
            }
          />
          <CompanyServicesTable
            services={page.services}
            isLoading={page.servicesLoading}
            error={page.servicesError}
            onRetry={() => page.refetch()}
            onEdit={setSheet}
            onDelete={page.deleteService}
            deleting={page.deletingService}
          />

          <Sheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
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
