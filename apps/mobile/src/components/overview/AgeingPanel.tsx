import { useReceivablesAgeing } from '@cl/api';
import {
  NO_AGEING,
  ageingBucketLabel,
  ageingOverdueNote,
  companyCountLabel,
  formatApiDate,
  formatInr,
  percentLabel,
  shareOf,
} from '@cl/schemas';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

import { OverviewSection, SectionEmpty } from './OverviewSection';

/**
 * One hue, darker the longer it has been due (newest range first, as the API lists them).
 * NativeWind cannot tint token colours (`bg-destructive/25`), so solid fills are faded instead.
 */
const BUCKET_SHADES = ['opacity-30', 'opacity-50', 'opacity-75', 'opacity-100'] as const;
const shade = (index: number) => cn('bg-destructive', BUCKET_SHADES[Math.min(index, BUCKET_SHADES.length - 1)]);

/** What the firm is owed by how long it has been due: a split bar, then each range with its companies. */
export function AgeingPanel() {
  const { ageing, isLoading, error, refetch } = useReceivablesAgeing();
  const buckets = ageing?.buckets ?? [];
  const total = ageing?.total ?? 0;

  return (
    <OverviewSection
      title="How Long It Has Been Due"
      hint={ageing && `As Of ${formatApiDate(ageing.asOf)} · ${companyCountLabel(ageing.companyCount)} Owe`}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {ageing &&
        (total <= 0 ? (
          <SectionEmpty message={NO_AGEING} />
        ) : (
          <View className="gap-4 px-4 pb-4">
            <View className="gap-1">
              <Text className="text-sm text-muted-foreground">Owed</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} className="text-3xl font-black text-card-foreground">
                {formatInr(total)}
              </Text>
              <Text className="text-lg font-black text-destructive">{formatInr(ageing.overdue ?? 0)} Overdue</Text>
              <Text className="text-[13px] text-muted-foreground">{ageingOverdueNote(ageing)}</Text>
            </View>
            {/* Each range's share of what is owed, 2px apart; the list below gives the figures. */}
            <View className="h-3 flex-row gap-0.5" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {buckets.map((bucket, index) =>
                bucket.amount ? (
                  <View
                    key={bucket.label ?? index}
                    className={cn('h-full rounded-full', shade(index))}
                    style={{ width: `${shareOf(bucket.amount, total) * 100}%` }}
                  />
                ) : null,
              )}
            </View>
            <View>
              {buckets.map((bucket, index) => (
                <View
                  key={bucket.label ?? index}
                  className={cn('flex-row items-center gap-3 py-2.5', index > 0 && 'border-t border-border')}
                >
                  <View className={cn('size-3 rounded-full', shade(index))} />
                  <View className="min-w-0 flex-1">
                    <Text className="font-bold text-card-foreground">{ageingBucketLabel(bucket)}</Text>
                    <Text className="text-[13px] text-muted-foreground">{companyCountLabel(bucket.companyCount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-card-foreground">{formatInr(bucket.amount ?? 0)}</Text>
                    <Text className="text-[13px] text-muted-foreground">{percentLabel(shareOf(bucket.amount, total))}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
    </OverviewSection>
  );
}
