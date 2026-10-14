import type { PageLevel } from '@cl/schemas'
import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

import { LevelBadge } from '@/components/LevelBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** The accent down the left of the header, matching the level badge's colour. */
const LEVEL_ACCENT: Readonly<Record<PageLevel, string>> = {
  client: 'border-primary',
  company: 'border-brand',
}

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
  /** Which level this page shows: a badge above the name and a matching accent down the left. */
  level?: PageLevel
  /** A company's client, shown beside its badge as a link up. */
  owner?: { name: string; to: string }
}

/**
 * The title block of a detail page (client, company): the level badge (Client, or Company of its
 * client), the name with the page actions on its right (and an optional edit icon beside it), then
 * a row of facts. The actions drop under the name only when the row is too narrow.
 */
export function DetailHeader({ title, details, note, actions, onEdit, editLabel = 'Edit', level, owner }: DetailHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', level && ['border-l-4 pl-5', LEVEL_ACCENT[level]])}>
      {level && <LevelBadge level={level} owner={owner} />}
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
