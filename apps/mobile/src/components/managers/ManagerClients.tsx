import { useManagerClients, type ClientSummaryResponse } from '@cl/api';
import { clientName, formatInr } from '@cl/schemas';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AccountStatusBadge } from '@/components/AccountStatusBadge';
import { LoadError, Loading } from '@/components/ui/LoadState';
import { cn } from '@/utils/cn';
import { clientHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

/** One client of the manager: name (opens the client), companies, what they owe and status. */
function ClientRow({ client }: { client: ClientSummaryResponse }) {
  const pending = client.totalPending;
  const name = clientName(client);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${name}`}
      onPress={() => client.id && router.push(clientHref(client.id))}
      className="flex-row items-start justify-between gap-3 px-4 py-3 active:bg-muted"
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-bold text-card-foreground">
          {name}
        </Text>
        <Text className="text-sm text-muted-foreground">{client.companyNames?.join(', ')}</Text>
      </View>
      <View className="items-end gap-1">
        {pending != null && (
          <Text className={cn('font-bold', pending > 0 ? 'text-destructive' : 'text-card-foreground')}>{formatInr(pending)}</Text>
        )}
        <AccountStatusBadge pending={pending} />
      </View>
    </Pressable>
  );
}

/** The clients a manager looks after, under Edit Manager (only fetching a manager by id carries them). */
export function ManagerClients({ managerId }: { managerId: string }) {
  const { clients, isLoading, error, refetch } = useManagerClients(managerId);
  return (
    <View className="gap-2">
      <Text className={EYEBROW}>Clients</Text>
      {isLoading && <Loading />}
      {error && <LoadError error={error} onRetry={refetch} />}
      {!isLoading &&
        !error &&
        (clients.length ? (
          <View className="overflow-hidden rounded-lg border border-border bg-card">
            {clients.map((client, index) => (
              <View key={client.id} className={cn(index > 0 && 'border-t border-border')}>
                <ClientRow client={client} />
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">No Clients Yet.</Text>
        ))}
    </View>
  );
}
