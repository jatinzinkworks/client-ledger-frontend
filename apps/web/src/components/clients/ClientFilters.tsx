import type { ManagerResponse } from '@cl/api'
import { managerFilterOptions } from '@cl/schemas'

import { NativeSelect } from '@/components/form/NativeSelect'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'

interface ClientFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  managerId: string
  onManagerChange: (managerId: string) => void
  managers: readonly ManagerResponse[]
  overdueOnly: boolean
  onOverdueOnlyChange: (overdueOnly: boolean) => void
}

/** Search by client or company, and narrow to one manager's clients and to those overdue. */
export function ClientFilters({
  query,
  onQueryChange,
  managerId,
  onManagerChange,
  managers,
  overdueOnly,
  onOverdueOnlyChange,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchInput value={query} onChange={onQueryChange} placeholder="Search Clients Or Companies" />
      <NativeSelect
        aria-label="Filter By Manager"
        value={managerId}
        onChange={(e) => onManagerChange(e.target.value)}
        options={managerFilterOptions(managers)}
        className="w-56"
      />
      <button
        type="button"
        aria-pressed={overdueOnly}
        onClick={() => onOverdueOnlyChange(!overdueOnly)}
        className={cn(
          'h-10 cursor-pointer rounded-full border px-4 text-[15px] font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          overdueOnly
            ? 'border-destructive bg-destructive text-white'
            : 'border-border bg-card text-foreground hover:bg-accent',
        )}
      >
        Overdue Only
      </button>
    </div>
  )
}
