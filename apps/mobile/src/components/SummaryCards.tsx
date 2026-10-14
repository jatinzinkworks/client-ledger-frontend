import type { SummaryCard, SummaryChange, SummaryTone } from '@cl/schemas';
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { LoadError, Loading } from '@/components/ui/LoadState';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface SummaryCardsProps {
  /** The cards to show; undefined until the summary has loaded. */
  cards?: readonly SummaryCard[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const TONE_CLASS: Readonly<Record<SummaryTone, string>> = {
  default: 'text-card-foreground',
  positive: 'text-success',
  negative: 'text-destructive',
};

const CHANGE_ICONS: Readonly<Record<SummaryChange['direction'], LucideIcon>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/** "↗ 12% vs FY 2025–26 To Date", green when the move is good and red when it is bad. */
function ChangeLine({ change }: { change: SummaryChange }) {
  const colors = useThemeColors();
  const Icon = CHANGE_ICONS[change.direction];
  const color = change.tone === 'positive' ? colors.success : change.tone === 'negative' ? colors.destructive : colors.foreground;
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={14} color={color} />
      <Text className={cn('flex-1 text-xs font-bold', TONE_CLASS[change.tone])}>{change.label}</Text>
    </View>
  );
}

/** Figure cards (Billed, Received, Pending…), two to a row — the same cards as on web. */
export function SummaryCards({ cards, isLoading, error, onRetry }: SummaryCardsProps) {
  if (isLoading) return <Loading />;
  if (error) return <LoadError error={error} onRetry={onRetry} />;
  if (!cards) return null;
  return (
    <View className="flex-row flex-wrap gap-3">
      {cards.map(({ label, value, note, tone, change }) => (
        <View key={label} className="min-w-[45%] flex-1 gap-1.5 rounded-lg border border-border bg-card p-4">
          <Text className="text-base font-bold text-card-foreground">{label}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} className={cn('text-2xl font-black', TONE_CLASS[tone])}>
            {value}
          </Text>
          {note ? <Text className="text-sm text-muted-foreground">{note}</Text> : null}
          {change && <ChangeLine change={change} />}
        </View>
      ))}
    </View>
  );
}
