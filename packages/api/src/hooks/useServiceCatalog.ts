import { useQueryClient } from '@tanstack/react-query';

import type { CatalogServiceRequest, CatalogServiceResponse, ServiceFeeBulkUpdateRequest } from '../generated/model';
import {
  getListServicesQueryKey,
  useCreateService,
  useDeleteService,
  useListServices,
  useUpdateFees,
  useUpdateService,
} from '../generated/service-catalog/service-catalog';
import { normalizeService } from '../normalize';

// Module-level so React Query can memoise the selection between renders.
const normalizeAll = (services: CatalogServiceResponse[]) => services.map(normalizeService);

/**
 * The service catalog for a screen, shared by web and mobile: the full list (the endpoint is
 * not paged) plus create / update / delete and bulk fee changes, each of which refreshes the
 * list on success.
 */
export function useServiceCatalog() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  // Fetched without financialYear (by request), so services carry no per-year totalBilled.
  const query = useListServices(undefined, { query: { select: normalizeAll } });
  const create = useCreateService({ mutation: { onSuccess: refresh } });
  const update = useUpdateService({ mutation: { onSuccess: refresh } });
  const remove = useDeleteService({ mutation: { onSuccess: refresh } });
  // New fees also change what client screens show for their services (fee, GST, total).
  const fees = useUpdateFees({
    mutation: {
      onSuccess: () =>
        Promise.all([
          refresh(),
          queryClient.invalidateQueries({
            predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/psc/cl/v1/clients'),
          }),
        ]),
    },
  });

  return {
    services: query.data ?? [],
    isLoading: query.isPending,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    /** A background re-fetch is running (not the first load). */
    isRefreshing: query.isFetching && !query.isPending,
    // orval interpolates path params as-is, so encode ids here.
    create: (data: CatalogServiceRequest) => create.mutateAsync({ data }),
    update: (id: string, data: CatalogServiceRequest) => update.mutateAsync({ id: encodeURIComponent(id), data }),
    remove: (id: string) => remove.mutateAsync({ id: encodeURIComponent(id) }),
    /** Changes the standard fees of several services at once (all or nothing). */
    updateFees: (data: ServiceFeeBulkUpdateRequest) => fees.mutateAsync({ data }),
    updatingFees: fees.isPending,
    saving: create.isPending || update.isPending,
    deleting: remove.isPending,
  };
}
