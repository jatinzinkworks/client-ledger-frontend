import { financialYearOptions } from '@cl/schemas'
import { CalendarRange } from 'lucide-react'

import { NativeSelect } from '@/components/form/NativeSelect'
import { useFinancialYear } from '@/financialYear/useFinancialYear'
import { cn } from '@/lib/utils'

/** The sidebar's Financial Year filter: the current Indian financial year and the four before it. */
export function FinancialYearPicker({ className }: { className?: string }) {
  const { financialYear, setFinancialYear } = useFinancialYear()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor="global-financial-year" className="flex items-center gap-1.5 text-xs font-bold text-sidebar-muted">
        <CalendarRange className="size-3.5" aria-hidden />
        Financial Year
      </label>
      <NativeSelect
        id="global-financial-year"
        options={financialYearOptions()}
        value={financialYear}
        onChange={(event) => setFinancialYear(event.target.value)}
        className="h-10 border-sidebar-border bg-sidebar-accent text-sm font-bold text-sidebar-foreground md:text-sm dark:bg-sidebar-accent"
      />
    </div>
  )
}
