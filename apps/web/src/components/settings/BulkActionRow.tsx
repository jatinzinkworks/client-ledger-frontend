import { bulkActionError, bulkFailuresTitle, type BulkActionCopy, type BulkOutcome } from '@cl/schemas'
import { CircleCheck, Play } from 'lucide-react'
import { useState } from 'react'

import { Spinner } from '@/components/Spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface BulkActionRowProps {
  action: BulkActionCopy
  onRun: () => Promise<BulkOutcome>
  running: boolean
}

/**
 * One bulk action: what it does and its button. It reaches every client, so it asks first; the
 * dialog then says what it did and lists anyone it failed for, or why it did not run at all.
 */
export function BulkActionRow({ action, onRun, running }: BulkActionRowProps) {
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<BulkOutcome>()
  const [error, setError] = useState<string>()

  const openChange = (next: boolean) => {
    if (running) return // the run cannot be called off, so the dialog stays to report it
    setOpen(next)
    if (next) {
      setOutcome(undefined)
      setError(undefined)
    }
  }

  const run = async (event: React.MouseEvent) => {
    event.preventDefault() // keep the dialog open to show the outcome
    setError(undefined)
    try {
      setOutcome(await onRun())
    } catch (e) {
      setError(bulkActionError(e))
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
        <h3 className="font-bold">{action.title}</h3>
        <p className="text-sm text-muted-foreground">{action.description}</p>
      </div>
      <AlertDialog open={open} onOpenChange={openChange}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" className="border-primary/50 bg-card">
            <Play /> {action.label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {outcome && <CircleCheck aria-hidden className="size-6 shrink-0 text-success" />}
              {outcome ? action.title : action.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>{outcome?.summary ?? action.confirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          {outcome && outcome.failures.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-destructive">{bulkFailuresTitle(outcome.failures.length)}</p>
              <ul className="flex max-h-60 flex-col gap-1.5 overflow-y-auto text-sm">
                {outcome.failures.map((f) => (
                  <li key={f.key}>
                    <span className="font-bold">{f.name}</span>
                    <span className="text-muted-foreground"> — {f.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            {outcome ? (
              <AlertDialogCancel>Done</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={run} disabled={running}>
                  {running ? <Spinner className="size-4" label={action.runningLabel} /> : <Play />}
                  {running ? action.runningLabel : action.label}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
