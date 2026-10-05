import type { ReactNode } from 'react'

interface DetailHeaderProps {
  title: string
  /** Short facts shown in a row under the title, e.g. email, phone, manager. */
  details: readonly string[]
  /** Optional second line, e.g. an address. */
  note?: string
  actions?: ReactNode
}

/** The title block of a detail page (client, company): name, a row of facts, page actions. */
export function DetailHeader({ title, details, note, actions }: DetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-[40px] leading-tight font-bold text-foreground">{title}</h1>
        <div className="flex flex-col gap-1.5 text-[15px] text-foreground">
          <ul className="flex flex-wrap gap-x-7 gap-y-1">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          {note && <p>{note}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
