import { useQueryClient } from '@tanstack/react-query';

import { isNotFound } from '../errors';
import {
  getGetCompanyQueryKey,
  getListCompaniesQueryKey,
  useGetCompany,
  useUpdateCompany,
} from '../generated/client-companies/client-companies';
import {
  getListServices1QueryKey,
  useAssignService,
  useListServices1,
  useRemoveService,
  useUpdateService1,
} from '../generated/client-services/client-services';
import { getGetClientQueryKey, getListClientsQueryKey } from '../generated/clients/clients';
import type { CompanyRequest, ServiceAssignmentRequest, ServiceAssignmentUpdateRequest } from '../generated/model';
import { getListServicesQueryKey } from '../generated/service-catalog/service-catalog';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';

/**
 * One company of a client for the company page: its details plus the services assigned to
 * it (most recent delivery first, as the backend returns them), editing the company, and
 * adding, editing and deleting its services.
 */
export function useCompany(clientId: string, companyId: string) {
  // orval interpolates path params as-is, so encode the ids here.
  const ids = [encodeURIComponent(clientId), encodeURIComponent(companyId)] as const;
  const options = { query: { enabled: !!clientId && !!companyId, retry: retryUnlessNotFound } };
  const company = useGetCompany(...ids, options);
  // financialYear (each service's totalBilled for the year) is not used yet.
  const services = useListServices1(...ids, undefined, options);
  const queryClient = useQueryClient();
  const update = useUpdateCompany({
    mutation: {
      onSuccess: (saved) => {
        // Show the saved company at once; the client page and list (names) refresh behind it.
        queryClient.setQueryData(getGetCompanyQueryKey(...ids), saved);
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(ids[0]) }),
          queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey(ids[0]) }),
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }),
        ]);
      },
    },
  });
  // Adding or removing a service changes the company's services, the client page's service
  // counts and the catalog's "used by" counts.
  const refreshServiceCounts = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getListServices1QueryKey(...ids) }),
      queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey(ids[0]) }),
      queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() }),
    ]);
  const assign = useAssignService({ mutation: { onSuccess: refreshServiceCounts } });
  const removeAssignment = useRemoveService({ mutation: { onSuccess: refreshServiceCounts } });
  const updateAssignment = useUpdateService1({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListServices1QueryKey(...ids) }) },
  });

  const notFound = isNotFound(company.error);
  return {
    // Only what was fetched since the page opened — never an older cached copy.
    company: freshData(company),
    services: freshData(services) ?? [],
    isLoading: awaitingFresh(company) && !notFound,
    servicesLoading: awaitingFresh(services),
    /** No such client, or the client holds no such company. */
    notFound,
    loadError: notFound ? null : (company.error as Error | null),
    servicesError: notFound ? null : (services.error as Error | null),
    refetch: () => Promise.all([company.refetch(), services.refetch()]),
    isRefreshing: (company.isFetching && !company.isPending) || (services.isFetching && !services.isPending),
    /** Replaces the company wholesale; an omitted discount becomes the client's. */
    update: (data: CompanyRequest) => update.mutateAsync({ id: ids[0], companyId: ids[1], data }),
    saving: update.isPending,
    /** Assigns a catalog service; an omitted discount becomes the company's. */
    addService: (data: ServiceAssignmentRequest) =>
      assign.mutateAsync({ clientId: ids[0], companyId: ids[1], data }),
    addingService: assign.isPending,
    /** Changes a delivered service's date, discount and note; the next due date is recalculated. */
    updateService: (assignmentId: string, data: ServiceAssignmentUpdateRequest) =>
      updateAssignment.mutateAsync({
        clientId: ids[0],
        companyId: ids[1],
        assignmentId: encodeURIComponent(assignmentId),
        data,
      }),
    updatingService: updateAssignment.isPending,
    /** Removes a delivered service from the company. */
    deleteService: (assignmentId: string) =>
      removeAssignment.mutateAsync({ clientId: ids[0], companyId: ids[1], assignmentId: encodeURIComponent(assignmentId) }),
    deletingService: removeAssignment.isPending,
  };
}
