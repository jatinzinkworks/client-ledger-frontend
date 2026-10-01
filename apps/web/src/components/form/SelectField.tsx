import type { UseFormRegisterReturn } from 'react-hook-form'

import { FIELD_ERROR, FIELD_LABEL } from './fieldStyles'
import { NativeSelect, type SelectOption } from './NativeSelect'

interface SelectFieldProps {
  id: string
  label: string
  options: readonly SelectOption[]
  error?: string
  registration: UseFormRegisterReturn
  /** Shown as a disabled first option when the value may be blank. */
  placeholder?: string
}

/** A labelled NativeSelect bound to a react-hook-form field, with its validation message. */
export function SelectField({ id, label, options, error, registration, placeholder }: SelectFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <NativeSelect
        id={id}
        options={placeholder ? [{ value: '', label: placeholder }, ...options] : options}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <p id={errorId} className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  )
}
