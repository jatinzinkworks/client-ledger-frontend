import type { ServiceAssignmentResponse } from '@cl/api';
import {
  chargeBreakdown,
  companyDiscountLabel,
  formatApiDate,
  formatInr,
  gstRateLabel,
  servicesCountLabel,
} from '@cl/schemas';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BillingBadge } from '@/components/BillingBadge';
import { Section } from '@/components/ui/Section';
import { LoadError, Loading } from '@/components/ui/LoadState';
import { useThemeColors } from '@/theme/useThemeColors';

interface CompanyServicesProps {
  services: readonly ServiceAssignmentResponse[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Opens Edit Service. */
  onOpen: (service: ServiceAssignmentResponse) => void;
}

/** A label over a value, for the figures and dates of a card. */
function Figure({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="min-w-[30%] flex-1 gap-0.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className={bold ? 'text-base font-bold text-card-foreground' : 'text-base text-card-foreground'}>{value}</Text>
    </View>
  );
}

/** One delivered service: its schedule, discount and charge, as the web table's row. */
function AssignedServiceCard({ service: s, onPress }: { service: ServiceAssignmentResponse; onPress: () => void }) {
  const colors = useThemeColors();
  const charge = s.serviceFee != null ? chargeBreakdown(s.serviceFee, s.discountPercent ?? 0, s.gstRatePercent) : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${s.serviceName}`}
      onPress={onPress}
      className="gap-3 border-t border-border px-4 py-4 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          {s.serviceType && <BillingBadge billing={s.serviceType} />}
          <Text className="text-base font-bold text-card-foreground">{s.serviceName}</Text>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </View>
      <View className="flex-row flex-wrap gap-y-3">
        <Figure label="Delivery Date" value={formatApiDate(s.deliveryDate) || '—'} />
        <Figure label="Next Due Date" value={formatApiDate(s.nextDueDate) || '—'} />
        <Figure label="Discount" value={companyDiscountLabel(s.discountPercent)} />
        <Figure label="Net Charge" value={charge ? formatInr(charge.net) : '—'} bold />
        <Figure label={`GST (${gstRateLabel(s.gstRatePercent)})`} value={charge ? formatInr(charge.gst) : '—'} />
        <Figure label="Total" value={charge ? formatInr(charge.total) : '—'} bold />
      </View>
      {s.comment ? <Text className="text-sm text-muted-foreground">{s.comment}</Text> : null}
    </Pressable>
  );
}

/** The services assigned to a company, most recent delivery first; a card opens Edit Service. */
export function CompanyServices({ services, isLoading, error, onRetry, onOpen }: CompanyServicesProps) {
  const body = () => {
    if (isLoading) return <Loading />;
    if (error) {
      return (
        <View className="px-4 pb-4">
          <LoadError error={error} onRetry={onRetry} />
        </View>
      );
    }
    if (!services.length) {
      return (
        <Text className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No Services Recorded For This Company Yet.
        </Text>
      );
    }
    return services.map((s) => (
      <AssignedServiceCard key={s.id ?? `${s.serviceId}-${s.deliveryDate}`} service={s} onPress={() => onOpen(s)} />
    ));
  };
  return (
    <Section title="Services" hint={isLoading || error ? undefined : servicesCountLabel(services.length)} flush>
      {body()}
    </Section>
  );
}
