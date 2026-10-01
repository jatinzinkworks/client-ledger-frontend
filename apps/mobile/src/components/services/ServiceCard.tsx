import type { CatalogServiceResponse } from '@cl/api';
import {
  BILLING_LABELS,
  CATEGORY_LABELS,
  formatGst,
  formatInr,
  scheduleSummary,
  usageLabel,
  type BillingFrequency,
} from '@cl/schemas';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/utils/cn';

// Same badge roles as the web card. NativeWind can't apply opacity modifiers to our
// CSS-variable colours, so the tinted web pill becomes an outlined one here.
const BILLING_BADGE: Readonly<Record<BillingFrequency, { box: string; text: string }>> = {
  MONTHLY: { box: 'border border-brand', text: 'text-brand' },
  QUARTERLY: { box: 'bg-primary', text: 'text-primary-foreground' },
  ANNUAL: { box: 'bg-muted', text: 'text-foreground' },
  ONE_OFF: { box: 'border border-border', text: 'text-muted-foreground' },
};

interface ServiceCardProps {
  service: CatalogServiceResponse;
  onPress: () => void;
}

/** One catalog entry; tapping it opens the editor. */
export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const billing = service.billingFrequency;
  const badge = billing ? BILLING_BADGE[billing] : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${service.serviceName}`}
      onPress={onPress}
      className="gap-3 rounded-lg border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-mono text-[11px] uppercase tracking-widest text-brand">
          {service.category ? CATEGORY_LABELS[service.category] : ''}
        </Text>
        {billing && badge && (
          <View className={cn('rounded-full px-2.5 py-1', badge.box)}>
            <Text className={cn('text-[11px] font-black uppercase', badge.text)}>{BILLING_LABELS[billing]}</Text>
          </View>
        )}
      </View>

      <View className="gap-1">
        <Text className="text-lg font-bold text-card-foreground">{service.serviceName}</Text>
        {service.description ? <Text className="text-sm text-muted-foreground">{service.description}</Text> : null}
      </View>

      <View className="flex-row items-baseline gap-2">
        <Text className="text-3xl font-black text-card-foreground">{formatInr(service.standardFee ?? 0)}</Text>
        <Text className="text-xs text-muted-foreground">{formatGst(service.gstRatePercent)}</Text>
      </View>

      <View className="gap-0.5 border-t border-border pt-3">
        <Text className="text-sm text-card-foreground">{usageLabel(service.usedByCompanies)}</Text>
        <Text className="text-xs text-muted-foreground">{scheduleSummary(billing, service.invoiceSchedule)}</Text>
      </View>
    </Pressable>
  );
}
