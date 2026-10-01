import { errorMessage } from '@cl/api'
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
  onDelete: () => Promise<unknown>
  deleting: boolean
}

/** A destructive text button that asks for confirmation in a dialog before deleting. */
export function DeleteButton({ label, itemName, description, disabledReason, onDelete, deleting }: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()

  const confirm = async (event: React.MouseEvent) => {
    event.preventDefault() // keep the dialog open until the request settles
    setError(undefined)
    try {
      await onDelete()
      setOpen(false)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="touch"
          disabled={!!disabledReason}
          title={disabledReason}
          className="px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting…' : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
