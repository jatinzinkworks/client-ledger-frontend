import { BILLING_LABELS, type BillingFrequency } from '@cl/schemas';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

// Same badge roles as the web BillingBadge. NativeWind can't apply opacity modifiers to our
// CSS-variable colours, so the tinted web pill becomes an outlined one here.
const BILLING_BADGE: Readonly<Record<BillingFrequency, { box: string; text: string }>> = {
  MONTHLY: { box: 'border border-brand', text: 'text-brand' },
  QUARTERLY: { box: 'bg-primary', text: 'text-primary-foreground' },
  ANNUAL: { box: 'bg-muted', text: 'text-foreground' },
  ONE_OFF: { box: 'border border-border', text: 'text-muted-foreground' },
};

/** How a service is billed, as a small pill: Monthly, Quarterly, Annual or One-Off. */
export function BillingBadge({ billing }: { billing: BillingFrequency }) {
  const badge = BILLING_BADGE[billing];
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', badge.box)}>
      <Text className={cn('text-[11px] font-black uppercase', badge.text)}>{BILLING_LABELS[billing]}</Text>
    </View>
  );
}
