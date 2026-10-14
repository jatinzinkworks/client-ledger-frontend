import { useIsFetching, useQuery, useQueryClient, type Query, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';

import {
  getTopBilledClientsQueryOptions,
  getTopBilledCompaniesQueryOptions,
  getTopBilledManagersQueryOptions,
  getTopPendingClientsQueryOptions,
  getTopPendingCompaniesQueryOptions,
  getTopPendingManagersQueryOptions,
  useAgeing,
  useBilledByCategory,
  useMonthlyTrend,
  useOverview,
  useRecentPayments,
} from '../generated/overview/overview';
import type {
  BilledByCategoryResponse,
  BilledClient,
  BilledCompany,
  BilledManager,
  PendingClient,
  PendingCompany,
  PendingManager,
  MonthlyTrendResponse,
  RecentPaymentsResponse,
} from '../generated/model';
import { awaitingFresh, freshData } from './fresh';

// The Overview screen: the firm's figures for a financial year, who owes and who was billed
// most, and the latest payments received. Each is fresh-only, like the client screens.

/** How many clients / companies / managers a ranking lists. */
export const RANKING_LIMIT = 10;
/** How many of the latest payments the Overview lists. */
export const RECENT_PAYMENTS_LIMIT = 20;
/** How many of its most billed services each category lists. */
export const CATEGORY_TOP_SERVICES = 3;

/** Every Overview query's key starts with this path. */
const OVERVIEW_PATH = '/psc/cl/v1/overview';

/** Whether a cached query belongs to the Overview (its figures, rankings or payments). */
export const isOverviewQuery = (query: Pick<Query, 'queryKey'>) => {
  const path = query.queryKey[0];
  return typeof path === 'string' && path.startsWith(OVERVIEW_PATH);
};

/** Marks every Overview query stale, refetching those on screen; used after any ledger change. */
export const refreshOverview = (queryClient: QueryClient) => queryClient.invalidateQueries({ predicate: isOverviewQuery });

/** The firm's billed / received / pending / discount for one financial year, and its counts. */
export function useFirmOverview(financialYear: string) {
  const enabled = !!financialYear;
  const query = useOverview({ financialYear }, { query: { enabled } });
  return {
    // Only what was fetched since the page opened — never an older cached copy.
    overview: freshData(query),
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

/** What a ranking orders by: what is still owed, or what was billed. */
export type RankMeasure = 'pending' | 'billed';
/** Who a ranking lists. */
export type RankSubject = 'clients' | 'companies' | 'managers';

/** One place in a ranking, the same shape whoever it lists. */
export interface RankEntry {
  /** The client's, company's or manager's id. */
  id: string;
  rank: number;
  name: string;
  /** Clients and companies: the client (a company's owner). */
  clientId?: string | undefined;
  /** Companies: the company, and the client it belongs to. */
  companyId?: string | undefined;
  clientName?: string | undefined;
  /** Clients: who looks after them. */
  managerName?: string | undefined;
  /** Managers: how many clients they have now. */
  clientCount?: number | undefined;
  billed: number;
  received: number;
  pending: number;
}

type Ranked = Pick<PendingClient, 'rank' | 'totalBilled' | 'totalPaymentReceived' | 'pending'>;
const figures = (r: Ranked) => ({
  rank: r.rank ?? 0,
  billed: r.totalBilled ?? 0,
  received: r.totalPaymentReceived ?? 0,
  pending: r.pending ?? 0,
});

// The pending and billed rankings of a subject share one shape, so they share one mapping.
const clientEntry = (c: PendingClient | BilledClient): RankEntry => ({
  ...figures(c),
  id: c.clientId ?? '',
  name: c.clientName ?? '',
  clientId: c.clientId,
  managerName: c.managerName,
});
const companyEntry = (c: PendingCompany | BilledCompany): RankEntry => ({
  ...figures(c),
  id: c.companyId ?? '',
  name: c.companyName ?? '',
  clientId: c.clientId,
  companyId: c.companyId,
  clientName: c.clientName,
});
const managerEntry = (m: PendingManager | BilledManager): RankEntry => ({
  ...figures(m),
  id: m.managerId ?? '',
  name: m.managerName ?? '',
  clientCount: m.clientCount,
});

type RankingParams = { financialYear?: string; limit: number };
// Each ranking's query, already mapped to RankEntry rows. The response type differs per
// endpoint; only the mapped rows leave this module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RankingQuery = (params: RankingParams) => UseQueryOptions<any, unknown, RankEntry[]>;

const RANKINGS: Readonly<Record<RankMeasure, Readonly<Record<RankSubject, RankingQuery>>>> = {
  pending: {
    clients: (p) => getTopPendingClientsQueryOptions(p, { query: { select: (r) => (r.clients ?? []).map(clientEntry) } }),
    companies: (p) =>
      getTopPendingCompaniesQueryOptions(p, { query: { select: (r) => (r.companies ?? []).map(companyEntry) } }),
    managers: (p) =>
      getTopPendingManagersQueryOptions(p, { query: { select: (r) => (r.managers ?? []).map(managerEntry) } }),
  },
  billed: {
    clients: (p) => getTopBilledClientsQueryOptions(p, { query: { select: (r) => (r.clients ?? []).map(clientEntry) } }),
    companies: (p) =>
      getTopBilledCompaniesQueryOptions(p, { query: { select: (r) => (r.companies ?? []).map(companyEntry) } }),
    managers: (p) =>
      getTopBilledManagersQueryOptions(p, { query: { select: (r) => (r.managers ?? []).map(managerEntry) } }),
  },
};

/**
 * The clients, companies or managers who owe (pending) or were billed (billed) most, at most
 * RANKING_LIMIT of them: in one financial year, or every year to date when none is given.
 */
export function useOverviewRanking(measure: RankMeasure, subject: RankSubject, financialYear?: string) {
  const params: RankingParams = financialYear ? { financialYear, limit: RANKING_LIMIT } : { limit: RANKING_LIMIT };
  const query = useQuery(RANKINGS[measure][subject](params));
  return {
    entries: freshData(query),
    isLoading: awaitingFresh(query),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

const paymentsOf = (r: RecentPaymentsResponse) => r.payments ?? [];

/** The latest payments received from any company, most recent first. */
export function useLatestPayments() {
  const query = useRecentPayments({ limit: RECENT_PAYMENTS_LIMIT }, { query: { select: paymentsOf } });
  return {
    payments: freshData(query),
    isLoading: awaitingFresh(query),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

const monthsOf = (r: MonthlyTrendResponse) => r.months ?? [];

/** What was billed and received in each month of a financial year, April first. */
export function useOverviewMonthly(financialYear: string) {
  const enabled = !!financialYear;
  const query = useMonthlyTrend({ financialYear }, { query: { enabled, select: monthsOf } });
  return {
    months: freshData(query),
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

const categoriesOf = (r: BilledByCategoryResponse) => r.categories ?? [];

/** The year's billing per practice area, billed most first, each with its top services. */
export function useBillingByCategory(financialYear: string) {
  const enabled = !!financialYear;
  const query = useBilledByCategory(
    { financialYear, topServices: CATEGORY_TOP_SERVICES },
    { query: { enabled, select: categoriesOf } },
  );
  return {
    categories: freshData(query),
    isLoading: awaitingFresh(query, enabled),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

/** How long what the firm is owed has been due, as of today: 0-30, 31-60, 61-90 and 90+ days. */
export function useReceivablesAgeing() {
  const query = useAgeing();
  return {
    ageing: freshData(query),
    isLoading: awaitingFresh(query),
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  };
}

/** The Overview's Refresh: fetches every widget again; `refreshing` while any is fetching. */
export function useRefreshOverview() {
  const queryClient = useQueryClient();
  const fetching = useIsFetching({ predicate: isOverviewQuery });
  return { refresh: () => refreshOverview(queryClient), refreshing: fetching > 0 };
}
