import { ApiError, errorMessage, fieldErrors, type CompanyRequest } from '@cl/api'
import {
  COMPANY_FIELDS,
  addCompanyFormSchema,
  areCompaniesComplete,
  hasOpeningBalance,
  toCompanyRequest,
  type AddCompanyFormInput,
  type AddCompanyFormValues,
  type CompanyField,
  type CompanyFormInput,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { CompanyFields } from './CompanyFields'
import { EYEBROW } from '@/utils/typography'

interface CompanyFormProps {
  title: string
  /** Screen-reader description of the sheet. */
  description: string
  submitLabel: string
  defaults: CompanyFormInput
  onSave: (request: CompanyRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
  /** Editing: keep the submit disabled until something changes. */
  requireChange?: boolean
  /** Edit Company: a blank opening balance keeps the stored one (0 removes it). */
  editing?: boolean
  /** Shown instead of the backend's message when it refuses with 409. */
  conflictMessage?: string
  /** Replaces the fields, e.g. when the client can hold no more companies. */
  unavailable?: ReactNode
  /** Left of Cancel in the footer, e.g. Edit Company's Delete Company. */
  footerStart?: ReactNode
}

/**
 * A side sheet for one company of a client — Add Company and Edit Company. The form holds a
 * one-item `companies` array so it reuses the onboarding company block.
 */
export function CompanyForm({
  title,
  description,
  submitLabel,
  defaults,
  onSave,
  saving,
  onDone,
  requireChange = false,
  editing = false,
  conflictMessage,
  unavailable,
  footerStart,
}: CompanyFormProps) {
  const form = useForm<AddCompanyFormInput, unknown, AddCompanyFormValues>({
    resolver: zodResolver(addCompanyFormSchema),
    defaultValues: { companies: [defaults] },
  })
  const {
    control,
    setError,
    formState: { isDirty },
  } = form
  const companies = useWatch({ control, name: 'companies' })
  const [formError, setFormError] = useState<string>()

  const submit = form.handleSubmit(async ({ companies: [company] }) => {
    setFormError(undefined)
    try {
      await onSave(toCompanyRequest(company, { editing, hadOpeningBalance: hasOpeningBalance(defaults) }))
      onDone()
    } catch (error) {
      if (conflictMessage && error instanceof ApiError && error.status === 409) {
        setFormError(conflictMessage)
        return
      }
      const byField = Object.entries(fieldErrors(error)).filter(([path]) => path in COMPANY_FIELDS) as [CompanyField, string][]
      byField.forEach(([field, message]) => setError(`companies.0.${field}`, { message }))
      if (!byField.length) setFormError(errorMessage(error))
    }
  })

  const blocked = saving || !!unavailable || !areCompaniesComplete(companies) || (requireChange && !isDirty)

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <SheetHeader className="gap-1 border-b border-border p-6">
          <span className={EYEBROW}>Clients</span>
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {unavailable ?? <CompanyFields index={0} editing={editing} />}
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
    </FormProvider>
  )
}
