import type { ClientSummaryResponse } from '@cl/api';
import { CLIENT_ID_LABEL, clientName, formatInr } from '@cl/schemas';
import { Phone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AccountStatusBadge } from '@/components/AccountStatusBadge';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';
import { EYEBROW } from '@/utils/typography';

import { ClientBirthday } from './ClientBirthday';

interface ClientCardProps {
  client: ClientSummaryResponse;
  onPress: () => void;
}

/**
 * One client, as the web ClientCard: name, client id, email, phone, birthday (when recorded) and status, their companies, what they still
 * owe (across all years) and their manager. Tapping it opens the client.
 */
export function ClientCard({ client, onPress }: ClientCardProps) {
  const colors = useThemeColors();
  const name = clientName(client);
  const pending = client.totalPending;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={onPress}
      className="gap-4 rounded-lg border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-lg font-bold text-card-foreground">
            {name}
          </Text>
          {client.clientId ? (
            <Text accessibilityLabel={`${CLIENT_ID_LABEL} ${client.clientId}`} className="text-[13px] font-bold text-muted-foreground">
              {client.clientId}
            </Text>
          ) : null}
          <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
            {client.email}
          </Text>
          {client.phone ? (
            <View className="flex-row items-center gap-1.5">
              <Phone size={13} color={colors.mutedForeground} />
              <Text className="text-[13px] text-muted-foreground">{client.phone}</Text>
            </View>
          ) : null}
          <ClientBirthday birthday={client.birthday} className="text-[13px]" />
        </View>
        <AccountStatusBadge pending={pending} />
      </View>

      <View className="gap-1">
        <Text className={EYEBROW}>Companies</Text>
        {client.companyNames?.map((company) => (
          <Text key={company} className="text-[15px] text-card-foreground">
            {company}
          </Text>
        ))}
      </View>

      {pending != null && (
        <View className="gap-1">
          <Text className="text-sm text-foreground">Pending</Text>
          {/* Red while the client owes anything, like their Overdue status. */}
          <Text className={cn('text-3xl font-black', pending > 0 ? 'text-destructive' : 'text-card-foreground')}>
            {formatInr(pending)}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
        <Text className="text-[15px] text-muted-foreground">Manager</Text>
        <Text numberOfLines={1} className="flex-shrink text-[15px] font-bold text-card-foreground">
          {client.managerName}
        </Text>
      </View>
    </Pressable>
  );
}
