import type { HTMLInputTypeAttribute } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { FIELD_CONTROL, FIELD_ERROR, FIELD_LABEL } from './fieldStyles'

interface TextFieldProps {
  id: string
  label: string
  error?: string
  registration: UseFormRegisterReturn
  /** Render a resizable textarea instead of a single-line input. */
  multiline?: boolean
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  className?: string
}

/** A labelled text input (or textarea) with its validation message underneath. */
export function TextField({ id, label, error, registration, multiline, type = 'text', autoComplete, className }: TextFieldProps) {
  const errorId = `${id}-error`
  const shared = {
    id,
    autoComplete,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
    ...registration,
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      {multiline ? (
        <Textarea
          rows={3}
          className={cn('min-h-24 bg-card text-[15px] md:text-[15px] dark:bg-input/30', className)}
          {...shared}
        />
      ) : (
        <Input type={type} className={cn(FIELD_CONTROL, className)} {...shared} />
      )}
      {error && (
        <p id={errorId} className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  )
}
