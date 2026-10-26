import type { ManagerResponse } from '@cl/api'
import { CLIENT_FIELDS, managerOptions, type ClientDetailsField, type ClientDetailsInput } from '@cl/schemas'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router'

import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'

interface ClientDetailsFieldsProps {
  managers: readonly ManagerResponse[]
  managersLoading: boolean
  /** Overrides the discount hint (editing words it differently from onboarding). */
  discountHint?: string
}

/**
 * The client's own fields — name, phone, email, manager, birthday and discount — shared by Onboard Client
 * and Edit Client. Must render inside a FormProvider whose values include these fields.
 */
export function ClientDetailsFields({ managers, managersLoading, discountHint }: ClientDetailsFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ClientDetailsInput>()

  const textField = (field: Exclude<ClientDetailsField, 'managerId'>, type = 'text', hint = CLIENT_FIELDS[field].hint) => (
    <TextField
      id={`client-${field}`}
      label={CLIENT_FIELDS[field].label}
      placeholder={CLIENT_FIELDS[field].placeholder}
      hint={hint}
      type={type}
      autoComplete="off"
      error={errors[field]?.message}
      registration={register(field)}
    />
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {textField('firstName')}
        {textField('lastName')}
        {textField('phone', 'tel')}
        {textField('email', 'email')}
      </div>
      <SelectField
        id="client-managerId"
        label={CLIENT_FIELDS.managerId.label}
        placeholder={managersLoading ? 'Loading Managers…' : CLIENT_FIELDS.managerId.placeholder}
        options={managerOptions(managers, { withRole: true })}
        hint={CLIENT_FIELDS.managerId.hint}
        error={errors.managerId?.message}
        registration={register('managerId')}
      />
      {!managersLoading && managers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No Managers Yet.{' '}
          <Link to="/managers" className="font-bold text-brand hover:underline">
            Add A Manager
          </Link>{' '}
          To Assign One.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {textField('birthday', 'date')}
        {textField('discountPercent', 'number', discountHint ?? CLIENT_FIELDS.discountPercent.hint)}
      </div>
    </>
  )
}
