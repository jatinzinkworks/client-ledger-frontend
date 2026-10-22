import { BIRTHDAY_LABEL, clientBirthdayLabel } from '@cl/schemas'
import { Cake } from 'lucide-react'

import { cn } from '@/lib/utils'

/** A cake icon and the client's birthday ("23 Jul 1985"); nothing when none is recorded. */
export function ClientBirthday({ birthday, className }: { birthday: string | undefined; className?: string }) {
  const date = clientBirthdayLabel(birthday)
  if (!date) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Cake aria-hidden className="size-[1em] shrink-0" />
      <span className="sr-only">{BIRTHDAY_LABEL} </span>
      {date}
    </span>
  )
}
