import { keepPreviousData, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getListCompaniesQueryKey } from '../generated/client-companies/client-companies';
import { getListClientsQueryKey } from '../generated/clients/clients';
import { getListServices1QueryKey } from '../generated/client-services/client-services';
import {
  getClientLedgerStatusQueryKey,
  getListClientEntriesQueryKey,
  getListCompanyEntriesQueryKey,
  getSummarizeClientQueryKey,
  getSummarizeCompanyQueryKey,
  useDeleteEntry,
  useListCompanyEntries,
  usePostDueServices,
  useRecordPayment,
  useSummarizeCompany,
  useUpdateEntry,
  useUpdatePayment,
} from '../generated/ledger/ledger';
import { getListManagersQueryKey } from '../generated/manager-catalog/manager-catalog';
import { getListServicesQueryKey } from '../generated/service-catalog/service-catalog';
import type { LedgerEntryUpdateRequest, ListCompanyEntriesParams, PaymentRequest } from '../generated/model';
import { awaitingFresh, freshData } from './fresh';
import { retryUnlessNotFound } from './singletonSetting';

/** Ledger entries shown per page on the company page. */
export const LEDGER_PAGE_SIZE = 20;

/**
 * A change to a company's ledger changes its entries and year summaries, and the client's too
 * (per-company balances and summaries, and the companies list's billed / received / pending).
 * Ids are already encoded.
 */
