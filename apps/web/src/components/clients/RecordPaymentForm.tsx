import { errorMessage, fieldErrors, type LedgerEntryResponse, type PaymentRequest } from '@cl/api'
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SETTLEMENT_NOTE,
  RECORD_PAYMENT_FIELDS,
  formatInr,
  isRecordPaymentComplete,
  paymentFieldFromApi,
  paymentFormDefaults,
  recordPaymentDefaults,
  recordPaymentFormSchema,
  suggestedPaymentAmount,
  toPaymentRequest,
  type RecordPaymentFormInput,
  type RecordPaymentFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { FIELD_HINT } from '@/components/form/fieldStyles'
import { ReadOnlyField } from '@/components/form/ReadOnlyField'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EYEBROW } from '@/utils/typography'

export interface PaymentCompany {
  id: string
  name: string
}

interface RecordPaymentFormProps {
  clientName: string
  /** The companies a payment can be for: one is shown fixed, several are a choice. */
  companies: readonly PaymentCompany[]
  /** What a company still owes (negative when overpaid); undefined while unknown. */
  pendingFor: (companyId: string) => number | undefined
  onSave: (companyId: string, request: PaymentRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
  /** Editing: the payment's ledger entry. The form starts from it and saves only once changed. */
  payment?: LedgerEntryResponse
  /** Left of Cancel in the footer (Edit Payment's Delete). */
  footerStart?: ReactNode
}

/**
 * The Record Payment side sheet: from a company's page (that company, fixed) or a client's
 * page (a choice of their companies). Given a `payment`, it is Edit Payment instead.
 */
export function RecordPaymentForm({
  clientName,
  companies,
  pendingFor,
  onSave,
  saving,
  onDone,
  payment,
  footerStart,
}: RecordPaymentFormProps) {
  const only = companies.length === 1 ? companies[0] : undefined
  const initialCompany = only?.id ?? ''
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getFieldState,
    formState: { errors, isDirty },
  } = useForm<RecordPaymentFormInput, unknown, RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: payment
      ? paymentFormDefaults(payment)
      : recordPaymentDefaults(initialCompany, initialCompany ? pendingFor(initialCompany) : undefined),
  })
  const values = useWatch({ control })
  const [formError, setFormError] = useState<string>()
  // What is pending already counts a payment being edited, so the strip is for new payments only.
  const pending = !payment && values.companyId ? pendingFor(values.companyId) : undefined

  const submit = handleSubmit(async (v) => {
    setFormError(undefined)
    try {
      await onSave(v.companyId, toPaymentRequest(v))
      onDone()
    } catch (error) {
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = paymentFieldFromApi(path)
        return field ? [[field, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  const field = RECORD_PAYMENT_FIELDS
  const companyRegistration = register('companyId', {
    // Suggest the newly chosen company's balance, unless the amount was typed in.
    onChange: (event: ChangeEvent<HTMLSelectElement>) => {
      if (!getFieldState('amountReceived').isDirty) {
        setValue('amountReceived', suggestedPaymentAmount(pendingFor(event.target.value)))
      }
    },
  })
  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <span className={EYEBROW}>Payments</span>
        <SheetTitle className="text-2xl font-bold">{payment ? 'Edit Payment' : 'Record Payment'}</SheetTitle>
        <SheetDescription className="sr-only">
          {payment ? 'Correct a payment received from' : 'Record a payment received from'} {clientName}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField id="payment-client" label="Client" value={clientName} />
          {only ? (
            <ReadOnlyField id="payment-company" label={field.companyId.label} value={only.name} />
          ) : (
            <SelectField
              id="payment-companyId"
              label={field.companyId.label}
              placeholder={field.companyId.placeholder}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              error={errors.companyId?.message}
              registration={companyRegistration}
            />
          )}
        </div>
        {pending != null && (
          <div className="flex items-center justify-between gap-4 rounded-md bg-muted px-5 py-4">
            <span className="text-muted-foreground">Pending For This Company</span>
            <span className="text-xl font-bold tabular-nums">{formatInr(pending)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="payment-amountReceived"
            label={field.amountReceived.label}
            type="number"
            error={errors.amountReceived?.message}
            registration={register('amountReceived')}
          />
          <TextField
            id="payment-dateReceived"
            label={field.dateReceived.label}
            type="date"
            error={errors.dateReceived?.message}
            registration={register('dateReceived')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            id="payment-method"
            label={field.method.label}
            options={PAYMENT_METHOD_OPTIONS}
            error={errors.method?.message}
            registration={register('method')}
          />
          <TextField
            id="payment-reference"
            label={field.reference.label}
            placeholder={field.reference.placeholder}
            autoComplete="off"
            error={errors.reference?.message}
            registration={register('reference')}
          />
        </div>
        <TextField
          id="payment-comment"
          label={field.comment.label}
          placeholder={field.comment.placeholder}
          hint={field.comment.hint}
          multiline
          error={errors.comment?.message}
          registration={register('comment')}
        />
        <p className={FIELD_HINT}>{PAYMENT_SETTLEMENT_NOTE}</p>
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
          <Button
            type="submit"
            size="touch"
            disabled={saving || !isRecordPaymentComplete(values) || (!!payment && !isDirty)}
          >
            {saving ? 'Saving…' : payment ? 'Save Changes' : 'Save Payment'}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
