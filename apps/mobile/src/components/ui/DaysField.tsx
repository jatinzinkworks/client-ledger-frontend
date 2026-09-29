import { Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface DaysFieldProps {
  label: string;
  hint: string;
  error?: string;
  value: unknown;
  onChangeText: (text: string) => void;
  onBlur: () => void;
}

/** A labelled whole-number "days" input with a hint that turns into the error message. */
export function DaysField({ label, hint, error, value, onChangeText, onBlur }: DaysFieldProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          value={value == null ? '' : String(value)}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholderTextColor={colors.mutedForeground}
          className={cn(
            'w-24 rounded-md border bg-background px-3 py-2 text-base text-foreground',
            error ? 'border-destructive' : 'border-input',
          )}
        />
        <Text className="text-sm text-muted-foreground">days</Text>
      </View>
      <Text className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</Text>
    </View>
  );
}
