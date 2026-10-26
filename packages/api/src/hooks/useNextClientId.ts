import { useNextClientId as useGeneratedNextClientId } from '../generated/clients/clients';

/**
 * The client id Onboard Client suggests (`GET /clients/next-client-id`, e.g. "PSC-00042"). Not
 * reserved, so it is fetched afresh each time the form opens and never served from cache:
 * `undefined` while loading, or when it cannot be had (the user types one instead).
 */
export function useNextClientId(): string | undefined {
  const query = useGeneratedNextClientId({ query: { staleTime: 0, gcTime: 0, retry: false } });
  return query.data?.clientId;
}
