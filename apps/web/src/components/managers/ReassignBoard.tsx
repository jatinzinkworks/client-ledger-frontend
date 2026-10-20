import type { ClientSummaryResponse } from '@cl/api'
import {
  DROP_CLIENT_HERE,
  boardColumnFigures,
  clientName,
  companyCountLabel,
  formatInr,
  managerInitials,
  managerName,
  moveClientTitle,
  movedFromLabel,
  roleLabel,
  type BoardClient,
  type BoardColumn,
} from '@cl/schemas'
import { ArrowRightLeft } from 'lucide-react'
import { useState, type DragEvent } from 'react'

import { cn } from '@/lib/utils'

/** The drag payload type, so drops of anything else (files, text) are ignored. */
const CLIENT_DRAG_TYPE = 'application/x-cl-client'

interface ReassignBoardProps {
  columns: BoardColumn[]
  /** Moves a client to a manager in the draft (nothing is saved yet). */
  onMove: (client: ClientSummaryResponse, managerId: string) => void
  disabled?: boolean
}

/**
 * Reassign Clients: a column per manager holding their clients' cards. Drag a card onto another
 * manager to move the client; each card also has a Move menu (a native select) so the board
 * works from the keyboard and with screen readers. Moved cards show where they came from.
 */
export function ReassignBoard({ columns, onMove, disabled }: ReassignBoardProps) {
  const [dragging, setDragging] = useState<string>()
  const [over, setOver] = useState<string>()
  const managerOptions = columns.map((c) => ({ value: c.manager.id ?? '', label: managerName(c.manager) }))
  const clientById = new Map(columns.flatMap((c) => c.clients.map((b) => [b.client.id, b.client] as const)))

  const dropOn = (managerId: string) => (e: DragEvent) => {
    e.preventDefault()
    const client = clientById.get(e.dataTransfer.getData(CLIENT_DRAG_TYPE))
    if (client) onMove(client, managerId)
    setOver(undefined)
    setDragging(undefined)
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-3">
      {columns.map((column) => {
        const managerId = column.manager.id ?? ''
        const figures = boardColumnFigures(column)
        const isTarget = dragging !== undefined && over === managerId
        return (
          <section
            key={managerId}
            aria-label={managerName(column.manager)}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(CLIENT_DRAG_TYPE)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setOver(managerId)
            }}
            onDragLeave={(e) => {
              // Leaving for one of the column's own children is not leaving the column.
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(undefined)
            }}
            onDrop={dropOn(managerId)}
            className={cn(
              'flex w-[300px] shrink-0 flex-col gap-4 rounded-xl border-2 border-dashed p-5 transition-colors',
              isTarget ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <header className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {managerInitials(column.manager)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{managerName(column.manager)}</p>
                <p className="text-sm text-muted-foreground">{roleLabel(column.manager.role)}</p>
              </div>
            </header>
            <p className="flex justify-between gap-2 border-b border-border pb-3 text-sm font-bold tracking-wide uppercase">
              <span>{figures.clients}</span>
              <span className="tabular-nums">{figures.pending}</span>
            </p>
            <div className="flex min-h-40 flex-1 flex-col gap-3">
              {column.clients.length ? (
                column.clients.map((entry) => (
                  <ClientCard
                    key={entry.client.id}
                    entry={entry}
                    managerId={managerId}
                    managerOptions={managerOptions}
                    disabled={disabled}
                    dragging={dragging === entry.client.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(CLIENT_DRAG_TYPE, entry.client.id ?? '')
                      e.dataTransfer.effectAllowed = 'move'
                      setDragging(entry.client.id)
                    }}
                    onDragEnd={() => {
                      setDragging(undefined)
                      setOver(undefined)
                    }}
                    onMove={(to) => onMove(entry.client, to)}
                  />
                ))
              ) : (
                <p className="m-auto text-base text-muted-foreground">{DROP_CLIENT_HERE}</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface ClientCardProps {
  entry: BoardClient
  managerId: string
  managerOptions: { value: string; label: string }[]
  disabled?: boolean
  dragging: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
  onMove: (managerId: string) => void
}

function ClientCard({ entry, managerId, managerOptions, disabled, dragging, onDragStart, onDragEnd, onMove }: ClientCardProps) {
  const { client, movedFrom } = entry
  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs',
        disabled ? 'opacity-60' : 'cursor-grab active:cursor-grabbing',
        movedFrom ? 'border-primary' : 'border-border',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-lg font-bold">{clientName(client)}</p>
        {/* The keyboard / screen-reader way to move: a transparent native select over the icon. */}
        <span className="relative -mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-within:ring-[3px] focus-within:ring-ring/50">
          <ArrowRightLeft aria-hidden className="size-4" />
          <select
            aria-label={moveClientTitle(client)}
            title={moveClientTitle(client)}
            value={managerId}
            disabled={disabled}
            onChange={(e) => onMove(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {managerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </span>
      </div>
      <p className="flex justify-between gap-2 text-sm text-muted-foreground">
        <span>{companyCountLabel(client.companyNames?.length)}</span>
        <span className="font-bold text-foreground tabular-nums">{formatInr(client.totalPending ?? 0)}</span>
      </p>
      {movedFrom && <p className="text-xs font-bold text-primary">{movedFromLabel(movedFrom)}</p>}
    </div>
  )
}
