import type { LedgerSummaryEmailResponse } from '@cl/api'
import { EMAIL_LEDGER_LABEL, EMAIL_LEDGER_TITLE, EMAIL_SENT_TITLE, ledgerEmailError, ledgerEmailSentMessage } from '@cl/schemas'
import { CircleCheck, Mail } from 'lucide-react'
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

interface EmailLedgerButtonProps {
  /** What sending does, from `clientLedgerEmailDescription` / `companyLedgerEmailDescription`. */
  description: string
  /** The button's tooltip, from `ledgerEmailTooltip`. */
  tooltip: string
  onSend: () => Promise<LedgerSummaryEmailResponse>
  sending: boolean
  /** A small mail icon (e.g. beside a name in a list) instead of the labelled button. */
  iconOnly?: boolean
  /** Who it is for, naming the icon for screen readers: "Email Summary: Rohan Mehta". */
  itemName?: string
}

/**
 * "Email Summary" in a page header. It emails the client, so it asks first; the dialog then says
 * who it went to, or why it was not sent (Send again to retry).
 */
export function EmailLedgerButton({ description, tooltip, onSend, sending, iconOnly = false, itemName }: EmailLedgerButtonProps) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState<string>()
  const [error, setError] = useState<string>()

  const openChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSent(undefined)
      setError(undefined)
    }
  }

  const send = async (event: React.MouseEvent) => {
    event.preventDefault() // keep the dialog open to show the outcome
    setError(undefined)
    try {
      setSent(ledgerEmailSentMessage(await onSend()))
    } catch (e) {
      setError(ledgerEmailError(e))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={openChange}>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={itemName ? `${EMAIL_LEDGER_LABEL}: ${itemName}` : EMAIL_LEDGER_LABEL}
            title={tooltip}
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-brand"
          >
            <Mail className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="border-primary/50 bg-card"
            title={tooltip}
          >
            <Mail /> {EMAIL_LEDGER_LABEL}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {sent && <CircleCheck aria-hidden className="size-6 shrink-0 text-success" />}
            {sent ? EMAIL_SENT_TITLE : EMAIL_LEDGER_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription>{sent ?? description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          {sent ? (
            <AlertDialogCancel>Done</AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={send} disabled={sending}>
                {sending ? <Spinner className="size-4" label="Sending" /> : <Mail />}
                {sending ? 'Sending…' : 'Send Email'}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
