import { errorMessage, fieldErrors, type CatalogServiceResponse, type CompanyResponse, type ServiceAssignmentResponse } from '@cl/api'
import {
  ASSIGN_SERVICE_FIELDS,
  assignServiceFieldFromApi,
  assignServiceFormSchema,
  assignedCatalogService,
  catalogServiceOptions,
  chargeBreakdown,
  effectiveDiscount,
  isAssignServiceComplete,
  serviceDiscountHint,
  standardFeeHint,
  upcomingDueDates,
  type AssignServiceFormInput,
  type AssignServiceFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'

import { LoadError } from '@/components/LoadError'
import { FIELD_CONTROL, FIELD_HINT, FIELD_LABEL } from '@/components/form/fieldStyles'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { BillingBadge } from '@/components/services/BillingBadge'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { ChargeSummary } from './ChargeSummary'
import { DueSchedule } from './DueSchedule'

export interface ServiceAssignmentFormProps {
  company: CompanyResponse
  /** The service catalog: the choices when adding, the schedule and fee when editing. */
  catalog: readonly CatalogServiceResponse[]
  catalogLoading: boolean
  catalogError: Error | null
  onRetryCatalog: () => void
  saving: boolean
  onDone: () => void
}

interface Props extends ServiceAssignmentFormProps {
  title: string
  /** Screen-reader description of the sheet. */
  description: string
  submitLabel: string
  defaults: AssignServiceFormInput
  onSave: (values: AssignServiceFormValues) => Promise<unknown>
  /** Editing: the service is fixed (shown, not chosen) and the submit waits for a change. */
  assignment?: ServiceAssignmentResponse
  /** Left of Cancel in the footer, e.g. Edit Service's Delete Service. */
  footerStart?: ReactNode
}

/**
 * A side sheet for one service of a company — Add Service and Edit Service. The fee is the
 * catalog's standard fee; a blank discount takes the company's.
 */
export function ServiceAssignmentForm({
  company,
  catalog,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  saving,
  onDone,
  title,
  description,
  submitLabel,
  defaults,
  onSave,
  assignment,
  footerStart,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<AssignServiceFormInput, unknown, AssignServiceFormValues>({
    resolver: zodResolver(assignServiceFormSchema),
    defaultValues: defaults,
  })
  const values = useWatch({ control })
  const [formError, setFormError] = useState<string>()
  const service = assignment
    ? assignedCatalogService(assignment, catalog)
    : catalog.find((s) => s.id === values.serviceId)
  const options = catalogServiceOptions(catalog)
  // The discount the backend will apply (the entry, else the company's); none while invalid.
  const rate = effectiveDiscount(values.discountPercent, company.discountPercent)
  const charge = service?.standardFee != null && rate != null ? chargeBreakdown(service.standardFee, rate) : undefined

  const submit = handleSubmit(async (v) => {
    setFormError(undefined)
    try {
      await onSave(v)
      onDone()
    } catch (error) {
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = assignServiceFieldFromApi(path)
        return field ? [[field, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  // Editing never needs to choose from the catalog, so it can go ahead without it.
  const ready = !!assignment || (!catalogLoading && !catalogError)
  const empty = ready && !assignment && !options.length
  const blocked = saving || !ready || empty || !isAssignServiceComplete(values) || (!!assignment && !isDirty)

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">Services</span>
        <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {!assignment && catalogLoading && <Spinner />}
        {!assignment && catalogError && <LoadError error={catalogError} onRetry={onRetryCatalog} />}
        {empty && (
          <p className="text-sm text-muted-foreground">
            The Service Catalog Is Empty.{' '}
            <Link to="/services" className="font-bold text-brand hover:underline">
              Add A Service
            </Link>{' '}
            First.
          </p>
        )}
        {ready && !empty && (
          <>
            {assignment ? (
              <div className="flex flex-col gap-1.5">
                <span id="assign-service-label" className={FIELD_LABEL}>
                  {ASSIGN_SERVICE_FIELDS.serviceId.label}
                </span>
                <p
                  aria-labelledby="assign-service-label"
                  className={cn(FIELD_CONTROL, 'flex items-center rounded-md border border-input bg-muted px-3 dark:bg-muted')}
                >
                  {assignment.serviceName}
                </p>
              </div>
            ) : (
              <SelectField
                id="assign-serviceId"
                label={ASSIGN_SERVICE_FIELDS.serviceId.label}
                placeholder={ASSIGN_SERVICE_FIELDS.serviceId.placeholder}
                options={options}
                error={errors.serviceId?.message}
                registration={register('serviceId')}
              />
            )}
            {service && (
              <div className="-mt-2 flex items-center gap-2" data-testid="service-billing">
                {service.billingFrequency && <BillingBadge billing={service.billingFrequency} />}
                <span className={FIELD_HINT}>{standardFeeHint(service)}</span>
              </div>
            )}
            <TextField
              id="assign-deliveryDate"
              label={ASSIGN_SERVICE_FIELDS.deliveryDate.label}
              type="date"
              error={errors.deliveryDate?.message}
              registration={register('deliveryDate')}
            />
            <TextField
              id="assign-discountPercent"
              label={ASSIGN_SERVICE_FIELDS.discountPercent.label}
              hint={serviceDiscountHint(company)}
              type="number"
              error={errors.discountPercent?.message}
              registration={register('discountPercent')}
            />
            {charge && <ChargeSummary {...charge} />}
            <TextField
              id="assign-comment"
              label={ASSIGN_SERVICE_FIELDS.comment.label}
              placeholder={ASSIGN_SERVICE_FIELDS.comment.placeholder}
              autoComplete="off"
              error={errors.comment?.message}
              registration={register('comment')}
            />
            {service && <DueSchedule dates={upcomingDueDates(service, values.deliveryDate)} amount={charge?.net} />}
          </>
        )}
        {formError && <p className="text-sm text-destructive">{formError}</p>}
      </div>

      <SheetFooter className="flex-row items-center gap-3 border-t border-border p-6">
        {footerStart}
        <div className="ml-auto flex gap-3">
          <SheetClose asChild>
            <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" size="touch" disabled={blocked}>
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
