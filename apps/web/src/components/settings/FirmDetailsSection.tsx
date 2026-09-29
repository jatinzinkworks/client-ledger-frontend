import { FIRM_DETAILS_FIELDS, FIRM_DETAILS_SECTION, type FirmDetailsField, type FirmDetailsFormInput } from '@cl/schemas'
import type { HTMLInputTypeAttribute } from 'react'
import { useFormContext } from 'react-hook-form'

import { TextField } from '@/components/form/TextField'
import { cn } from '@/lib/utils'

import { SettingsSection } from './SettingsSection'

interface FieldConfig {
  name: FirmDetailsField
  /** Spans both columns on wider screens. */
  full?: boolean
  multiline?: boolean
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  className?: string
}

// Layout from the mock: name full width, then GSTIN | FRN, Email | Phone, address full width.
const FIELDS: readonly FieldConfig[] = [
  { name: 'firmName', full: true, autoComplete: 'organization' },
  { name: 'gstin', className: 'uppercase' },
  { name: 'firmRegistrationNo' },
  { name: 'email', type: 'email', autoComplete: 'email' },
  { name: 'phone', type: 'tel', autoComplete: 'tel' },
  { name: 'address', full: true, multiline: true, autoComplete: 'street-address' },
]

/** Firm Details fields; must render inside its section form's FormProvider. */
export function FirmDetailsSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FirmDetailsFormInput>()

  return (
    <SettingsSection {...FIRM_DETAILS_SECTION}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {FIELDS.map(({ name, full, ...field }) => (
          <div key={name} className={cn(full && 'sm:col-span-2')}>
            <TextField
              id={`firm-${name}`}
              label={FIRM_DETAILS_FIELDS[name].label}
              error={errors[name]?.message}
              registration={register(name)}
              {...field}
            />
          </div>
        ))}
      </div>
    </SettingsSection>
  )
}
