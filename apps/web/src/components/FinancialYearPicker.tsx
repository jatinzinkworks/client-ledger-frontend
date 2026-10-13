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
        // Filled in white so the year every figure is for stands out on the navy sidebar; the open
        // list keeps the ordinary popover colours.
        className="h-10 border-sidebar-highlight bg-sidebar-highlight text-sm font-bold text-sidebar-highlight-foreground md:text-sm dark:bg-sidebar-highlight [&>option]:bg-popover [&>option]:font-normal [&>option]:text-popover-foreground"
        iconClassName="text-sidebar-highlight-foreground"
      />
    </div>
  )
}
