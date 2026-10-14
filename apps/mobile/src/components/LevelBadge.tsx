import { PAGE_LEVEL_LABELS, companyOwnerLabel, type PageLevel } from '@cl/schemas';
import { Building2, ChevronRight, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

const LEVELS: Readonly<Record<PageLevel, { icon: LucideIcon; box: string; text: string; color: 'primaryForeground' | 'brand' }>> = {
  // A client is the top level: a solid pill. A company sits under it: an outlined one (as on web).
  client: { icon: Users, box: 'bg-primary', text: 'text-primary-foreground', color: 'primaryForeground' },
  company: { icon: Building2, box: 'border-2 border-brand', text: 'text-brand', color: 'brand' },
};

/** The accent down the left of a detail header, matching the badge's colour. */
export const LEVEL_ACCENT: Readonly<Record<PageLevel, string>> = {
  client: 'border-l-4 border-primary pl-3',
  company: 'border-l-4 border-brand pl-3',
};

interface LevelBadgeProps {
  level: PageLevel;
  /** A company's client: shown as "Of Rohan Mehta", opening them. */
  owner?: { name: string; onPress: () => void };
}

/** "CLIENT", or "COMPANY · Of Rohan Mehta ›": which level of the hierarchy this screen shows. */
export function LevelBadge({ level, owner }: LevelBadgeProps) {
  const colors = useThemeColors();
  const { icon: Icon, box, text, color } = LEVELS[level];
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <View className={cn('h-7 flex-row items-center gap-1.5 rounded-full px-3', box)}>
        <Icon size={14} color={colors[color]} />
        <Text className={cn('text-xs font-black uppercase tracking-wider', text)}>{PAGE_LEVEL_LABELS[level]}</Text>
      </View>
      {owner && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${owner.name}`}
          onPress={owner.onPress}
          hitSlop={6}
          className="flex-row items-center gap-0.5 active:opacity-60"
        >
          <Text className="text-[15px] font-bold text-brand">{companyOwnerLabel(owner.name)}</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
      )}
    </View>
  );
}
