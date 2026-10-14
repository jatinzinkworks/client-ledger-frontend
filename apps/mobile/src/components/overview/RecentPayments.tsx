import { useLatestPayments, type RecentPayment, type RecentPaymentMethod } from '@cl/api';
import { NO_RECENT_PAYMENTS, formatInr, groupPaymentsByDay, paymentMethodLabel, recentPaymentsNote } from '@cl/schemas';
import { router } from 'expo-router';
import { Banknote, Landmark, ScrollText, Smartphone, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { companyHref } from '@/utils/routes';

import { OverviewSection, SectionEmpty } from './OverviewSection';

const METHOD_ICONS: Readonly<Record<RecentPaymentMethod, LucideIcon>> = {
  BANK_TRANSFER: Landmark,
  UPI: Smartphone,
  CHEQUE: ScrollText,
  CASH: Banknote,
};

/** One payment: who paid (to their company screen), how, and how much. */
function PaymentRow({ payment }: { payment: RecentPayment }) {
  const colors = useThemeColors();
  const Icon = payment.method ? METHOD_ICONS[payment.method] : Banknote;
  const details = [payment.clientName, paymentMethodLabel(payment.method), payment.reference].filter(Boolean).join(' · ');
  const { clientId, companyId } = payment;
  const name = (
    <Text numberOfLines={1} className="font-bold text-card-foreground">
      {payment.companyName ?? ''}
    </Text>
  );
  return (
    <View className="flex-row items-center gap-3 border-t border-border px-4 py-3">
      {/* A tinted circle cannot be drawn from a token on mobile, so it is outlined instead. */}
      <View className="size-9 items-center justify-center rounded-full border border-success">
        <Icon size={16} color={colors.success} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        {clientId && companyId ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(companyHref(clientId, companyId))}
            hitSlop={6}
            className="active:opacity-70"
          >
            {name}
          </Pressable>
        ) : (
          name
        )}
        <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
          {details}
        </Text>
      </View>
      <Text className="shrink-0 font-bold text-success">+ {formatInr(payment.amount ?? 0)}</Text>
    </View>
  );
}

/** The latest payments received from any company, grouped by day with each day's total. */
export function RecentPayments() {
  const { payments, isLoading, error, refetch } = useLatestPayments();
  return (
    <OverviewSection
      title="Received Payments"
      hint={payments?.length ? recentPaymentsNote(payments) : undefined}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {payments &&
        (payments.length === 0 ? (
          <SectionEmpty message={NO_RECENT_PAYMENTS} />
        ) : (
          groupPaymentsByDay(payments).map((day) => (
            <View key={day.label}>
              <View className="flex-row items-center justify-between border-t border-border bg-muted px-4 py-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{day.label}</Text>
                <Text className="text-xs font-bold text-muted-foreground">{formatInr(day.total)}</Text>
              </View>
              {day.payments.map((payment) => (
                <PaymentRow key={payment.paymentId} payment={payment} />
              ))}
            </View>
          ))
        ))}
    </OverviewSection>
  );
}
