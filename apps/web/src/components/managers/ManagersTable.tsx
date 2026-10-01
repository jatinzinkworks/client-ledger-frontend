import type { ManagerResponse } from '@cl/api'
import { managerInitials, managerName, roleLabel } from '@cl/schemas'
import type { ReactNode } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ManagersTableProps {
  managers: readonly ManagerResponse[]
  onSelect: (manager: ManagerResponse) => void
}

interface Column {
  header: string
  render: (manager: ManagerResponse, onSelect: (manager: ManagerResponse) => void) => ReactNode
}

// Monthly Salary, Clients and Pending from the mock join here once the API carries them.
const COLUMNS: readonly Column[] = [
  {
    header: 'Manager',
    render: (manager, onSelect) => (
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
]

/** The manager list as a table: monogram, name and email, role, phone. Rows open the editor. */
export function ManagersTable({ managers, onSelect }: ManagersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead
                key={column.header}
                className="h-12 px-6 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {managers.map((manager) => (
            <TableRow key={manager.id} onClick={() => onSelect(manager)} className="cursor-pointer">
              {COLUMNS.map((column) => (
                <TableCell key={column.header} className="px-6 py-4 text-[15px] text-foreground">
                  {column.render(manager, onSelect)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
