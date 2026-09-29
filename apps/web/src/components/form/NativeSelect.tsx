import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { FIELD_CONTROL } from './fieldStyles'

export interface SelectOption {
  value: string
  label: string
}

interface NativeSelectProps extends Omit<ComponentProps<'select'>, 'children'> {
  options: readonly SelectOption[]
}

/** A styled native `<select>` — keeps the platform picker (and its accessibility) on every device. */
export function NativeSelect({ options, className, ...props }: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full min-w-0 appearance-none rounded-md border border-input px-3 pr-10 text-foreground shadow-xs outline-none transition-[color,box-shadow]',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50',
          FIELD_CONTROL,
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
