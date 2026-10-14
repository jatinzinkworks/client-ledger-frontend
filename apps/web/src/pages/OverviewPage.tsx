import { useFirmOverview, useRefreshOverview } from '@cl/api'
import { RANK_SUBJECT_OPTIONS, financialYearLabel, overviewEyebrow, overviewSummaryCards } from '@cl/schemas'

import { SummaryCards } from '@/components/clients/SummaryCards'
import { AgeingPanel } from '@/components/overview/AgeingPanel'
import { BookCounts } from '@/components/overview/BookCounts'
import { CategoryPanel } from '@/components/overview/CategoryPanel'
import { MonthlyTrendChart } from '@/components/overview/MonthlyTrendChart'
import { RankingPanel } from '@/components/overview/RankingPanel'
import { RecentPayments } from '@/components/overview/RecentPayments'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { useFinancialYear } from '@/financialYear/useFinancialYear'
import { cn } from '@/lib/utils'

// A wide main column with a side column, the same in every such row so the side panels line up.
const MAIN_AND_SIDE = 'grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'

/**
 * The firm at a glance for the selected financial year: its figures against last year, its book,
 * the year month by month, how long what is owed has been due, who owes and who was billed most,
 * and the latest payments.
 */
export function OverviewPage() {
  const { financialYear } = useFinancialYear()
  const { overview, isLoading, error, refetch } = useFirmOverview(financialYear)
  const { refresh, refreshing } = useRefreshOverview()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={overviewEyebrow(financialYear)}
        title="Overview"
        actions={<RefreshButton onRefresh={refresh} refreshing={refreshing} />}
      />

      {/* The year's four figures, then the book as it stands, in one row on wide screens. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SummaryCards
          label={`Summary For ${financialYearLabel(financialYear)}`}
          cards={overview && overviewSummaryCards(overview, financialYear)}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
        {overview && <BookCounts overview={overview} />}
      </div>

      {/*
        Who owes most, one panel each, stretched to the tallest so they line up. What is owed is not
        a one-year figure, so they start at all years.
      */}
      <div className="grid gap-6 lg:grid-cols-3">
        {RANK_SUBJECT_OPTIONS.map(({ value }) => (
          <RankingPanel key={value} measure="pending" subject={value} financialYear={financialYear} defaultPeriod="all" />
        ))}
      </div>

      {/* How the year has gone month by month, and how long what is owed has been due; one height. */}
      <div className={cn(MAIN_AND_SIDE, 'items-stretch')}>
        <MonthlyTrendChart financialYear={financialYear} />
        <AgeingPanel />
      </div>

      <div className={MAIN_AND_SIDE}>
        <div className="flex min-w-0 flex-col gap-6">
          <RankingPanel measure="billed" financialYear={financialYear} defaultPeriod="year" />
          <CategoryPanel financialYear={financialYear} />
        </div>
        <RecentPayments />
      </div>
    </div>
  )
}
