import type { ClientResponse } from '@cl/api';
import { clientName, clientSinceLabel, discountLabel } from '@cl/schemas';
import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { EYEBROW } from '@/utils/typography';

/** The details under the client's name, as on web: email, phone, manager, discount, client since. */
const clientDetails = (client: ClientResponse) =>
  [
    client.email,
    client.phone,
    client.managerName && `Manager: ${client.managerName}`,
    discountLabel(client.discountPercent),
    clientSinceLabel(client.createdAt),
  ].filter((detail): detail is string => !!detail);

interface ClientHeaderProps {
  client: ClientResponse;
  /** The selected financial year's label, "FY 2026–27", shown as the eyebrow. */
  yearLabel: string;
  onEdit: () => void;
}

/** The client page's header: the year being shown, the name with Edit Client, and their details. */
export function ClientHeader({ client, yearLabel, onEdit }: ClientHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-1">
      <Text className={EYEBROW}>Client · {yearLabel}</Text>
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
      {clientDetails(client).map((detail) => (
        <Text key={detail} className="text-sm text-muted-foreground">
          {detail}
        </Text>
      ))}
    </View>
  );
}
