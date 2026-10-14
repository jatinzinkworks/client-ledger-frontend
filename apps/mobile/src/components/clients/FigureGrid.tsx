import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export interface Figure {
  label: string;
  value: string;
  /** Colour or weight for the value, e.g. "text-destructive" or "font-bold". */
  className?: string;
}

/** Small labelled amounts side by side, wrapping two to a row on narrow screens — a table row's figures. */
export function FigureGrid({ figures, className }: { figures: readonly Figure[]; className?: string }) {
  return (
    <View className={cn('flex-row flex-wrap gap-y-2', className)}>
      {figures.map(({ label, value, className: valueClass }) => (
        <View key={label} className="min-w-[45%] flex-1 gap-0.5 pr-2">
          <Text className="text-xs text-muted-foreground">{label}</Text>
          <Text numberOfLines={1} className={cn('text-[15px] text-card-foreground', valueClass)}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
