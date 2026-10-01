import { errorMessage, useServiceCatalog } from '@cl/api';
import { filterServices, type CategoryFilter } from '@cl/schemas';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceFilters } from '@/components/services/ServiceFilters';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/theme/useThemeColors';

export default function ServicesScreen() {
  const catalog = useServiceCatalog();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const visible = useMemo(() => filterServices(catalog.services, query, category), [catalog.services, query, category]);
  const count = catalog.services.length;

  const openNew = () =>
    router.push({ pathname: '/service/new', params: category === 'ALL' ? {} : { category } });

  return (
    <FlatList
      data={catalog.isLoading || catalog.loadError ? [] : visible}
      keyExtractor={(s) => s.id ?? s.serviceName ?? ''}
      contentContainerClassName="gap-3 p-4"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => catalog.refetch()} tintColor={colors.mutedForeground} />
      }
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[11px] uppercase tracking-widest text-brand">
              {catalog.isLoading ? ' ' : `${count} ${count === 1 ? 'Service' : 'Services'}`}
            </Text>
            <Button label="+ New Service" className="py-2" onPress={openNew} />
          </View>
          <ServiceFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />
        </View>
      }
      renderItem={({ item }) => (
        <ServiceCard service={item} onPress={() => router.push({ pathname: '/service/[id]', params: { id: item.id! } })} />
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
            <Text className="text-lg font-bold text-card-foreground">
              {count ? 'No Services Match Your Search' : 'No Services Yet'}
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              {count ? 'Try A Different Name Or Category.' : 'Add The Services Your Firm Offers, With Their Fees And Billing Schedules.'}
            </Text>
          </View>
        )
      }
    />
  );
}
