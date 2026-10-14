import type { OverviewResponse } from '@cl/api'
import { bookCounts, companiesPerClientLabel, type BookCountKey } from '@cl/schemas'
import { Building2, BriefcaseBusiness, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EYEBROW } from '@/utils/typography'

const ICONS: Readonly<Record<BookCountKey, LucideIcon>> = {
  clients: Users,
  companies: Building2,
  services: BriefcaseBusiness,
}

// Where a count leads, when it has a page of its own.
const LINKS: Partial<Record<BookCountKey, string>> = { clients: '/clients' }

/** The firm's book as it stands now: clients, companies and services assigned. */
export function BookCounts({ overview }: { overview: OverviewResponse }) {
  const note = companiesPerClientLabel(overview)
  return (
    <section aria-label="Your Book" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={EYEBROW}>Your Book Today</span>
        {note && <span className="text-sm text-muted-foreground">{note}</span>}
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {bookCounts(overview).map(({ key, label, value }) => {
          const Icon = ICONS[key]
          const link = LINKS[key]
          const figure = <span className="text-2xl font-black tracking-tight tabular-nums">{value.toLocaleString('en-IN')}</span>
          return (
            <div key={key} className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon aria-hidden className="size-4 text-brand" />
                {label}
              </dt>
              <dd>
                {link ? (
                  <Link to={link} className="hover:underline">
                    {figure}
                  </Link>
                ) : (
                  figure
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
