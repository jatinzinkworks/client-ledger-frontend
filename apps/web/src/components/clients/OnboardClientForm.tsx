import { errorMessage, fieldErrors, isNotFound, type ClientRequest, type ManagerResponse } from '@cl/api'
import {
  MAX_COMPANIES,
  clientFieldFromApi,
  clientFormDefaults,
  clientFormSchema,
  isClientFormComplete,
  toClientRequest,
  type ClientFormInput,
  type ClientFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm, useWatch, type Path } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { ClientDetailsFields } from './ClientDetailsFields'
import { CompanyListFields } from './CompanyListFields'
import { EYEBROW } from '@/utils/typography'

const SECTION_LABEL = EYEBROW

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
  const { control, setError } = form
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
          <ClientDetailsFields managers={managers} managersLoading={managersLoading} />

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <span className={SECTION_LABEL}>Companies</span>
            <CompanyListFields max={MAX_COMPANIES} />
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
