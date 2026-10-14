import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  /** Names the group for screen readers, e.g. "Rank". */
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** A row of toggle buttons, one pressed at a time: picks a view of the same data. */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border border-border p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-8 cursor-pointer rounded-md px-3 text-sm font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            value === option.value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
