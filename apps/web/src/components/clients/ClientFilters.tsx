import type { ManagerResponse } from '@cl/api'
import { managerFilterOptions } from '@cl/schemas'

import { NativeSelect } from '@/components/form/NativeSelect'
import { SearchInput } from '@/components/SearchInput'

interface ClientFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  managerId: string
  onManagerChange: (managerId: string) => void
  managers: readonly ManagerResponse[]
}

/** Search by client or company, and narrow to one manager's clients. */
export function ClientFilters({ query, onQueryChange, managerId, onManagerChange, managers }: ClientFiltersProps) {
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
    </div>
  )
}
