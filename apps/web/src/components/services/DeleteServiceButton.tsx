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

interface DeleteServiceButtonProps {
  serviceName: string
  /** Companies subscribing to the service — the backend refuses to delete one that is in use. */
  usedByCompanies: number
  onDelete: () => Promise<unknown>
  deleting: boolean
}

/** "Delete Service", confirmed in a dialog. Disabled while companies still subscribe. */
export function DeleteServiceButton({ serviceName, usedByCompanies, onDelete, deleting }: DeleteServiceButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const inUse = usedByCompanies > 0

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
          disabled={inUse}
          title={inUse ? 'Companies Still Subscribe To This Service' : undefined}
          className="px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
        >
          Delete Service
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {serviceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            The Service Is Removed From The Catalog. This Cannot Be Undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting…' : 'Delete Service'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
