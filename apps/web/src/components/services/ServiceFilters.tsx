import { CATEGORY_FILTERS, type CategoryFilter } from '@cl/schemas'
import { Search } from 'lucide-react'

import { FIELD_CONTROL } from '@/components/form/fieldStyles'
import { Input } from '@/components/ui/input'
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
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Services By Name"
          aria-label="Search services by name"
          className={cn(FIELD_CONTROL, 'pl-9')}
        />
      </div>
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
