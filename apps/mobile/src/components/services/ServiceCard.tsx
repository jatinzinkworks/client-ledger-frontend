import type { CatalogServiceResponse } from '@cl/api';
import {
  CATEGORY_LABELS,
  formatGst,
  formatInr,
  scheduleSummary,
  serviceBilledLabel,
  usageLabel,
} from '@cl/schemas';
import { Pressable, Text, View } from 'react-native';

import { BillingBadge } from '@/components/BillingBadge';

import { EYEBROW } from '@/utils/typography';

interface ServiceCardProps {
  service: CatalogServiceResponse;
  onPress: () => void;
}

/** One catalog entry; tapping it opens the editor. */
export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const billing = service.billingFrequency;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${service.serviceName}`}
      onPress={onPress}
      className="gap-3 rounded-lg border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className={EYEBROW}>
          {service.category ? CATEGORY_LABELS[service.category] : ''}
        </Text>
        {billing && <BillingBadge billing={billing} />}
      </View>

      <View className="gap-1">
        <Text className="text-lg font-bold text-card-foreground">{service.serviceName}</Text>
        {service.description ? <Text className="text-base text-muted-foreground">{service.description}</Text> : null}
      </View>

      <View className="flex-row items-baseline gap-2">
        <Text className="text-3xl font-black text-card-foreground">{formatInr(service.standardFee ?? 0)}</Text>
        <Text className="text-base text-muted-foreground">{formatGst(service.gstRatePercent)}</Text>
      </View>

      <View className="flex-row items-end justify-between gap-3 border-t border-border pt-3">
        <View className="flex-1 gap-0.5">
          <Text className="text-sm text-card-foreground">{usageLabel(service.usedByCompanies)}</Text>
          <Text className="text-xs text-muted-foreground">{scheduleSummary(billing, service.invoiceSchedule)}</Text>
        </View>
        {/* All years to date, as on web (the list is fetched without a financial year). */}
        {service.totalBilled != null && (
          <Text className="text-sm font-bold text-card-foreground">{serviceBilledLabel(service.totalBilled)}</Text>
        )}
      </View>
    </Pressable>
  );
}
