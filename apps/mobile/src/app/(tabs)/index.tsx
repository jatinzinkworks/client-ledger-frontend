import { useFirmOverview, useRefreshOverview } from '@cl/api';
import { overviewEyebrow, overviewSummaryCards } from '@cl/schemas';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text } from 'react-native';

import { AgeingPanel } from '@/components/overview/AgeingPanel';
import { BilledRanking } from '@/components/overview/BilledRanking';
import { BookCounts } from '@/components/overview/BookCounts';
import { CategoryPanel } from '@/components/overview/CategoryPanel';
import { MonthlyTrendChart } from '@/components/overview/MonthlyTrendChart';
import { PendingRanking } from '@/components/overview/PendingRanking';
import { RecentPayments } from '@/components/overview/RecentPayments';
import { SummaryCards } from '@/components/SummaryCards';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { useThemeColors } from '@/theme/useThemeColors';
import { EYEBROW } from '@/utils/typography';

/**
 * The firm at a glance for the selected financial year, as on web but in one column: its figures,
 * its book, who owes most, the year month by month, how long what is owed has been due, who was
 * billed most, billing per practice area and the latest payments.
 */
export default function OverviewScreen() {
  const { financialYear } = useFinancialYear();
  const { overview, isLoading, error, refetch } = useFirmOverview(financialYear);
  const { refresh } = useRefreshOverview();
  const colors = useThemeColors();
  // Only a pull shows the spinner (until every widget has refetched), not each widget's first load.
  const [pulled, setPulled] = useState(false);
  const onRefresh = async () => {
    setPulled(true);
    try {
      await refresh();
    } finally {
      setPulled(false);
    }
  };

  return (
    <ScrollView
      contentContainerClassName="gap-4 p-4"
      refreshControl={
        <RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.mutedForeground} />
      }
    >
      <Text className={EYEBROW}>{overviewEyebrow(financialYear)}</Text>
      <SummaryCards
        cards={overview && overviewSummaryCards(overview, financialYear)}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
      />
      {overview && <BookCounts overview={overview} />}
      <PendingRanking financialYear={financialYear} />
      <MonthlyTrendChart financialYear={financialYear} />
      <AgeingPanel />
      <BilledRanking financialYear={financialYear} />
      <CategoryPanel financialYear={financialYear} />
      <RecentPayments />
    </ScrollView>
  );
}
