import { errorMessage, useManagerCatalog } from '@cl/api';
import { REASSIGN_CLIENTS_LABEL, managerCountLabel } from '@cl/schemas';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { ManagerCard } from '@/components/managers/ManagerCard';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/theme/useThemeColors';
import { reassignClientsHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

export default function ManagersScreen() {
  const catalog = useManagerCatalog();
  const colors = useThemeColors();
  const count = catalog.managers.length;
  const openNew = () => router.push('/manager/new');

  return (
    <FlatList
      data={catalog.isLoading || catalog.loadError ? [] : catalog.managers}
      keyExtractor={(m) => m.id ?? m.email ?? ''}
      contentContainerClassName="gap-3 p-4"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => catalog.refetch()} tintColor={colors.mutedForeground} />
      }
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          <Text className={EYEBROW}>
            {catalog.isLoading ? ' ' : managerCountLabel(count)}
          </Text>
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              label={REASSIGN_CLIENTS_LABEL}
              className="flex-1 py-2"
              disabled={count < 2}
              onPress={() => router.push(reassignClientsHref)}
            />
            <Button label="+ Add Manager" className="flex-1 py-2" onPress={openNew} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <ManagerCard manager={item} onPress={() => router.push({ pathname: '/manager/[id]', params: { id: item.id! } })} />
      )}
      ListEmptyComponent={
        catalog.isLoading ? (
          <ActivityIndicator color={colors.mutedForeground} className="py-8" />
        ) : catalog.loadError ? (
          <View className="gap-3 py-4">
            <Text className="text-sm text-destructive">{errorMessage(catalog.loadError)}</Text>
            <Button variant="outline" label="Retry" onPress={() => catalog.refetch()} />
          </View>
        ) : (
          <View className="items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-10">
            <Text className="text-lg font-bold text-card-foreground">No Managers Yet</Text>
            <Text className="text-center text-sm text-muted-foreground">Add The Staff Who Look After Your Clients.</Text>
          </View>
        )
      }
    />
  );
}
