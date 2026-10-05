import { CATEGORY_FILTERS, type CategoryFilter } from '@cl/schemas'

import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'

interface ServiceFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  category: CategoryFilter
  onCategoryChange: (category: CategoryFilter) => void
}

/** Name search on the left, category pills on the right. */
export function ServiceFilters({ query, onQueryChange, category, onCategoryChange }: ServiceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <SearchInput value={query} onChange={onQueryChange} placeholder="Search Services By Name" />
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map(({ value, label }) => {
          const active = value === category
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(value as CategoryFilter)}
              className={cn(
                'h-10 rounded-full border px-4 text-[15px] font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-accent',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
