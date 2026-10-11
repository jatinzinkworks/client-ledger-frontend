import { errorMessage, fieldErrors, type ClientResponse, type ClientUpdateRequest, type ManagerResponse } from '@cl/api'
import {
  CLIENT_FIELDS,
  DELETE_CLIENT_IN_USE,
  EDIT_DISCOUNT_HINT,
  clientName,
  clientDetailsDefaults,
  clientDetailsSchema,
  deleteClientWarning,
  isClientDetailsComplete,
  toClientUpdateRequest,
  type ClientDetailsInput,
  type ClientDetailsValues,
  type ClientField,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

import { DeleteButton } from '@/components/DeleteButton'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { ClientDetailsFields } from './ClientDetailsFields'

interface EditClientFormProps {
  client: ClientResponse
  managers: readonly ManagerResponse[]
  managersLoading: boolean
  onSave: (request: ClientUpdateRequest) => Promise<unknown>
  saving: boolean
  onDelete: () => Promise<unknown>
  deleting: boolean
  /** After a save; the sheet closes. */
  onDone: () => void
  /** After a delete; the client page is gone, so the screen moves on. */
  onDeleted: () => void
}

/** The Edit Client side sheet: the client's own details only; companies are left as they are. */
export function EditClientForm({
  client,
  managers,
  managersLoading,
  onSave,
  saving,
  onDelete,
  deleting,
  onDone,
  onDeleted,
}: EditClientFormProps) {
  const form = useForm<ClientDetailsInput, unknown, ClientDetailsValues>({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: clientDetailsDefaults(client),
  })
  const {
    control,
    setError,
    formState: { isDirty },
  } = form
  const complete = isClientDetailsComplete(useWatch({ control }))
  const [formError, setFormError] = useState<string>()

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined)
    try {
      await onSave(toClientUpdateRequest(values))
      onDone()
    } catch (error) {
      // Only the client's own fields are on this form; anything else is reported as a whole.
      const byField = Object.entries(fieldErrors(error)).filter(([path]) => path in CLIENT_FIELDS) as [ClientField, string][]
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <SheetHeader className="gap-1 border-b border-border p-6">
          <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">Clients</span>
          <SheetTitle className="text-2xl font-bold">Edit Client</SheetTitle>
          <SheetDescription className="sr-only">Change the client's contact details, manager and discount</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <ClientDetailsFields managers={managers} managersLoading={managersLoading} discountHint={EDIT_DISCOUNT_HINT} />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <SheetFooter className="flex-row items-center gap-3 border-t border-border p-6">
          <DeleteButton
            label="Delete Client"
            itemName={clientName(client) || 'This Client'}
            description={deleteClientWarning(client)}
            conflictMessage={DELETE_CLIENT_IN_USE}
            onDelete={async () => {
              await onDelete()
              onDeleted()
            }}
            deleting={deleting}
          />
          <div className="ml-auto flex gap-3">
            <SheetClose asChild>
              <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" size="touch" disabled={saving || !isDirty || !complete}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </FormProvider>
  )
}
