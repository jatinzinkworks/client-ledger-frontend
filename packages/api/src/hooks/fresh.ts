// Screens of client data must never show an older cached copy while the latest is fetched:
// a query's data counts only once it has been fetched since the screen opened. The exception is
// a placeholder kept from the same list (the previous page while the next one loads), which the
// query only ever has when the screen asked for one.

/** The parts of a query result that say where its data came from. */
interface Freshness {
  isFetchedAfterMount: boolean;
  isPlaceholderData: boolean;
}

const isFresh = (q: Freshness) => q.isFetchedAfterMount || q.isPlaceholderData;

/** The query's data if fetched since the screen opened, else undefined. */
export const freshData = <T>(q: Freshness & { data: T | undefined }): T | undefined => (isFresh(q) ? q.data : undefined);

/** Still waiting for the first fetch since the screen opened (and it has not failed). */
export const awaitingFresh = (q: Freshness & { error: unknown }, enabled = true): boolean =>
  enabled && !isFresh(q) && !q.error;
