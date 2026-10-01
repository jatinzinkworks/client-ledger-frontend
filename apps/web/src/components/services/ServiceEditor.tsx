import { ApiError, errorMessage, fieldErrors, type CatalogServiceRequest, type CatalogServiceResponse } from '@cl/api'
import {
  BILLING_OPTIONS,
  CATEGORY_OPTIONS,
  SERVICE_FIELD_LABELS,
  gstRateOptions,
  scheduleDefaultsFor,
  serviceFieldFromApi,
  serviceFormDefaults,
  serviceFormSchema,
  toServiceRequest,
  usageLabel,
  type BillingFrequency,
  type Category,
  type ServiceFormInput,
  type ServiceFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { DeleteButton } from '@/components/DeleteButton'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { InvoiceScheduleFields } from './InvoiceScheduleFields'

interface ServiceEditorProps {
  /** The service being edited, or undefined to create one. */
  service?: CatalogServiceResponse
  /** Category a new service starts in (the active filter). */
  defaultCategory?: Category
  onSave: (request: CatalogServiceRequest) => Promise<unknown>
  onDelete: () => Promise<unknown>
  saving: boolean
  deleting: boolean
  onDone: () => void
}

/** The create / edit form shown in the side sheet. */
export function ServiceEditor({ service, defaultCategory, onSave, onDelete, saving, deleting, onDone }: ServiceEditorProps) {
  const isNew = !service
  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: serviceFormDefaults(service, defaultCategory),
  })
  const {
    register,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = form
  const [formError, setFormError] = useState<string>()

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined)
    try {
      await onSave(toServiceRequest(values))
      onDone()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('serviceName', { message: 'A Service With This Name Already Exists.' })
        return
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = serviceFieldFromApi(path)
        return field ? [[field, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  // Switching billing pre-fills the schedule month it now needs, rather than leaving a blank.
  const onBillingChange = (billing: BillingFrequency) => {
    const defaults = scheduleDefaultsFor(billing)
    if (!getValues('monthOfQuarter')) setValue('monthOfQuarter', defaults.monthOfQuarter)
    if (!getValues('month')) setValue('month', defaults.month)
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <SheetHeader className="gap-1 border-b border-border p-6">
          <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">Service Catalog</span>
          <SheetTitle className="text-2xl font-bold">{isNew ? 'New Service' : 'Edit Service'}</SheetTitle>
          <SheetDescription className="sr-only">
            {isNew ? 'Add a service to the catalog' : `Edit ${service.serviceName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          {!isNew && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              Used By {usageLabel(service.usedByCompanies).replace('Not Used Yet', 'No Companies Yet')}
            </div>
          )}
          <TextField
            id="service-serviceName"
            label={SERVICE_FIELD_LABELS.serviceName}
            error={errors.serviceName?.message}
            registration={register('serviceName')}
          />
          <TextField
            id="service-description"
            label={SERVICE_FIELD_LABELS.description}
            error={errors.description?.message}
            registration={register('description')}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="service-category"
              label={SERVICE_FIELD_LABELS.category}
              options={CATEGORY_OPTIONS}
              error={errors.category?.message}
              registration={register('category')}
            />
            <SelectField
              id="service-billingFrequency"
              label={SERVICE_FIELD_LABELS.billingFrequency}
              options={BILLING_OPTIONS}
              error={errors.billingFrequency?.message}
              registration={register('billingFrequency', {
                onChange: (e) => onBillingChange(e.target.value as BillingFrequency),
              })}
            />
            <TextField
              id="service-standardFee"
              label={SERVICE_FIELD_LABELS.standardFee}
              type="number"
              error={errors.standardFee?.message}
              registration={register('standardFee')}
            />
            <SelectField
              id="service-gstRatePercent"
              label={SERVICE_FIELD_LABELS.gstRatePercent}
              options={gstRateOptions(service?.gstRatePercent)}
              error={errors.gstRatePercent?.message}
              registration={register('gstRatePercent')}
            />
          </div>
          <InvoiceScheduleFields />
          {!isNew && (
            <p className="text-xs text-muted-foreground">
              Fee Changes Apply To New Charges Only. Past Charges Keep Their Original Amount.
            </p>
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <SheetFooter className="flex-row items-center gap-3 border-t border-border p-6">
          {!isNew && (
            <DeleteButton
              label="Delete Service"
              itemName={service.serviceName ?? 'This Service'}
              description="The Service Is Removed From The Catalog. This Cannot Be Undone."
              disabledReason={service.usedByCompanies ? 'Companies Still Subscribe To This Service' : undefined}
              onDelete={async () => {
                await onDelete()
                onDone()
              }}
              deleting={deleting}
            />
          )}
          <div className="ml-auto flex gap-3">
            <SheetClose asChild>
              <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" size="touch" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Add Service' : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </FormProvider>
  )
}
