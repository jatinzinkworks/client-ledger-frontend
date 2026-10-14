import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

/** Pill colours, the same roles as the web StatusPill. */
export type StatusTone = 'danger' | 'success' | 'brand' | 'warning';

// NativeWind cannot tint our CSS-variable colours (`bg-destructive/10`), so the web's tinted
// pill becomes an outlined one here.
const TONES: Readonly<Record<StatusTone, { box: string; text: string }>> = {
  danger: { box: 'border-destructive', text: 'text-destructive' },
  success: { box: 'border-success', text: 'text-success' },
  brand: { box: 'border-brand', text: 'text-brand' },
  warning: { box: 'border-warning', text: 'text-warning' },
};

/** A small upper-case status pill, e.g. OVERDUE or SETTLED. */
export function StatusPill({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  const t = TONES[tone];
  return (
    <View className={cn('self-start rounded-full border px-2.5 py-0.5', t.box, className)}>
      <Text className={cn('text-[11px] font-black uppercase tracking-wide', t.text)}>{label}</Text>
    </View>
  );
}
