import { errorMessage, fieldErrors, isNotFound, type ClientRequest, type ManagerResponse } from '@cl/api'
import {
  CLIENT_FIELDS,
  MAX_COMPANIES,
  clientFieldFromApi,
  clientFormDefaults,
  clientFormSchema,
  emptyCompany,
  isClientFormComplete,
  managerOptions,
  toClientRequest,
  type ClientField,
  type ClientFormInput,
  type ClientFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useFieldArray, useForm, useWatch, type Path } from 'react-hook-form'
import { Link } from 'react-router'

import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { CompanyFields } from './CompanyFields'

const SECTION_LABEL = 'font-mono text-[11px] tracking-[0.08em] text-brand uppercase'

interface OnboardClientFormProps {
  managers: readonly ManagerResponse[]
  managersLoading: boolean
  onSave: (request: ClientRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
}

/** The Onboard Client side sheet: the client's details, their manager and one or more companies. */
export function OnboardClientForm({ managers, managersLoading, onSave, saving, onDone }: OnboardClientFormProps) {
  const form = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientFormDefaults(),
  })
  const {
    register,
    control,
    setError,
    formState: { errors },
  } = form
  const companies = useFieldArray({ control, name: 'companies' })
  // Onboard stays disabled until every mandatory field has a value (the discount is optional).
  const complete = isClientFormComplete(useWatch({ control }))
  const [formError, setFormError] = useState<string>()

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined)
    try {
      await onSave(toClientRequest(values))
      onDone()
    } catch (error) {
      // 404 on create means the chosen manager was removed meanwhile.
      if (isNotFound(error)) {
        setError('managerId', { message: 'This Manager No Longer Exists. Choose Another.' })
        return
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = clientFieldFromApi(path)
        return field ? [[field as Path<ClientFormInput>, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  const textField = (field: Exclude<ClientField, 'managerId'>, type = 'text') => (
    <TextField
      id={`client-${field}`}
      label={CLIENT_FIELDS[field].label}
      placeholder={CLIENT_FIELDS[field].placeholder}
      hint={CLIENT_FIELDS[field].hint}
      type={type}
      autoComplete="off"
      error={errors[field]?.message}
      registration={register(field)}
    />
  )

  const noManagers = !managersLoading && managers.length === 0

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <SheetHeader className="gap-1 border-b border-border p-6">
          <span className={SECTION_LABEL}>Clients</span>
          <SheetTitle className="text-2xl font-bold">Onboard Client</SheetTitle>
          <SheetDescription className="sr-only">Add a client with their manager and companies</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <span className={SECTION_LABEL}>Client</span>
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
            options={managerOptions(managers)}
            hint={CLIENT_FIELDS.managerId.hint}
            error={errors.managerId?.message}
            registration={register('managerId')}
          />
          {noManagers && (
            <p className="text-sm text-muted-foreground">
              No Managers Yet.{' '}
              <Link to="/managers" className="font-bold text-brand hover:underline">
                Add A Manager
              </Link>{' '}
              Before Onboarding A Client.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">{textField('discountPercent', 'number')}</div>

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <span className={SECTION_LABEL}>Companies</span>
            {companies.fields.map((company, index) => (
              <CompanyFields
                key={company.id}
                index={index}
                onRemove={companies.fields.length > 1 ? () => companies.remove(index) : undefined}
              />
            ))}
            {errors.companies?.root?.message && (
              <p className="text-sm text-destructive">{errors.companies.root.message}</p>
            )}
            {companies.fields.length < MAX_COMPANIES && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => companies.append(emptyCompany())}
                className="self-start px-2 font-bold text-brand hover:text-brand"
              >
                <Plus /> Add Another Company
              </Button>
            )}
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-border p-6">
          <SheetClose asChild>
            <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" size="touch" disabled={saving || noManagers || !complete}>
            {saving ? 'Onboarding…' : 'Onboard Client'}
          </Button>
        </SheetFooter>
      </form>
    </FormProvider>
  )
}
