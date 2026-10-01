import { errorMessage } from '@cl/api'
import { CircleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface LoadErrorProps {
  error: unknown
  onRetry: () => void
}

/** A destructive alert for a failed list load, with a Retry button. */
export function LoadError({ error, onRetry }: LoadErrorProps) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {errorMessage(error)}
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}
