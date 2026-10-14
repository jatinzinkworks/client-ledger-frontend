import { formatApiDate, parseApiDate, todayApiDate } from '@cl/schemas';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

import { Button } from './Button';

interface DateFieldProps {
  label: string;
  /** An API date, "2026-10-15"; empty for none. */
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  /** Latest date that can be picked, e.g. today for a payment received. */
  maximumDate?: Date;
}

/**
 * A date as the API takes it ("2026-10-15"), shown as "15 Oct 2026". Tapping opens the platform
 * picker: Android's calendar dialog, an inline calendar in a sheet on iOS. On web, where the
 * native picker is unavailable, it is a plain text input in the API's format.
 */
export function DateField({ label, value, onChange, error, hint, maximumDate }: DateFieldProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>();
  const current = parseApiDate(value) ?? new Date();

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate,
        onValueChange: (_event, date) => onChange(todayApiDate(date)),
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  const message = error ? (
    <Text className="text-sm text-destructive">{error}</Text>
  ) : hint ? (
    <Text className="text-sm text-muted-foreground">{hint}</Text>
  ) : null;

  if (Platform.OS === 'web') {
    return (
      <View className="gap-1.5">
        <Text className="text-sm font-bold text-foreground">{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={value ?? ''}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          className={cn('rounded-md border bg-background px-3 py-2.5 text-base text-foreground', error ? 'border-destructive' : 'border-input')}
        />
        {message}
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatApiDate(value) : 'Not Set'}`}
        onPress={open}
        className={cn(
          'min-h-11 flex-row items-center justify-between rounded-md border bg-background px-3 py-2.5',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        <Text className={cn('text-base', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value ? formatApiDate(value) : 'Choose A Date'}
        </Text>
        <CalendarDays size={18} color={colors.mutedForeground} />
      </Pressable>
      {message}

      <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
        <Pressable accessibilityLabel="Close" className="flex-1 bg-black/40" onPress={() => setIosOpen(false)} />
        <View className="gap-3 rounded-t-lg bg-card px-4 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
          <Text className="text-lg font-bold text-card-foreground">{label}</Text>
          <DateTimePicker
            value={draft ?? current}
            mode="date"
            display="inline"
            maximumDate={maximumDate}
            onValueChange={(_event, date) => setDraft(date)}
          />
          <Button
            label="Done"
            onPress={() => {
              if (draft) onChange(todayApiDate(draft));
              setIosOpen(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
