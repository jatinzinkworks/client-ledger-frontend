import { errorMessage, useFirmDetails, usePaymentTerms } from '@cl/api'
import { CircleAlert } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { Spinner } from '@/components/Spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  const paymentTerms = usePaymentTerms()
  const firmDetails = useFirmDetails()
  const resources = [paymentTerms, firmDetails]

  const isLoading = resources.some((r) => r.isLoading)
  const loadError = resources.find((r) => r.loadError)?.loadError
  const saveErrors = resources.flatMap((r) => (r.saveError ? [r.saveError] : []))
  const ready = !isLoading && !loadError

  return (
    <div className="flex max-w-[1080px] flex-col gap-6">
      {!ready && <PageHeader eyebrow="Applies To All Clients" title="Settings" />}
      {isLoading && <Spinner />}
      {loadError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {errorMessage(loadError)}
            <Button variant="outline" size="sm" onClick={() => resources.forEach((r) => r.loadError && r.refetch())}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {ready && (
        <SettingsForm
          paymentTerms={{ stored: paymentTerms.stored, save: paymentTerms.save }}
          firmDetails={{ stored: firmDetails.stored, save: firmDetails.save }}
        />
      )}
      {saveErrors.map((error, i) => (
        <Alert key={i} variant="destructive">
          <CircleAlert />
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
