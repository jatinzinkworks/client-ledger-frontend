import { formatDate, formatInr } from '@cl/schemas';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

interface DueScheduleProps {
  dates: readonly Date[];
  /** Total per invoice with GST; omitted while the discount entry is invalid. */
  amount?: number;
}

/** The upcoming due dates of the service, each with its total including GST. */
export function DueSchedule({ dates, amount }: DueScheduleProps) {
  if (!dates.length) return null;
  const title = dates.length === 1 ? 'Due Date' : `Next ${dates.length} Due Dates`;
  return (
    <View accessibilityLabel="Payment Schedule" className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{title}</Text>
      <View className="rounded-md bg-muted px-1">
        {dates.map((date, i) => (
          <View key={date.getTime()} className={cn('flex-row items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-border')}>
            <Text className="w-5 text-xs font-bold text-muted-foreground">{i + 1}</Text>
            <Text className="flex-1 text-[15px] text-foreground">{formatDate(date)}</Text>
            {amount != null && <Text className="text-[15px] font-bold text-foreground">{formatInr(amount)}</Text>}
          </View>
        ))}
      </View>
      {amount != null && <Text className="text-sm text-muted-foreground">Total Per Invoice, Including GST.</Text>}
    </View>
  );
}
