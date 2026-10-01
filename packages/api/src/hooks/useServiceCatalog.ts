import { useQueryClient } from '@tanstack/react-query';

import type { CatalogServiceRequest, CatalogServiceResponse } from '../generated/model';
import {
  getListServicesQueryKey,
  useCreateService,
  useDeleteService,
  useListServices,
  useUpdateService,
} from '../generated/service-catalog/service-catalog';
import { normalizeService } from '../normalize';

// Module-level so React Query can memoise the selection between renders.
const normalizeAll = (services: CatalogServiceResponse[]) => services.map(normalizeService);

/**
 * The service catalog for a screen, shared by web and mobile: the full list (the endpoint is
 * not paged) plus create / update / delete, each of which refreshes the list on success.
 */
export function useServiceCatalog() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const query = useListServices({ query: { select: normalizeAll } });
  const create = useCreateService({ mutation: { onSuccess: refresh } });
  const update = useUpdateService({ mutation: { onSuccess: refresh } });
  const remove = useDeleteService({ mutation: { onSuccess: refresh } });

  return {
    services: query.data ?? [],
    isLoading: query.isPending,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    // orval interpolates path params as-is, so encode ids here.
    create: (data: CatalogServiceRequest) => create.mutateAsync({ data }),
    update: (id: string, data: CatalogServiceRequest) => update.mutateAsync({ id: encodeURIComponent(id), data }),
    remove: (id: string) => remove.mutateAsync({ id: encodeURIComponent(id) }),
    saving: create.isPending || update.isPending,
    deleting: remove.isPending,
  };
}
