import type { UseFormRegisterReturn } from 'react-hook-form'

import { FIELD_ERROR, FIELD_HINT, FIELD_LABEL } from './fieldStyles'
import { NativeSelect, type SelectOption } from './NativeSelect'

interface SelectFieldProps {
  id: string
  label: string
  options: readonly SelectOption[]
  error?: string
  registration: UseFormRegisterReturn
  /** Shown as a disabled first option when the value may be blank. */
  placeholder?: string
  /** Help text under the control, replaced by the error when there is one. */
  hint?: string
}

/** A labelled NativeSelect bound to a react-hook-form field, with its validation message. */
export function SelectField({ id, label, options, error, registration, placeholder, hint }: SelectFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <NativeSelect
        id={id}
        options={placeholder ? [{ value: '', label: placeholder }, ...options] : options}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...registration}
      />
      {error ? (
        <p id={errorId} className={FIELD_ERROR}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={FIELD_HINT}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}
