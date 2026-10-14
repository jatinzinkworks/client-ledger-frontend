import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

import { OptionSheet, type SelectOption } from './OptionSheet';

export type { SelectOption } from './OptionSheet';

interface SelectFieldProps {
  label: string;
  value: unknown;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  /** Shown under the field, e.g. what an empty choice means. */
  hint?: string;
  disabled?: boolean;
}

/**
 * React Native has no <select>: a field-styled button that opens a bottom sheet of options.
 * Long lists (e.g. 31 days) scroll inside the sheet.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  placeholder = 'Choose…',
  hint,
  disabled,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const current = options.find((o) => o.value === String(value ?? ''));

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          'min-h-11 flex-row items-center justify-between rounded-md border bg-background px-3 py-2.5',
          error ? 'border-destructive' : 'border-input',
          disabled && 'opacity-60',
        )}
      >
        <Text className={cn('text-base', current ? 'text-foreground' : 'text-muted-foreground')}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <Text className="text-sm text-destructive">{error}</Text>
      ) : (
        hint && <Text className="text-sm text-muted-foreground">{hint}</Text>
      )}

      <OptionSheet
        title={label}
        visible={open}
        options={options}
        selected={current?.value}
        onChoose={(next) => {
          onChange(next);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
