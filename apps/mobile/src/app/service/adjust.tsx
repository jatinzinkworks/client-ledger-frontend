import { useServiceCatalog } from '@cl/api';
import { CATEGORY_FILTERS, type CategoryFilter } from '@cl/schemas';
import { router, useLocalSearchParams } from 'expo-router';

import { AdjustPricesForm } from '@/components/services/AdjustPricesForm';
import { FormScreen } from '@/components/ui/FormScreen';
import { LoadError, Loading } from '@/components/ui/LoadState';

export default function AdjustPricesScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const catalog = useServiceCatalog();
  const scope = CATEGORY_FILTERS.some((f) => f.value === category) ? (category as CategoryFilter) : undefined;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/services'));
  return (
    <FormScreen title="Adjust Prices">
      {catalog.isLoading ? (
        <Loading />
      ) : catalog.loadError ? (
        <LoadError error={catalog.loadError} onRetry={() => catalog.refetch()} />
      ) : (
        <AdjustPricesForm
          services={catalog.services}
          defaultScope={scope}
          onApply={catalog.updateFees}
          applying={catalog.updatingFees}
          onDone={close}
        />
      )}
    </FormScreen>
  );
}
