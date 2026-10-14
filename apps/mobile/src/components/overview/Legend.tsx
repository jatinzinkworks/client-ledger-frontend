import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

/** One series in a legend: its swatch class (`bg-chart-billed`…) and name. */
export interface LegendItem {
  label: string;
  swatch: string;
}

/** A row of coloured dots naming a chart's series. */
export function Legend({ items, className }: { items: readonly LegendItem[]; className?: string }) {
  return (
    <View className={cn('flex-row flex-wrap gap-4', className)}>
      {items.map(({ label, swatch }) => (
        <View key={label} className="flex-row items-center gap-1.5">
          <View className={cn('size-2.5 rounded-full', swatch)} />
          <Text className="text-[13px] text-muted-foreground">{label}</Text>
        </View>
      ))}
    </View>
  );
}
