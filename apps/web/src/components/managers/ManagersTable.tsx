import type { ManagerResponse } from '@cl/api'
import { managerInitials, managerName, roleLabel } from '@cl/schemas'

import { DataTable, type DataColumn } from '@/components/DataTable'

interface ManagersTableProps {
  managers: readonly ManagerResponse[]
  onSelect: (manager: ManagerResponse) => void
}

// Monthly Salary and Pending from the mock join here once the API carries them.
const columns = (onSelect: (manager: ManagerResponse) => void): readonly DataColumn<ManagerResponse>[] => [
  {
    header: 'Manager',
    render: (manager) => (
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary"
        >
          {managerInitials(manager)}
        </span>
        <div className="flex min-w-0 flex-col">
          {/* The name is the row's keyboard target; a click anywhere on the row does the same. */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(manager)
            }}
            className="truncate text-left text-base font-bold text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {managerName(manager)}
          </button>
          <span className="truncate text-[13px] text-muted-foreground">{manager.email}</span>
        </div>
      </div>
    ),
  },
  { header: 'Role', render: (manager) => roleLabel(manager.role) },
  { header: 'Phone', render: (manager) => manager.mobileNumber },
  { header: 'Clients', align: 'right', render: (manager) => manager.clientCount ?? '—' },
]

/** The manager list as a table: monogram, name and email, role, phone, clients. Rows open the editor. */
export function ManagersTable({ managers, onSelect }: ManagersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <DataTable columns={columns(onSelect)} rows={managers} rowKey={(m) => m.id ?? m.email ?? ''} onRowClick={onSelect} />
    </div>
  )
}
