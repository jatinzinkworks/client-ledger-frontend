import { useClient } from '@cl/api'
import { clientName, clientSinceLabel, discountLabel } from '@cl/schemas'
import { Link, useParams } from 'react-router'

import { CompaniesTable } from '@/components/clients/CompaniesTable'
import { DetailHeader } from '@/components/DetailHeader'
import { LoadError } from '@/components/LoadError'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'

/** One client: their details, manager and discount, and the companies they hold. */
export function ClientDetailPage() {
  const { id = '' } = useParams()
  const { client, isLoading, notFound, loadError, refetch, isRefreshing } = useClient(id)

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
  // Billed / Received / Pending cards and Edit Client, Add Company, Record Payment and Export
  // Client Ledger from the mock come once the API supports them.
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
            actions={<RefreshButton onRefresh={() => refetch()} refreshing={isRefreshing} />}
          />
          <CompaniesTable clientId={id} companies={client.companies ?? []} />
        </>
      )}
    </div>
  )
}
