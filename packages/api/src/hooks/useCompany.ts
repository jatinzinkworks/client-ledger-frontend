import { useQueryClient } from '@tanstack/react-query';

import { isNotFound } from '../errors';
import { useListServices1 } from '../generated/client-services/client-services';
import {
  getGetClientQueryKey,
  getGetCompanyQueryKey,
  getListClientsQueryKey,
  useGetCompany,
  useUpdateCompany,
} from '../generated/clients/clients';
import type { CompanyRequest } from '../generated/model';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * One company of a client for the company page: its details plus the services assigned to
 * it (most recent delivery first, as the backend returns them), and editing the company.
 */
export function useCompany(clientId: string, companyId: string) {
  // orval interpolates path params as-is, so encode the ids here.
  const ids = [encodeURIComponent(clientId), encodeURIComponent(companyId)] as const;
  const options = { query: { enabled: !!clientId && !!companyId, retry: retryUnlessNotFound } };
  const company = useGetCompany(...ids, options);
  const services = useListServices1(...ids, options);
  const queryClient = useQueryClient();
  const update = useUpdateCompany({
    mutation: {
      onSuccess: (saved) => {
        // Show the saved company at once; the client page and list (names) refresh behind it.
        queryClient.setQueryData(getGetCompanyQueryKey(...ids), saved);
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(ids[0]) }),
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }),
        ]);
      },
    },
  });

  const notFound = isNotFound(company.error);
  return {
    company: company.data,
    services: services.data ?? [],
    isLoading: company.isPending && !notFound,
    servicesLoading: services.isPending && !services.error,
    /** No such client, or the client holds no such company. */
    notFound,
    loadError: notFound ? null : (company.error as Error | null),
    servicesError: notFound ? null : (services.error as Error | null),
    refetch: () => Promise.all([company.refetch(), services.refetch()]),
    isRefreshing: (company.isFetching && !company.isPending) || (services.isFetching && !services.isPending),
    /** Replaces the company wholesale; an omitted discount becomes the client's. */
    update: (data: CompanyRequest) => update.mutateAsync({ id: ids[0], companyId: ids[1], data }),
    saving: update.isPending,
  };
}