export const refreshLedgers = (queryClient: QueryClient, clientId: string, companyId: string) =>
  Promise.all(
    [
      getListCompanyEntriesQueryKey(clientId, companyId),
      getSummarizeCompanyQueryKey(clientId, companyId),
      getListClientEntriesQueryKey(clientId),
      getSummarizeClientQueryKey(clientId),
      getClientLedgerStatusQueryKey(clientId),
      getListCompaniesQueryKey(clientId),
      // All-time figures: each client's and manager's pending, each service's billed.
      getListClientsQueryKey(),
      getListManagersQueryKey(),
      getListServicesQueryKey(),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );

/** Whether a cached ledger query (key: [url, params]) was for this financial year. */
const sameFinancialYear = (queryKey: readonly unknown[] | undefined, financialYear: string | undefined) =>
  (queryKey?.[1] as ListCompanyEntriesParams | undefined)?.financialYear === financialYear;

/**
 * One company's ledger for the company page: a page of its entries in one financial year (every
 * year when none is given), earliest due first as the backend returns them; what it still owes;
 * posting the services that are due; recording or updating a payment; and correcting or deleting an entry.
 */
export function useCompanyLedger(clientId: string, companyId: string, financialYear?: string) {
  // orval interpolates path params as-is, so encode the ids here.
  const ids = [encodeURIComponent(clientId), encodeURIComponent(companyId)] as const;
  const queryClient = useQueryClient();
  // The page belongs to the financial year it was chosen in; another year starts at its first page.
  const [paging, setPaging] = useState({ financialYear, page: 0 });
  const page = paging.financialYear === financialYear ? paging.page : 0;
  const setPage = (next: number) => setPaging({ financialYear, page: next });
  const enabled = !!clientId && !!companyId;
  const query = useListCompanyEntries(
    ...ids,
    { page, size: LEDGER_PAGE_SIZE, ...(financialYear && { financialYear }) },
    {
      query: {
        enabled,
        retry: retryUnlessNotFound,
        // Paging within a year keeps the current page on screen while the next one loads; a new
        // financial year shows as loading instead, so the old year's entries never pass for it.
        placeholderData: (previous, previousQuery) =>
          sameFinancialYear(previousQuery?.queryKey, financialYear) ? keepPreviousData(previous) : undefined,
      },
    },
  );
  // What the company owes is across every year — an earlier year's charges are still owed — so
  // it comes from the unfiltered ledger; one entry is enough for its summary.
  const owed = useListCompanyEntries(...ids, { size: 1 }, { query: { enabled, retry: retryUnlessNotFound } });
  // Billed, received, pending, last payment and discount for the year shown.
  const yearSummary = useSummarizeCompany(...ids, { financialYear: financialYear ?? '' }, {
    query: { enabled: enabled && !!financialYear, retry: retryUnlessNotFound },
  });
  // Posting adds entries and moves each billed service on to its next due date.
  const generate = usePostDueServices({
    mutation: {
      onSuccess: () =>
        Promise.all([
          refreshLedgers(queryClient, ...ids),
          queryClient.invalidateQueries({ queryKey: getListServices1QueryKey(...ids) }),
        ]),
    },
  });

  const refreshLedger = () => refreshLedgers(queryClient, ...ids);
  const update = useUpdateEntry({ mutation: { onSuccess: refreshLedger } });
  const pay = useRecordPayment({ mutation: { onSuccess: refreshLedger } });
  const repay = useUpdatePayment({ mutation: { onSuccess: refreshLedger } });
  const remove = useDeleteEntry({
    mutation: {
      onSuccess: () => {
        // Deleting the only entry on the last page would leave an empty page; step back one.
        if (page > 0 && (freshData(query)?.entries?.length ?? 0) <= 1) setPage(page - 1);
        return refreshLedger();
      },
    },
  });

  // Only what was fetched since the page opened (or the previous page of this list while the
  // next loads) — never an older cached copy.
  const list = freshData(query);
  const meta = list?.page;
  return {
    entries: list?.entries ?? [],
    /** The page shown, counting from 0. */
    page,
    setPage,
    pageCount: meta?.totalPages ?? 0,
    totalEntries: meta?.totalElements ?? 0,
    /** The financial year's billed / received / pending / last payment / discount; undefined without a year. */
    yearSummary: freshData(yearSummary),
    yearSummaryLoading: awaitingFresh(yearSummary, enabled && !!financialYear),
    yearSummaryError: yearSummary.error as Error | null,
    /** What the company still owes: charges less payments, in every financial year. Negative when overpaid. */
    balance: freshData(owed)?.summary?.balance,
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    /** Reloads the entries and summary of the year shown, and what the company owes. */
    refetch: () => Promise.all([query.refetch(), owed.refetch(), ...(financialYear ? [yearSummary.refetch()] : [])]),
    /** A reload of anything already on screen is under way. */
    isRefreshing: [query, owed, yearSummary].some((q) => q.isFetching && !q.isPending),
    /** Posts every service due on or before today; resolves to the entries created (none when nothing was due). */
    generate: () => generate.mutateAsync({ clientId: ids[0], companyId: ids[1] }),
    generating: generate.isPending,
    /** Records a payment received; it reduces the balance as a whole. */
    recordPayment: (data: PaymentRequest) => pay.mutateAsync({ clientId: ids[0], companyId: ids[1], data }),
    recordingPayment: pay.isPending,
    /** Replaces every detail of a payment (its ledger entry id); a blank reference or comment clears it. */
    updatePayment: (paymentId: string, data: PaymentRequest) =>
      repay.mutateAsync({ clientId: ids[0], companyId: ids[1], paymentId: encodeURIComponent(paymentId), data }),
    updatingPayment: repay.isPending,
    /** Replaces an entry's fee, discount and GST rate; the backend works its amounts out again. */
    updateEntry: (entryId: string, data: LedgerEntryUpdateRequest) =>
      update.mutateAsync({ clientId: ids[0], companyId: ids[1], entryId: encodeURIComponent(entryId), data }),
    updatingEntry: update.isPending,
    /** Deletes an entry; the service is not billed again for its due date. */
    deleteEntry: (entryId: string) =>
      remove.mutateAsync({ clientId: ids[0], companyId: ids[1], entryId: encodeURIComponent(entryId) }),
    deletingEntry: remove.isPending,
  };
}
