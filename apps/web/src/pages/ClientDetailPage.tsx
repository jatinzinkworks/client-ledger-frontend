import { useClient, useManagerCatalog } from '@cl/api'
import { clientName, clientSinceLabel, discountLabel } from '@cl/schemas'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { AddCompanyForm } from '@/components/clients/AddCompanyForm'
import { CompaniesTable } from '@/components/clients/CompaniesTable'
import { EditClientForm } from '@/components/clients/EditClientForm'
import { DetailHeader } from '@/components/DetailHeader'
import { LoadError } from '@/components/LoadError'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/** One client: their details, manager and discount, and the companies they hold. */
export function ClientDetailPage() {
  const { id = '' } = useParams()
  const page = useClient(id)
  const { client, isLoading, notFound, loadError, refetch, isRefreshing, update, saving, remove, deleting } = page
  const navigate = useNavigate()
  const managers = useManagerCatalog()
  // Which side sheet is open: none, Edit Client or Add Company.
  const [sheet, setSheet] = useState<'edit' | 'add-company' | null>(null)
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
  // Billed / Received / Pending cards, Record Payment and Export Client Ledger from the mock
  // come once the API supports them.
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
            actions={
              <>
                <RefreshButton onRefresh={() => refetch()} refreshing={isRefreshing} />
                <Button variant="outline" size="touch" className="border-primary/50 bg-card" onClick={() => setSheet('edit')}>
                  <Pencil /> Edit Client
                </Button>
                <Button variant="outline" size="touch" className="border-primary/50 bg-card" onClick={() => setSheet('add-company')}>
                  <Plus /> Add Company
                </Button>
              </>
            }
          />
          <CompaniesTable
            clientId={id}
            companies={client.companies ?? []}
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
