import { useBillingByCategory } from '@cl/api';
import { CATEGORY_LABELS, financialYearLabel, formatInr, percentLabel, servicesCountLabel, shareOf } from '@cl/schemas';
import { Text, View } from 'react-native';

import { OverviewSection, SectionEmpty } from './OverviewSection';

/** The year's billing split across the practice areas: a bar each, with its most billed services. */
export function CategoryPanel({ financialYear }: { financialYear: string }) {
  const { categories, isLoading, error, refetch } = useBillingByCategory(financialYear);
  const list = categories ?? [];
  const total = list.reduce((sum, c) => sum + (c.billed ?? 0), 0);
  const max = Math.max(0, ...list.map((c) => c.billed ?? 0));

  return (
    <OverviewSection
      title="Billing By Practice Area"
      hint={`${financialYearLabel(financialYear)} · Billed After Discount, GST Included.`}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {categories &&
        (total <= 0 ? (
          <SectionEmpty message={`Nothing Was Billed In ${financialYearLabel(financialYear)}.`} />
        ) : (
          <View className="gap-5 px-4 pb-4">
            {list.map((c) => (
              <View key={c.category} className="gap-1.5">
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="flex-1 font-bold text-card-foreground">{c.category ? CATEGORY_LABELS[c.category] : ''}</Text>
                  <Text className="text-[13px] text-muted-foreground">{percentLabel(shareOf(c.billed, total))}</Text>
                  <Text className="font-bold text-card-foreground">{formatInr(c.billed ?? 0)}</Text>
                </View>
                <View className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {!!c.billed && (
                    <View
                      className="h-full rounded-full bg-chart-billed"
                      style={{ width: `${shareOf(c.billed, max) * 100}%`, minWidth: 4 }}
                    />
                  )}
                </View>
                {!!c.topServices?.length && (
                  <Text className="text-[13px] text-muted-foreground">
                    {servicesCountLabel(c.serviceCount ?? 0)} Billed ·{' '}
                    {c.topServices.map((s) => `${s.serviceName} ${formatInr(s.billed ?? 0)}`).join(' · ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
    </OverviewSection>
  );
}
