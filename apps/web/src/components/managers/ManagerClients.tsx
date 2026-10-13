import { useManagerClients, type ClientSummaryResponse } from '@cl/api'
import { accountStatus, clientName, formatInr } from '@cl/schemas'
import { Link } from 'react-router'

import { AccountStatusBadge } from '@/components/clients/AccountStatusBadge'
import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'
import { cn } from '@/lib/utils'
import { clientPath } from '@/utils/routes'
import { EYEBROW } from '@/utils/typography'

interface ManagerClientsProps {
  clients: readonly ClientSummaryResponse[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

/** One client of the manager: name (to their page), companies, what they owe and status. */
function ClientRow({ client }: { client: ClientSummaryResponse }) {
  const pending = client.totalPending
  const status = accountStatus(pending)
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link to={clientPath(client.id ?? '')} className="truncate font-bold text-foreground hover:underline">
          {clientName(client)}
        </Link>
        <span className="text-sm text-muted-foreground">{client.companyNames?.join(', ')}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {pending != null && (
          <span className={cn('font-bold tabular-nums', pending > 0 && 'text-destructive')}>{formatInr(pending)}</span>
        )}
        {status && <AccountStatusBadge status={status} />}
      </div>
    </li>
  )
}

/** The clients a manager looks after, in the Edit Manager panel. */
export function ManagerClients({ clients, isLoading, error, onRetry }: ManagerClientsProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className={EYEBROW}>Clients</h3>
      {isLoading && <Spinner />}
      {error && <LoadError error={error} onRetry={onRetry} />}
      {!isLoading &&
        !error &&
        (clients.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No Clients Yet.</p>
        ))}
    </section>
  )
}

/** ManagerClients for one manager, fetched by id (only that response carries the clients). */
export function ManagerClientsSection({ managerId }: { managerId: string }) {
  const { clients, isLoading, error, refetch } = useManagerClients(managerId)
  return <ManagerClients clients={clients} isLoading={isLoading} error={error} onRetry={refetch} />
}
