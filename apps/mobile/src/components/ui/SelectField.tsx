import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: unknown;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

/**
 * React Native has no <select>: a field-styled button that opens a bottom sheet of options.
 * Long lists (e.g. 31 days) scroll inside the sheet.
 */
export function SelectField({ label, value, options, onChange, error, placeholder = 'Choose…' }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const current = options.find((o) => o.value === String(value ?? ''));

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        className={cn(
          'min-h-11 flex-row items-center justify-between rounded-md border bg-background px-3 py-2.5',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        <Text className={cn('text-base', current ? 'text-foreground' : 'text-muted-foreground')}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>
      {error && <Text className="text-sm text-destructive">{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close" className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <View className="max-h-[70%] rounded-t-lg bg-card" style={{ paddingBottom: insets.bottom }}>
          <Text className="border-b border-border px-5 py-4 text-lg font-bold text-card-foreground">{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const selected = item.value === current?.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => choose(item.value)}
                  className="min-h-12 flex-row items-center justify-between px-5 active:bg-muted"
                >
                  <Text className={cn('text-base text-card-foreground', selected && 'font-bold')}>{item.label}</Text>
                  {selected && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
