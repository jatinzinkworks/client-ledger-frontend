import { ApiError, errorMessage, fieldErrors, type ManagerRequest, type ManagerResponse } from '@cl/api'
import {
  MANAGER_EMAIL_HINT,
  MANAGER_FIELD_LABELS,
  ROLE_OPTIONS,
  managerClientsLabel,
  managerFieldFromApi,
  managerFormDefaults,
  managerFormSchema,
  managerName,
  toManagerRequest,
  type ManagerFormInput,
  type ManagerFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { DeleteButton } from '@/components/DeleteButton'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EYEBROW } from '@/utils/typography'

interface ManagerEditorProps {
  /** The manager being edited, or undefined to add one. */
  manager?: ManagerResponse
  onSave: (request: ManagerRequest) => Promise<unknown>
  onDelete: () => Promise<unknown>
  saving: boolean
  deleting: boolean
  onDone: () => void
  /** Shown under the fields when editing, e.g. the manager's clients. */
  clients?: ReactNode
}

/** The add / edit form shown in the side sheet. */
export function ManagerEditor({ manager, onSave, onDelete, saving, deleting, onDone, clients }: ManagerEditorProps) {
  const isNew = !manager
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ManagerFormInput, unknown, ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: managerFormDefaults(manager),
  })
  const [formError, setFormError] = useState<string>()

  const submit = handleSubmit(async (values) => {
    setFormError(undefined)
    try {
      await onSave(toManagerRequest(values))
      onDone()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: 'A Manager With This Email Already Exists.' })
        return
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = managerFieldFromApi(path)
        return field ? [[field, message] as const] : []
      })
      byField.forEach(([field, message]) => setError(field, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  const textField = (
    field: Exclude<keyof ManagerFormInput, 'role'>,
    type = 'text',
    autoComplete?: string,
    hint?: string,
  ) => (
    <TextField
      id={`manager-${field}`}
      label={MANAGER_FIELD_LABELS[field]}
      type={type}
      autoComplete={autoComplete}
      hint={hint}
      error={errors[field]?.message}
      registration={register(field)}
    />
  )

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <span className={EYEBROW}>Managers</span>
        <SheetTitle className="text-2xl font-bold">{isNew ? 'Add Manager' : 'Edit Manager'}</SheetTitle>
        <SheetDescription className="sr-only">
          {isNew ? 'Add a manager to the team' : `Edit ${managerName(manager)}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        {!isNew && (
          <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
            Looks After {managerClientsLabel(manager.clientCount)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {textField('firstName', 'text', 'off')}
          {textField('lastName', 'text', 'off')}
        </div>
        {textField('email', 'email', 'off', MANAGER_EMAIL_HINT)}
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            id="manager-role"
            label={MANAGER_FIELD_LABELS.role}
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            registration={register('role')}
          />
          {textField('mobileNumber', 'tel', 'off')}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        {!isNew && clients}
      </div>

      <SheetFooter className="flex-row items-center gap-3 border-t border-border p-6">
        {!isNew && (
          <DeleteButton
            label="Delete Manager"
            itemName={managerName(manager) || 'This Manager'}
            description="The Manager Is Removed From The Team. This Cannot Be Undone."
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
            {saving ? 'Saving…' : isNew ? 'Add Manager' : 'Save Changes'}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
