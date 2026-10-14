import { useClients, useManagerCatalog } from '@cl/api';
import { ALL_MANAGERS, clientCountLabel, filterClients } from '@cl/schemas';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { ClientCard } from '@/components/clients/ClientCard';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { useThemeColors } from '@/theme/useThemeColors';
import { clientHref, newClientHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

export default function ClientsScreen() {
  const clients = useClients();
  const managers = useManagerCatalog();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [managerId, setManagerId] = useState(ALL_MANAGERS);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const visible = useMemo(
    () => filterClients(clients.clients, query, managerId, overdueOnly),
    [clients.clients, query, managerId, overdueOnly],
  );
  const count = clients.clients.length;
  const onboard = () => router.push(newClientHref);
  // Managers too: the filter and the onboarding form list them, and one may have been added.
  const refresh = () => {
    void clients.refetch();
    void managers.refetch();
  };

  return (
    <FlatList
      data={clients.isLoading || clients.loadError ? [] : visible}
      keyExtractor={(c) => c.id ?? c.email ?? ''}
      contentContainerClassName="gap-3 p-4"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className={`${EYEBROW} flex-shrink`}>{clients.isLoading ? ' ' : clientCountLabel(clients.clients)}</Text>
            <Button label="+ Onboard Client" className="py-2" onPress={onboard} />
          </View>
          <ClientFilters
            query={query}
            onQueryChange={setQuery}
            managerId={managerId}
            onManagerChange={setManagerId}
            managers={managers.managers}
            overdueOnly={overdueOnly}
            onOverdueOnlyChange={setOverdueOnly}
          />
        </View>
      }
      renderItem={({ item }) => <ClientCard client={item} onPress={() => item.id && router.push(clientHref(item.id))} />}
      ListEmptyComponent={
        clients.isLoading ? (
          <Loading className="py-8" />
        ) : clients.loadError ? (
          <LoadError error={clients.loadError} onRetry={() => clients.refetch()} />
        ) : (
          <View className="gap-3">
            <EmptyState
              title={count ? 'No Clients Match Your Search' : 'No Clients Yet'}
              description={
                count
                  ? 'Try A Different Name, Email, Company, Manager Or Status.'
                  : 'Onboard The People Your Firm Works For, With Their Companies.'
              }
            />
            {!count && <Button label="+ Onboard Client" onPress={onboard} />}
          </View>
        )
      }
    />
  );
}
