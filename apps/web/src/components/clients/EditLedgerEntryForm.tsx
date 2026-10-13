import { errorMessage, fieldErrors, type LedgerEntryResponse, type LedgerEntryUpdateRequest } from '@cl/api'
import {
  DELETE_LEDGER_ENTRY_WARNING,
  LEDGER_ENTRY_FIELDS,
  chargeBreakdown,
  formatApiDate,
  gstRateOptions,
  ledgerEntryDefaults,
  ledgerEntryFieldFromApi,
  ledgerEntryFormSchema,
  ledgerEntryName,
  toLedgerEntryUpdateRequest,
  type LedgerEntryFormInput,
  type LedgerEntryFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { DeleteButton } from '@/components/DeleteButton'
import { ReadOnlyField } from '@/components/form/ReadOnlyField'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { ChargeSummary } from './ChargeSummary'

interface EditLedgerEntryFormProps {
  entry: LedgerEntryResponse
  onSave: (request: LedgerEntryUpdateRequest) => Promise<unknown>
  saving: boolean
  onDelete: () => Promise<unknown>
  deleting: boolean
  onDone: () => void
}

/**
 * The Edit Ledger Entry side sheet: correct an entry's fee, discount and GST rate (what it bills
 * and when are shown, not changed), and Delete Entry.
 */
export function EditLedgerEntryForm({ entry, onSave, saving, onDelete, deleting, onDone }: EditLedgerEntryFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<LedgerEntryFormInput, unknown, LedgerEntryFormValues>({
    resolver: zodResolver(ledgerEntryFormSchema),
    defaultValues: ledgerEntryDefaults(entry),
  })
  const values = useWatch({ control })
  const [formError, setFormError] = useState<string>()
  // Preview the amounts the backend will work out, while the entries are valid.
  const parsed = ledgerEntryFormSchema.safeParse(values)
  const charge = parsed.success
    ? chargeBreakdown(parsed.data.serviceFee, parsed.data.discountPercent, parsed.data.gstRatePercent)
    : undefined

  const submit = handleSubmit(async (v) => {
    setFormError(undefined)
    try {
      await onSave(toLedgerEntryUpdateRequest(v))
      onDone()
    } catch (error) {
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = ledgerEntryFieldFromApi(path)
        return field ? [[field, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  const field = LEDGER_ENTRY_FIELDS
  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">Ledger</span>
        <SheetTitle className="text-2xl font-bold">Edit Ledger Entry</SheetTitle>
        <SheetDescription className="sr-only">Correct the rates of {ledgerEntryName(entry)}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        <ReadOnlyField id="entry-service" label="Service" value={entry.serviceName ?? ''} />
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField id="entry-dueDate" label="Due Date" value={formatApiDate(entry.dueDate)} />
          <ReadOnlyField id="entry-financialYear" label="Financial Year" value={entry.financialYear ?? ''} />
        </div>
        <TextField
          id="entry-serviceFee"
          label={field.serviceFee.label}
          hint={field.serviceFee.hint}
          type="number"
          error={errors.serviceFee?.message}
          registration={register('serviceFee')}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="entry-discountPercent"
            label={field.discountPercent.label}
            type="number"
            error={errors.discountPercent?.message}
            registration={register('discountPercent')}
          />
          <SelectField
            id="entry-gstRatePercent"
            label={field.gstRatePercent.label}
            options={gstRateOptions(entry.gstRatePercent)}
            error={errors.gstRatePercent?.message}
            registration={register('gstRatePercent')}
          />
        </div>
        {charge && <ChargeSummary {...charge} />}
        {formError && <p className="text-sm text-destructive">{formError}</p>}
      </div>

      <SheetFooter className="flex-row items-center gap-3 border-t border-border p-6">
        <DeleteButton
          label="Delete Entry"
          itemName={ledgerEntryName(entry)}
          description={DELETE_LEDGER_ENTRY_WARNING}
          onDelete={async () => {
            await onDelete()
            onDone()
          }}
          deleting={deleting}
        />
        <div className="ml-auto flex gap-3">
          <SheetClose asChild>
            <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" size="touch" disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
