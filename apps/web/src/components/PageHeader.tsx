import type { ReactNode } from 'react'
import { EYEBROW } from '@/utils/typography'

interface PageHeaderProps {
  /** Small mono uppercase label above the title, e.g. "Applies To All Clients". */
  eyebrow?: string
  title: string
  /** Right-aligned page actions (buttons, status text). */
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && <span className={EYEBROW}>{eyebrow}</span>}
        <h1 className="text-[32px] leading-tight font-bold text-foreground">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
