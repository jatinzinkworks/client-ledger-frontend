import type { ManagerResponse } from '@cl/api';
import { formatInr, managerClientsLabel, managerInitials, managerName, roleLabel } from '@cl/schemas';
import { Phone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface ManagerCardProps {
  manager: ManagerResponse;
  onPress: () => void;
}

/** One manager — the mobile form of a web table row; tapping it opens the editor. */
export function ManagerCard({ manager, onPress }: ManagerCardProps) {
  const colors = useThemeColors();
  const name = managerName(manager);
  const pending = manager.totalPending;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${name}`}
      onPress={onPress}
      className="gap-3 rounded-lg border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Text className="text-sm font-bold text-primary">{managerInitials(manager)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-bold text-card-foreground">
            {name}
          </Text>
          <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
            {manager.email}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-sm text-card-foreground">{roleLabel(manager.role)}</Text>
        <View className="flex-row items-center gap-1.5">
          <Phone size={14} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{manager.mobileNumber}</Text>
        </View>
      </View>
      {/* Pending is what their clients owe across all years, not the selected one; red while owed. */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-card-foreground">{managerClientsLabel(manager.clientCount)}</Text>
        {pending != null && (
          <Text className={cn('text-base font-bold', pending > 0 ? 'text-destructive' : 'text-card-foreground')}>
            {formatInr(pending)} Pending
          </Text>
        )}
      </View>
    </Pressable>
  );
}
