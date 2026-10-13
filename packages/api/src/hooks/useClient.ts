import { useQueryClient } from '@tanstack/react-query';

import { isNotFound } from '../errors';
import {
  getListCompaniesQueryKey,
  useAddCompany,
  useDeleteCompany,
  useListCompanies,
} from '../generated/client-companies/client-companies';
import {
  getGetClientQueryKey,
  getListClientsQueryKey,
  useDeleteClient,
  useGetClient,
  useUpdateClient,
} from '../generated/clients/clients';
import type { ClientUpdateRequest, CompanyRequest } from '../generated/model';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * One client in full — details, manager name and every company — for the client page. The
 * companies come from the companies list, which (unlike the client) carries each one's service
 * count, and — given a financial year — what each was billed, paid and still owes in it.
 */
export function useClient(id: string, financialYear?: string) {
  const queryClient = useQueryClient();
  // orval interpolates path params as-is, so encode the id here.
  const encodedId = encodeURIComponent(id);
  const options = { query: { enabled: !!id, retry: retryUnlessNotFound } };
  const query = useGetClient(encodedId, options);
  // Given a financial year, each company also carries what it was billed, paid and owes in it.
  const companies = useListCompanies(encodedId, financialYear ? { financialYear } : undefined, options);
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

  // Company changes alter this client, their companies and the list's company names.
  const refreshClient = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(encodedId) }),
      queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey(encodedId) }),
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }),
    ]);
  const addCompany = useAddCompany({ mutation: { onSuccess: refreshClient } });
  const deleteCompany = useDeleteCompany({ mutation: { onSuccess: refreshClient } });

  const notFound = isNotFound(query.error);
  return {
    // Only what was fetched since the page opened — never an older cached copy.
    client: freshData(query),
    /** With service counts; the client's own companies (no counts) until the list arrives. */
    companies: freshData(companies) ?? freshData(query)?.companies ?? [],
    isLoading: awaitingFresh(query) && !notFound,
    /** No client carries this id (deleted, or a stale link). */
    notFound,
    loadError: notFound ? null : (query.error as Error | null),
    refetch: () => Promise.all([query.refetch(), companies.refetch()]),
    isRefreshing: (query.isFetching && !query.isPending) || (companies.isFetching && !companies.isPending),
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
