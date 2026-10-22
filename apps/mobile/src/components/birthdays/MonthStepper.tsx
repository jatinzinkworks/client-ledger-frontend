import { currentMonth, monthName, shiftMonth } from '@cl/schemas';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

interface MonthStepperProps {
  month: number;
  onChange: (month: number) => void;
}

/** The month being shown, with previous / next (wrapping at the year end) and This Month, as on web. */
export function MonthStepper({ month, onChange }: MonthStepperProps) {
  const colors = useThemeColors();
  const thisMonth = currentMonth();
  const steps = [
    { delta: -1, icon: ChevronLeft, label: 'Previous Month' },
    { delta: 1, icon: ChevronRight, label: 'Next Month' },
  ];
  const stepButton = ({ delta, icon: Icon, label }: (typeof steps)[number]) => (
    <Pressable
      key={delta}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${monthName(shiftMonth(month, delta))}`}
      hitSlop={6}
      onPress={() => onChange(shiftMonth(month, delta))}
      className="h-11 w-11 items-center justify-center rounded-md border border-border bg-card active:opacity-70"
    >
      <Icon size={20} color={colors.foreground} />
    </Pressable>
  );

  return (
    <View className="flex-row items-center gap-2">
      {stepButton(steps[0])}
      <Text accessibilityLiveRegion="polite" className="flex-1 text-center text-lg font-bold text-foreground">
        {monthName(month)}
      </Text>
      {stepButton(steps[1])}
      {month !== thisMonth && (
        <Pressable accessibilityRole="button" onPress={() => onChange(thisMonth)} className="px-2 py-2 active:opacity-70">
          <Text className="font-bold text-brand">This Month</Text>
        </Pressable>
      )}
    </View>
  );
}
