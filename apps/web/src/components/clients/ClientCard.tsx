import type { ClientSummaryResponse } from '@cl/api'
import { accountStatus, clientName, formatInr } from '@cl/schemas'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'

import { AccountStatusBadge } from './AccountStatusBadge'
import { ClientBirthday } from './ClientBirthday'
import { clientPath } from '@/utils/routes'
import { EYEBROW } from '@/utils/typography'

// The mock's "₹N Billed · ₹N Received" line joins here once the list carries those figures.

/**
 * One client: name, email, birthday (when recorded) and status, their companies, what they still owe (across all years)
 * and their manager. The whole card opens the client page.
 */
export function ClientCard({ client }: { client: ClientSummaryResponse }) {
  const pending = client.totalPending
  const status = accountStatus(pending)
  return (
    <Link
      to={clientPath(client.id ?? '')}
      className="flex h-full flex-col gap-5 rounded-lg border border-border bg-card p-6 text-card-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate text-xl font-bold">{clientName(client)}</h2>
          <p className="truncate text-sm text-muted-foreground">{client.email}</p>
          <ClientBirthday birthday={client.birthday} className="text-sm text-muted-foreground" />
        </div>
        {status && <AccountStatusBadge status={status} className="px-3.5 text-[13px]" />}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <span className={EYEBROW}>Companies</span>
        <ul className="flex flex-col gap-1 text-[15px]">
          {client.companyNames?.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>

      {pending != null && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Pending</span>
          {/* Red while the client owes anything, like their Overdue status. */}
          <span
            className={cn('text-[32px] leading-none font-black tracking-tight tabular-nums', pending > 0 && 'text-destructive')}
          >
            {formatInr(pending)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-[15px]">
        <span className="text-muted-foreground">Manager</span>
        <span className="truncate font-bold">{client.managerName}</span>
      </div>
    </Link>
  )
}
