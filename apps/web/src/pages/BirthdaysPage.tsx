import { useBirthdays } from '@cl/api'
import { BIRTHDAYS_TITLE, NO_BIRTHDAYS_HINT, birthdaysEyebrow, currentMonth, noBirthdaysTitle } from '@cl/schemas'
import { useState } from 'react'

import { BirthdayCard } from '@/components/birthdays/BirthdayCard'
import { MonthStepper } from '@/components/birthdays/MonthStepper'
import { LoadError } from '@/components/LoadError'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'

/** Clients with a birthday in a month, a card each, starting at the current month. */
export function BirthdaysPage() {
  const [month, setMonth] = useState(currentMonth)
  const list = useBirthdays(month)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={list.isLoading ? undefined : birthdaysEyebrow(list.birthdays.length, month)}
        title={BIRTHDAYS_TITLE}
        actions={
          <>
            <MonthStepper month={month} onChange={setMonth} />
            <RefreshButton onRefresh={() => list.refetch()} refreshing={list.isRefreshing} />
          </>
        }
      />

      {list.isLoading && <Spinner />}
      {list.loadError && <LoadError error={list.loadError} onRetry={() => list.refetch()} />}

      {!list.isLoading &&
        !list.loadError &&
        (list.birthdays.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {list.birthdays.map((birthday) => (
              <BirthdayCard key={birthday.clientId} birthday={birthday} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-lg font-bold">{noBirthdaysTitle(month)}</p>
            <p className="text-sm text-muted-foreground">{NO_BIRTHDAYS_HINT}</p>
          </div>
        ))}
    </div>
  )
}
