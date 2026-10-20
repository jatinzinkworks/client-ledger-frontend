import { useClients, useReassignClients, type ManagerResponse } from '@cl/api'
import {
  REASSIGN_HINT_DRAG,
  SAVE_REASSIGN_LABEL,
  moveClient,
  reassignBoard,
  reassignChangesLabel,
  reassignFailedMessage,
  reassignMoves,
  reassignSavedMessage,
  toReassignRequests,
  type ReassignDraft,
} from '@cl/schemas'
import { useMemo, useState } from 'react'

import { LoadError } from '@/components/LoadError'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { ReassignBoard } from './ReassignBoard'

interface ReassignClientsProps {
  managers: ManagerResponse[]
  /** Leaves the board; given a message after a save. */
  onDone: (savedMessage?: string) => void
}

/**
 * The Managers page in Reassign Clients mode: the board, the count of moves, Cancel (discards
 * them) and Save Changes (one bulk request per receiving manager). Moves that fail stay on the
 * board, with the reason, to try again; saved ones leave it.
 */
export function ReassignClients({ managers, onDone }: ReassignClientsProps) {
  const clients = useClients()
  const { save, saving } = useReassignClients()
  const [draft, setDraft] = useState<ReassignDraft>({})
  const [error, setError] = useState<string>()

  const columns = useMemo(() => reassignBoard(managers, clients.clients, draft), [managers, clients.clients, draft])
  const moves = reassignMoves(clients.clients, draft)

  const onSave = async () => {
    setError(undefined)
    const outcome = await save(toReassignRequests(moves))
    if (!outcome.failures.length) return onDone(reassignSavedMessage(outcome.savedClientIds.length))
    // Keep only the moves that failed; the saved ones now match each client's manager.
    const failed = new Set(outcome.failures.flatMap((f) => f.request.clientIds))
    setDraft((d) => Object.fromEntries(Object.entries(d).filter(([clientId]) => failed.has(clientId))))
    setError(
      [reassignFailedMessage(failed.size, outcome.savedClientIds.length), ...new Set(outcome.failures.map((f) => f.message))].join(' '),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Managers"
        actions={
          <>
            <span className="text-base text-muted-foreground" aria-live="polite">
              {reassignChangesLabel(moves.length)}
            </span>
            <Button variant="outline" size="touch" className="bg-card" onClick={() => onDone()} disabled={saving}>
              Cancel
            </Button>
            <Button size="touch" onClick={onSave} disabled={!moves.length || saving}>
              {saving ? 'Saving…' : SAVE_REASSIGN_LABEL}
            </Button>
          </>
        }
      />
      <p className="-mt-2 text-base text-muted-foreground">{REASSIGN_HINT_DRAG}</p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {clients.isLoading && <Spinner />}
      {clients.loadError && <LoadError error={clients.loadError} onRetry={() => clients.refetch()} />}
      {!clients.isLoading && !clients.loadError && (
        <ReassignBoard
          columns={columns}
          disabled={saving}
          onMove={(client, managerId) => setDraft((d) => moveClient(d, client, managerId))}
        />
      )}
    </div>
  )
}
