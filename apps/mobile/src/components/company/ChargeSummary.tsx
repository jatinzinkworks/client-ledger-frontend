import { formatInr, gstRateLabel, type ChargeBreakdown } from '@cl/schemas';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

/** One line of the summary; `ruled` draws the line under it. */
function Line({ label, value, bold, ruled, valueClass }: { label: string; value: string; bold?: boolean; ruled?: boolean; valueClass?: string }) {
  return (
    <View className={cn('flex-row justify-between gap-3', ruled && 'border-b border-border pb-2')}>
      <Text className={cn('text-[15px] text-foreground', bold && 'font-bold')}>{label}</Text>
      <Text className={cn('text-[15px]', bold ? 'font-bold text-foreground' : 'text-muted-foreground', valueClass)}>{value}</Text>
    </View>
  );
}

/** Fee, discount, net charge, GST and the total with GST — the same summary as on web. */
export function ChargeSummary({ fee, discount, net, gstRatePercent, gst, total }: ChargeBreakdown) {
  return (
    <View accessibilityLabel="Charge Summary" className="gap-2 rounded-md bg-muted p-4">
      <Line label="Fee" value={formatInr(fee)} />
      <Line label="Discount" value={`− ${formatInr(discount)}`} ruled valueClass="font-bold text-success" />
      <Line label="Net Charge" value={formatInr(net)} bold />
      <Line label={`GST (${gstRateLabel(gstRatePercent)})`} value={`+ ${formatInr(gst)}`} ruled />
      <Line label="Total With GST" value={formatInr(total)} bold />
    </View>
  );
}
