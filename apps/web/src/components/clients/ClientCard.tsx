import type { ClientSummaryResponse } from '@cl/api'
import { clientName } from '@cl/schemas'
import { Link } from 'react-router'

import { clientPath } from '@/utils/routes'

// Status badge (Overdue / Settled) and Pending / Billed / Received from the mock join here
// once the API carries billing figures.

/** One client: name and email, their companies and manager. The whole card opens the client page. */
export function ClientCard({ client }: { client: ClientSummaryResponse }) {
  return (
    <Link
      to={clientPath(client.id ?? '')}
      className="flex h-full flex-col gap-5 rounded-lg border border-border bg-card p-6 text-card-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="truncate text-xl font-bold">{clientName(client)}</h2>
        <p className="truncate text-sm text-muted-foreground">{client.email}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.08em] text-brand uppercase">Companies</span>
        <ul className="flex flex-col gap-1 text-[15px]">
          {client.companyNames?.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-[15px]">
        <span className="text-muted-foreground">Manager</span>
        <span className="truncate font-bold">{client.managerName}</span>
      </div>
    </Link>
  )
}
