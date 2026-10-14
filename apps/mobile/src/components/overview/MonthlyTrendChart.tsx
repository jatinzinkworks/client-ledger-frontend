import { useOverviewMonthly, type MonthlyTrend } from '@cl/api';
import {
  financialYearLabel,
  formatInr,
  isFutureMonth,
  monthAxisLabel,
  monthTitle,
  monthlyMax,
  monthlyTotals,
  shareOf,
} from '@cl/schemas';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/utils/cn';

import { Legend } from './Legend';
import { OverviewSection } from './OverviewSection';

// The two series, from the validated chart tokens; the legend and readouts name them too.
const SERIES = [
  { key: 'billed', label: 'Billed', swatch: 'bg-chart-billed' },
  { key: 'received', label: 'Received', swatch: 'bg-chart-received' },
] as const;

/** A label and its amount, with the series' dot when it has one. */
function Figure({ label, value, swatch }: { label: string; value: number; swatch?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-row items-center gap-1.5">
        <View className={cn('size-2.5 rounded-full', swatch)} />
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </View>
      <Text className="text-sm font-bold text-card-foreground">{formatInr(value)}</Text>
    </View>
  );
}

/** The tapped month's figures, in a small card above the bars. */
function MonthCard({ month }: { month: MonthlyTrend }) {
  return (
    <View className="gap-1.5 rounded-md border border-border bg-background p-3">
      <Text className="font-bold text-card-foreground">{monthTitle(month.month)}</Text>
      {SERIES.map(({ key, label, swatch }) => (
        <Figure key={key} label={label} value={month[key] ?? 0} swatch={swatch} />
      ))}
      <Figure label="Discount" value={month.discount ?? 0} />
    </View>
  );
}

/** The whole year's figures. */
function Readout({ billed, received }: { billed: number; received: number }) {
  return (
    <View className="flex-row flex-wrap items-baseline gap-x-4 gap-y-1">
      <Text className="text-sm font-bold text-card-foreground">Whole Year</Text>
      {[
        { label: 'Billed', value: billed },
        { label: 'Received', value: received },
      ].map(({ label, value }) => (
        <Text key={label} className="text-sm text-muted-foreground">
          {label} <Text className="font-bold text-card-foreground">{formatInr(value)}</Text>
        </Text>
      ))}
    </View>
  );
}

/** One month: billed and received side by side from a shared baseline; tap to read its figures. */
function MonthColumn({ month, max, active, onPress }: { month: MonthlyTrend; max: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${monthTitle(month.month)}: Billed ${formatInr(month.billed ?? 0)}, Received ${formatInr(month.received ?? 0)}, Discount ${formatInr(month.discount ?? 0)}`}
      onPress={onPress}
      className={cn(
        'h-full flex-1 flex-row items-end justify-center gap-0.5 rounded-t-md px-0.5',
        active && 'bg-muted',
        isFutureMonth(month.month) && 'opacity-40',
      )}
    >
      {SERIES.map(({ key, swatch }) => {
        const value = month[key] ?? 0;
        return (
          <View
            key={key}
            className={cn('max-w-4 flex-1 rounded-t-[4px]', swatch)}
            // A sliver for a month with a little, nothing for none.
            style={value ? { height: `${shareOf(value, max) * 100}%`, minHeight: 2 } : { height: 0 }}
          />
        );
      })}
    </Pressable>
  );
}

/** Billed and received in each month of the year, April first; tap a month for its figures. */
export function MonthlyTrendChart({ financialYear }: { financialYear: string }) {
  const { months, isLoading, error, refetch } = useOverviewMonthly(financialYear);
  const [active, setActive] = useState<number>();
  const list = months ?? [];
  const max = monthlyMax(list);
  const totals = monthlyTotals(list);
  const selected = active != null ? list[active] : undefined;

  return (
    <OverviewSection
      title="Billed And Received By Month"
      hint={financialYearLabel(financialYear)}
      controls={<Legend items={SERIES} />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {months && (
        <View className="gap-3 px-4 pb-4">
          <Readout billed={totals.billed} received={totals.received} />
          {selected ? (
            <MonthCard month={selected} />
          ) : (
            <Text className="text-[13px] text-muted-foreground">Tap A Month For Its Figures.</Text>
          )}
          <View className="gap-1">
            {/* The scale: the largest month at the top, recessive. */}
            <Text className="self-end text-xs text-muted-foreground">{formatInr(max)}</Text>
            <View className="h-48 flex-row items-end gap-0.5 border-b border-border">
              {list.map((month, index) => (
                <MonthColumn
                  key={month.month}
                  month={month}
                  max={max}
                  active={active === index}
                  onPress={() => setActive((current) => (current === index ? undefined : index))}
                />
              ))}
            </View>
            <View className="flex-row gap-0.5" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {list.map((month) => (
                <Text key={month.month} numberOfLines={1} className="flex-1 text-center text-[10px] text-muted-foreground">
                  {monthAxisLabel(month.month)}
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </OverviewSection>
  );
}
