import type { FirmDetailsRequest, FirmDetailsResponse, PaymentTermsRequest, PaymentTermsResponse } from '@cl/api'
import {
  firmDetailsFormDefaults,
  firmDetailsFormSchema,
  paymentTermsFormDefaults,
  paymentTermsFormSchema,
  toFirmDetailsRequest,
  toPaymentTermsRequest,
  type FirmDetailsFormInput,
  type FirmDetailsFormValues,
  type PaymentTermsFormInput,
  type PaymentTermsFormValues,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { FirmDetailsSection } from './FirmDetailsSection'
import { PaymentTermsSection } from './PaymentTermsSection'
import { saveSection } from './saveSection'

/** What the form needs from one singleton settings resource. */
export interface SettingsResource<TStored, TRequest> {
  stored?: TStored
  save: (request: TRequest) => Promise<unknown>
}

interface SettingsFormProps {
  paymentTerms: SettingsResource<PaymentTermsResponse, PaymentTermsRequest>
  firmDetails: SettingsResource<FirmDetailsResponse, FirmDetailsRequest>
}

/**
 * The Settings screen. Each section is its own form backed by its own endpoint, so an
 * unconfigured section never blocks saving another. The header's Save validates every
 * changed section first and only then saves them; Discard resets them all.
 */
export function SettingsForm({ paymentTerms, firmDetails }: SettingsFormProps) {
  // `values` re-seeds a section whenever its stored record changes (e.g. after a save).
  const paymentTermsValues = useMemo(() => paymentTermsFormDefaults(paymentTerms.stored), [paymentTerms.stored])
  const paymentTermsForm = useForm<PaymentTermsFormInput, unknown, PaymentTermsFormValues>({
    resolver: zodResolver(paymentTermsFormSchema),
    values: paymentTermsValues,
  })
  const firmDetailsValues = useMemo(() => firmDetailsFormDefaults(firmDetails.stored), [firmDetails.stored])
  const firmDetailsForm = useForm<FirmDetailsFormInput, unknown, FirmDetailsFormValues>({
    resolver: zodResolver(firmDetailsFormSchema),
    values: firmDetailsValues,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const paymentTermsDirty = paymentTermsForm.formState.isDirty
  const firmDetailsDirty = firmDetailsForm.formState.isDirty
  const isDirty = paymentTermsDirty || firmDetailsDirty

  const saveAll = async (event: FormEvent) => {
    event.preventDefault()
    setSaved(false)
    // Validate every changed section before saving any, so nothing is half-saved.
    const checks = [paymentTermsDirty && paymentTermsForm.trigger(), firmDetailsDirty && firmDetailsForm.trigger()]
    if (!(await Promise.all(checks)).every((ok) => ok !== false)) return

    setSaving(true)
    const results = await Promise.all([
      paymentTermsDirty && saveSection(paymentTermsForm, (v) => paymentTerms.save(toPaymentTermsRequest(v))),
      firmDetailsDirty && saveSection(firmDetailsForm, (v) => firmDetails.save(toFirmDetailsRequest(v))),
    ])
    setSaving(false)
    setSaved(results.every((ok) => ok !== false))
  }

  const discardAll = () => {
    paymentTermsForm.reset()
    firmDetailsForm.reset()
  }

  return (
    <form onSubmit={saveAll} noValidate className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Applies To All Clients"
        title="Settings"
        actions={
          <>
            {isDirty && <span className="text-sm text-muted-foreground">Unsaved Changes</span>}
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="border-primary/50 bg-card"
              disabled={!isDirty || saving}
              onClick={discardAll}
            >
              Discard Changes
            </Button>
            <Button type="submit" size="touch" disabled={!isDirty || saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </>
        }
      />
      {saved && !isDirty && (
        <Alert className="border-success/40 bg-success/10 text-success">
          <CircleCheck />
          <AlertDescription className="text-success">
            Settings Saved. Due Dates And Overdue Status Are Updated Everywhere.
          </AlertDescription>
        </Alert>
      )}
      <FormProvider {...paymentTermsForm}>
        <PaymentTermsSection />
      </FormProvider>
      <FormProvider {...firmDetailsForm}>
        <FirmDetailsSection />
      </FormProvider>
    </form>
  )
}
