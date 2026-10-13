import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface DetailHeaderProps {
  title: string
  /** Short facts shown in a row under the title, e.g. email, phone, manager. */
  details: readonly string[]
  /** Optional second line, e.g. an address. */
  note?: string
  actions?: ReactNode
  /** Shows a pencil icon beside the title, e.g. to open Edit Client. */
  onEdit?: () => void
  /** The icon's accessible name and tooltip, e.g. "Edit Client". */
  editLabel?: string
}

/**
 * The title block of a detail page (client, company): the name with the page actions on its
 * right (and an optional edit icon beside it), then a row of facts. The actions drop under the name only when the row is too narrow.
 */
export function DetailHeader({ title, details, note, actions, onEdit, editLabel = 'Edit' }: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 text-[40px] leading-tight font-bold text-foreground">{title}</h1>
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground [&_svg]:size-5"
              onClick={onEdit}
              aria-label={editLabel}
              title={editLabel}
            >
              <Pencil />
            </Button>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <div className="flex flex-col gap-1.5 text-[15px] text-foreground">
        <ul className="flex flex-wrap gap-x-7 gap-y-1">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        {note && <p>{note}</p>}
      </div>
    </div>
  )
}
