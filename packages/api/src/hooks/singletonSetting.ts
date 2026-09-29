import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { isNotFound } from '../errors';

/** Retry transient failures, but never a 404 — for a singleton setting that means "not saved yet". */
export const retryUnlessNotFound = (count: number, error: unknown) => !isNotFound(error) && count < 2;

/**
 * The screen-facing shape of a singleton Global Settings resource (payment terms, firm
 * details, …): GET returns 404 until the first save, POST creates or replaces it wholesale.
 */
export function singletonSetting<TData, TRequest>(
  query: UseQueryResult<TData, unknown>,
  mutation: UseMutationResult<TData, unknown, { data: TRequest }, unknown>,
) {
  const notConfigured = isNotFound(query.error);
  return {
    stored: query.data,
    /** True until the first response (or 404) arrives. */
    isLoading: query.isPending && !notConfigured,
    /** Load failures other than "not configured yet". */
    loadError: notConfigured ? null : (query.error as Error | null),
    notConfigured,
    refetch: query.refetch,
    save: (data: TRequest) => mutation.mutateAsync({ data }),
    saving: mutation.isPending,
    saveError: mutation.error as Error | null,
    saved: mutation.isSuccess,
  };
}
