import type { ClientBirthdayResponse } from '@cl/api'
import {
  BIRTHDAY_TODAY_LABEL,
  birthdayCardLabel,
  birthdayMonthShort,
  clientName,
  isBirthdayToday,
  turningAgeLabel,
} from '@cl/schemas'
import { Mail, Phone, UserCog } from 'lucide-react'
import { Link } from 'react-router'

import { StatusPill } from '@/components/StatusPill'
import { cn } from '@/lib/utils'
import { clientPath } from '@/utils/routes'

/**
 * One client's birthday: a date tile (day and month), their name and the age they turn, and how
 * to reach them — phone, email, manager. Today's birthdays are outlined and marked. The whole card
 * opens the client page.
 */
export function BirthdayCard({ birthday }: { birthday: ClientBirthdayResponse }) {
  const name = clientName(birthday)
  const today = isBirthdayToday(birthday.birthday)
  const contacts = [
    { icon: Phone, text: birthday.phone },
    { icon: Mail, text: birthday.email },
    { icon: UserCog, text: birthday.managerName && `Manager: ${birthday.managerName}` },
  ].filter((row) => row.text)

  return (
    <Link
      to={clientPath(birthday.clientId ?? '')}
      aria-label={birthdayCardLabel(birthday, name)}
      className={cn(
        'flex h-full flex-col gap-5 rounded-lg border bg-card p-6 text-card-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50',
        today ? 'border-primary' : 'border-border',
      )}
    >
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className={cn(
            'flex size-16 shrink-0 flex-col items-center justify-center rounded-lg',
            today ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary',
          )}
        >
          <span className="text-2xl leading-none font-black tabular-nums">{birthday.dayOfMonth}</span>
          <span className="text-xs font-bold uppercase">{birthdayMonthShort(birthday.birthday)}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="truncate text-xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">{turningAgeLabel(birthday.birthday)}</p>
        </div>
        {today && <StatusPill tone="brand" label={BIRTHDAY_TODAY_LABEL} />}
      </div>

      {contacts.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-4 text-[15px]">
          {contacts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex min-w-0 items-center gap-2.5">
              <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}
