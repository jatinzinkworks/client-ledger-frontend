import { Pressable, Text, View } from 'react-native';

import { cn } from '@/utils/cn';

interface SegmentedControlProps<T extends string> {
  /** Names the group for screen readers, e.g. "Period". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A row of toggle buttons, one pressed at a time: picks a view of the same data. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className={cn('flex-row rounded-lg border border-border p-0.5', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn('min-h-9 flex-1 items-center justify-center rounded-md px-3', selected && 'bg-primary')}
          >
            <Text numberOfLines={1} className={cn('text-sm font-bold', selected ? 'text-primary-foreground' : 'text-foreground')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
