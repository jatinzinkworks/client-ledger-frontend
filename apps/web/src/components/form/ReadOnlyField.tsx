import { cn } from '@/lib/utils'

import { FIELD_CONTROL, FIELD_LABEL } from './fieldStyles'

interface ReadOnlyFieldProps {
  id: string
  label: string
  value: string
}

/** A labelled value shaped like a field but fixed — shown, not chosen (e.g. the service being edited). */
export function ReadOnlyField({ id, label, value }: ReadOnlyFieldProps) {
  const labelId = `${id}-label`
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className={FIELD_LABEL}>
        {label}
      </span>
      <p
        aria-labelledby={labelId}
        className={cn(FIELD_CONTROL, 'flex items-center truncate rounded-md border border-input bg-muted px-3 dark:bg-muted')}
      >
        {value}
      </p>
    </div>
  )
}
