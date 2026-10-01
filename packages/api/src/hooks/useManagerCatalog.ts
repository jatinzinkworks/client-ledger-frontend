import { useQueryClient } from '@tanstack/react-query';

import {
  getListManagersQueryKey,
  useCreateManager,
  useDeleteManager,
  useListManagers,
  useUpdateManager,
} from '../generated/manager-catalog/manager-catalog';
import type { ManagerRequest, ManagerResponse } from '../generated/model';

const fullName = (m: ManagerResponse) => `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
const byName = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

// The backend orders by last name; screens list managers by full name, A to Z. Module-level
// so React Query can memoise the selection between renders.
const sortByName = (managers: ManagerResponse[]) =>
  [...managers].sort((a, b) => byName.compare(fullName(a), fullName(b)));

/**
 * The manager catalog for a screen, shared by web and mobile: the full list (the endpoint is
 * not paged) sorted by name, plus create / update / delete, each refreshing the list.
 */
export function useManagerCatalog() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListManagersQueryKey() });

  const query = useListManagers({ query: { select: sortByName } });
  const create = useCreateManager({ mutation: { onSuccess: refresh } });
  const update = useUpdateManager({ mutation: { onSuccess: refresh } });
  const remove = useDeleteManager({ mutation: { onSuccess: refresh } });

  return {
    managers: query.data ?? [],
    isLoading: query.isPending,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    // orval interpolates path params as-is, so encode ids here.
    create: (data: ManagerRequest) => create.mutateAsync({ data }),
    update: (id: string, data: ManagerRequest) => update.mutateAsync({ id: encodeURIComponent(id), data }),
    remove: (id: string) => remove.mutateAsync({ id: encodeURIComponent(id) }),
    saving: create.isPending || update.isPending,
    deleting: remove.isPending,
  };
}
