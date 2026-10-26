import { ApiError, errorMessage, serverMessage } from '@cl/api'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

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

interface DeleteButtonProps {
  /** Button and confirm-action text, e.g. "Delete Service". */
  label: string
  /** Name of the record, used in the dialog title. */
  itemName: string
  /** Dialog body explaining what deleting does. */
  description: string
  /** Why deleting is not allowed right now; disables the button and shows as its tooltip. */
  disabledReason?: string
  /** Shown when the backend refuses with 409 (the record is in use) without saying why. */
  conflictMessage?: string
  onDelete: () => Promise<unknown>
  deleting: boolean
  /** A compact trash-can icon (e.g. in a table row) instead of the text button. */
  iconOnly?: boolean
}

/** A destructive text button that asks for confirmation in a dialog before deleting. */
export function DeleteButton({
  label,
  itemName,
  description,
  disabledReason,
  conflictMessage,
  onDelete,
  deleting,
  iconOnly = false,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()

  const confirm = async (event: React.MouseEvent) => {
    event.preventDefault() // keep the dialog open until the request settles
    setError(undefined)
    try {
      await onDelete()
      setOpen(false)
    } catch (e) {
      // A 409 carries the backend's reason (e.g. which company still has ledger entries); the
      // caller's message stands in only when it gave none.
      const conflict = conflictMessage && e instanceof ApiError && e.status === 409
      setError(conflict ? (serverMessage(e) ?? conflictMessage) : errorMessage(e))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* The tooltip sits on a wrapper: a disabled button takes no pointer events, so its own
          title would never show. */}
      <span title={disabledReason} className="inline-flex">
        <AlertDialogTrigger asChild>
          {iconOnly ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${label}: ${itemName}`}
              disabled={!!disabledReason}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="touch"
              disabled={!!disabledReason}
              className="px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
            >
              {label}
            </Button>
          )}
        </AlertDialogTrigger>
      </span>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          {/* The variant, not a className: AlertDialogAction renders through Slot, which would
              not merge a background class over the default variant's. */}
          <AlertDialogAction onClick={confirm} disabled={deleting} variant="destructive">
            {deleting ? 'Deleting…' : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
