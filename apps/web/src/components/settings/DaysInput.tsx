import type { UseFormRegisterReturn } from 'react-hook-form'

import { FIELD_CONTROL, FIELD_ERROR, FIELD_HINT, FIELD_LABEL } from '@/components/form/fieldStyles'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DaysInputProps {
  id: string
  label: string
  /** Shown under the field; replaced by `error` when there is one. */
  hint: string
  error?: string
  registration: UseFormRegisterReturn
}

/** A labelled whole-number input followed by "Days". */
export function DaysInput({ id, label, hint, error, registration }: DaysInputProps) {
  const describedBy = `${id}-hint`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <div className="flex items-center gap-2.5">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          className={cn('w-32', FIELD_CONTROL)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...registration}
        />
        <span className="text-sm text-muted-foreground">Days</span>
      </div>
      <p id={describedBy} className={error ? FIELD_ERROR : FIELD_HINT}>
        {error ?? hint}
      </p>
    </div>
  )
}
