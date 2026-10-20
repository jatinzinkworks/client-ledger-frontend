import { useMutation, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from '../errors';
import { updateManager1 } from '../generated/clients/clients';
import type { ClientManagerBulkUpdateRequest } from '../generated/model';
import { refreshOverview } from './useOverview';

export interface ReassignOutcome {
  /** Clients whose new manager was saved. */
  savedClientIds: string[];
  /** Requests the backend refused (each is all or nothing), with why. */
  failures: { request: ClientManagerBulkUpdateRequest; message: string }[];
}

const startsWithAny = (key: unknown, prefixes: readonly string[]) =>
  typeof key === 'string' && prefixes.some((p) => key.startsWith(p));

/**
 * Saves Reassign Clients: one PUT /clients/manager per receiving manager (from
 * `toReassignRequests`), sent together. Each request stands alone, so one failing does not undo
 * the others; the outcome says which clients were saved and which requests failed. Afterwards
 * every client and manager query refreshes (lists, details, a manager's clients) along with the
 * Overview, whose manager rankings follow the assignment — and the save resolves only once they
 * have, so the board never shows a saved client back under its old manager.
 */
export function useReassignClients() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (requests: ClientManagerBulkUpdateRequest[]): Promise<ReassignOutcome> => {
      const settled = await Promise.allSettled(requests.map((request) => updateManager1(request)));
      const outcome: ReassignOutcome = { savedClientIds: [], failures: [] };
      settled.forEach((result, i) => {
        const request = requests[i]!;
        if (result.status === 'fulfilled') outcome.savedClientIds.push(...request.clientIds);
        else outcome.failures.push({ request, message: errorMessage(result.reason) });
      });
      if (outcome.savedClientIds.length) {
        await Promise.all([
          queryClient.invalidateQueries({
            predicate: (q) => startsWithAny(q.queryKey[0], ['/psc/cl/v1/clients', '/psc/cl/v1/managers']),
          }),
          refreshOverview(queryClient),
        ]);
      }
      return outcome;
    },
  });

  return { save: mutation.mutateAsync, saving: mutation.isPending };
}
