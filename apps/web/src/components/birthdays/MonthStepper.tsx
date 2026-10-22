import { currentMonth, monthName, shiftMonth } from '@cl/schemas'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface MonthStepperProps {
  month: number
  onChange: (month: number) => void
}

/** The month being shown, with previous / next buttons (wrapping at the year end) and This Month. */
export function MonthStepper({ month, onChange }: MonthStepperProps) {
  const thisMonth = currentMonth()
  const step = (delta: number) => onChange(shiftMonth(month, delta))
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 bg-card"
        aria-label={`Previous Month, ${monthName(shiftMonth(month, -1))}`}
        onClick={() => step(-1)}
      >
        <ChevronLeft />
      </Button>
      <span aria-live="polite" className="min-w-32 text-center text-lg font-bold">
        {monthName(month)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 bg-card"
        aria-label={`Next Month, ${monthName(shiftMonth(month, 1))}`}
        onClick={() => step(1)}
      >
        <ChevronRight />
      </Button>
      {month !== thisMonth && (
        <Button type="button" variant="ghost" size="touch" onClick={() => onChange(thisMonth)}>
          This Month
        </Button>
      )}
    </div>
  )
}
