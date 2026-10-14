import { PAGE_LEVEL_LABELS, companyOwnerLabel, type PageLevel } from '@cl/schemas'
import { Building2, ChevronRight, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'

const LEVELS: Readonly<Record<PageLevel, { icon: LucideIcon; pill: string }>> = {
  // A client is the top level: a solid pill. A company sits under it: an outlined one.
  client: { icon: Users, pill: 'bg-primary text-primary-foreground' },
  company: { icon: Building2, pill: 'border-2 border-brand text-brand' },
}

interface LevelBadgeProps {
  level: PageLevel
  /** A company's client: shown as "Of Rohan Mehta", linking up to them. */
  owner?: { name: string; to: string }
}

/** "CLIENT", or "COMPANY · Of Rohan Mehta ›": which level of the hierarchy this page shows. */
export function LevelBadge({ level, owner }: LevelBadgeProps) {
  const { icon: Icon, pill } = LEVELS[level]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-black tracking-wider uppercase', pill)}>
        <Icon aria-hidden className="size-3.5" />
        {PAGE_LEVEL_LABELS[level]}
      </span>
      {owner && (
        <Link to={owner.to} className="inline-flex items-center gap-0.5 text-[15px] font-bold text-brand hover:underline">
          {companyOwnerLabel(owner.name)}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  )
}
