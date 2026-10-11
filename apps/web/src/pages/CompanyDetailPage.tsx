import { useClient, useCompany } from '@cl/api'
import { clientName, companyDetails } from '@cl/schemas'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { CompanyServicesTable } from '@/components/clients/CompanyServicesTable'
import { EditCompanyForm } from '@/components/clients/EditCompanyForm'
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
  const [editing, setEditing] = useState(false)
  // For the breadcrumb only — usually already cached from the client page.
  const owner = useClient(id).client
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
  // The status badge, CIN / GSTIN, the Billed / Received / Pending / Last Payment cards and
  // Record Service, Record Payment and Export To Excel from the mock come once
  // the API supports them.
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
                <Button variant="outline" size="touch" className="border-primary/50 bg-card" onClick={() => setEditing(true)}>
                  <Pencil /> Edit Company
                </Button>
              </>
            }
          />
          <CompanyServicesTable
            services={page.services}
            isLoading={page.servicesLoading}
            error={page.servicesError}
            onRetry={() => page.refetch()}
          />

          <Sheet open={editing} onOpenChange={setEditing}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
              {editing && (
                <EditCompanyForm company={company} onSave={page.update} saving={page.saving} onDone={() => setEditing(false)} />
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
