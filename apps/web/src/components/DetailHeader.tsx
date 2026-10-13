import type { ReactNode } from 'react'

interface DetailHeaderProps {
  title: string
  /** Short facts shown in a row under the title, e.g. email, phone, manager. */
  details: readonly string[]
  /** Optional second line, e.g. an address. */
  note?: string
  actions?: ReactNode
}

/**
 * The title block of a detail page (client, company): the name with the page actions on its
 * right, then a row of facts. The actions drop under the name only when the row is too narrow.
 */
export function DetailHeader({ title, details, note, actions }: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="min-w-0 text-[40px] leading-tight font-bold text-foreground">{title}</h1>
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
