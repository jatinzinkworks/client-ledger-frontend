import { useQueryClient } from '@tanstack/react-query';

import { isNotFound } from '../errors';
import {
  getGetClientQueryKey,
  getListClientsQueryKey,
  useAddCompany,
  useDeleteClient,
  useDeleteCompany,
  useGetClient,
  useUpdateClient,
} from '../generated/clients/clients';
import type { ClientUpdateRequest, CompanyRequest } from '../generated/model';
import { retryUnlessNotFound } from './singletonSetting';

/** One client in full — details, manager name and every company — for the client page. */
export function useClient(id: string) {
  const queryClient = useQueryClient();
  // orval interpolates path params as-is, so encode the id here.
  const encodedId = encodeURIComponent(id);
  const query = useGetClient(encodedId, { query: { enabled: !!id, retry: retryUnlessNotFound } });
  const update = useUpdateClient({
    mutation: {
      onSuccess: (saved) => {
        // The PUT returns the client in full, so show it straight away; the list (names,
        // manager) refreshes in the background.
        queryClient.setQueryData(getGetClientQueryKey(encodedId), saved);
        return queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      },
    },
  });

  // The screen leaves the client page once this resolves; a later visit refetches into a 404.
  const remove = useDeleteClient({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }) },
  });

  // Company changes alter this client and the list's company names.
  const refreshClient = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(encodedId) }),
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }),
    ]);
  const addCompany = useAddCompany({ mutation: { onSuccess: refreshClient } });
  const deleteCompany = useDeleteCompany({ mutation: { onSuccess: refreshClient } });

  const notFound = isNotFound(query.error);
  return {
    client: query.data,
    isLoading: query.isPending && !notFound,
    /** No client carries this id (deleted, or a stale link). */
    notFound,
    loadError: notFound ? null : (query.error as Error | null),
    refetch: query.refetch,
    isRefreshing: query.isFetching && !query.isPending,
    /** Replaces the client's own fields; their companies are left as they are. */
    update: (data: ClientUpdateRequest) => update.mutateAsync({ id: encodedId, data }),
    saving: update.isPending,
    /** Deletes the client and their companies; 409 while services are assigned to any of them. */
    remove: () => remove.mutateAsync({ id: encodedId }),
    deleting: remove.isPending,
    /** Adds one company; 409 once the client holds the most companies allowed. */
    addCompany: (data: CompanyRequest) => addCompany.mutateAsync({ id: encodedId, data }),
    addingCompany: addCompany.isPending,
    /** 409 for the client's only company, or while services are assigned to it. */
    deleteCompany: (companyId: string) => deleteCompany.mutateAsync({ id: encodedId, companyId: encodeURIComponent(companyId) }),
    deletingCompany: deleteCompany.isPending,
  };
}
