import { isNotFound } from '../errors';
import { useListServices1 } from '../generated/client-services/client-services';
import { useGetCompany } from '../generated/clients/clients';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * One company of a client for the company page: its details plus the services assigned to
 * it (most recent delivery first, as the backend returns them).
 */
export function useCompany(clientId: string, companyId: string) {
  // orval interpolates path params as-is, so encode the ids here.
  const ids = [encodeURIComponent(clientId), encodeURIComponent(companyId)] as const;
  const options = { query: { enabled: !!clientId && !!companyId, retry: retryUnlessNotFound } };
  const company = useGetCompany(...ids, options);
  const services = useListServices1(...ids, options);

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
  };
}
