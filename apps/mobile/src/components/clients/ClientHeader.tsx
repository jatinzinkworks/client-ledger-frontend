import type { ClientResponse } from '@cl/api';
import { clientHeaderDetails, clientName } from '@cl/schemas';
import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LEVEL_ACCENT, LevelBadge } from '@/components/LevelBadge';
import { useThemeColors } from '@/theme/useThemeColors';
import { EYEBROW } from '@/utils/typography';

import { ClientBirthday } from './ClientBirthday';

interface ClientHeaderProps {
  client: ClientResponse;
  /** The selected financial year's label, "FY 2026–27", shown as the eyebrow. */
  yearLabel: string;
  onEdit: () => void;
}

/** The client page's header: the Client badge and year, the name with Edit Client, and their details. */
export function ClientHeader({ client, yearLabel, onEdit }: ClientHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className={`gap-1.5 ${LEVEL_ACCENT.client}`}>
      <View className="flex-row flex-wrap items-center gap-2">
        <LevelBadge level="client" />
        <Text className={EYEBROW}>{yearLabel}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="flex-shrink text-2xl font-bold text-foreground">{clientName(client)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Client"
          hitSlop={8}
          onPress={onEdit}
          className="h-9 w-9 items-center justify-center rounded-md border border-border bg-card active:opacity-70"
        >
          <Pencil size={16} color={colors.foreground} />
        </Pressable>
      </View>
      {clientHeaderDetails(client).map((detail) => (
        <Text key={detail} className="text-sm text-muted-foreground">
          {detail}
        </Text>
      ))}
      <ClientBirthday birthday={client.birthday} iconSize={14} className="text-sm" />
    </View>
  );
}
