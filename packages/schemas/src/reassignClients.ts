import type { ClientManagerBulkUpdateRequest, ClientSummaryResponse, ManagerResponse } from '@cl/api';
import { updateManager1BodyClientIdsMax as CLIENTS_PER_REQUEST_MAX } from '@cl/api/zod';

import { clientName } from './clients';
import { managerName } from './managers';
import { formatInr } from './services';

// Reassign Clients (Managers screen): clients are moved between managers on a board, held as a
// draft until saved, then saved with one PUT /clients/manager per receiving manager. Shared so
// web (drag and drop) and mobile (tap, then pick a manager) move and save clients the same way.

/** Where each moved client now goes, by client id. Only clients the user moved are in it. */
export type ReassignDraft = Readonly<Record<string, string>>;

/** The most clients one bulk request may name (the backend's limit). */
export const MAX_CLIENTS_PER_REASSIGN = CLIENTS_PER_REQUEST_MAX;

/** The manager a client is under on the board: where they were moved to, else their current one. */
export const boardManagerId = (client: ClientSummaryResponse, draft: ReassignDraft) =>
  draft[client.id ?? ''] ?? client.managerId;

/** The draft after moving a client to a manager; moving them back home drops the move. */
export function moveClient(draft: ReassignDraft, client: ClientSummaryResponse, managerId: string): ReassignDraft {
  const { [client.id ?? '']: _previous, ...rest } = draft;
  return managerId === client.managerId ? rest : { ...rest, [client.id ?? '']: managerId };
}

export interface BoardClient {
  client: ClientSummaryResponse;
  /** Name of the manager the client is being moved away from; absent when not moved. */
  movedFrom?: string;
}

export interface BoardColumn {
  manager: ManagerResponse;
  clients: BoardClient[];
  /** What this column's clients owe, across all years. */
  pending: number;
}

/** One column per manager (in the order given) holding the clients under them on the board. */
export function reassignBoard(
  managers: readonly ManagerResponse[],
  clients: readonly ClientSummaryResponse[],
  draft: ReassignDraft,
): BoardColumn[] {
  const names = new Map(managers.map((m) => [m.id, managerName(m)]));
  return managers.map((manager) => {
    const mine = clients.filter((c) => boardManagerId(c, draft) === manager.id);
    return {
      manager,
      clients: mine.map((client) => ({
        client,
        movedFrom: client.managerId !== manager.id ? (names.get(client.managerId) ?? 'Another Manager') : undefined,
      })),
      pending: mine.reduce((sum, c) => sum + (c.totalPending ?? 0), 0),
    };
  });
}

/** The clients whose manager the draft changes, each with the manager they go to. */
export const reassignMoves = (clients: readonly ClientSummaryResponse[], draft: ReassignDraft) =>
  clients
    .filter((c) => c.id && draft[c.id] && draft[c.id] !== c.managerId)
    .map((c) => ({ clientId: c.id!, managerId: draft[c.id!]! }));

/** The bulk requests to save the moves: one per receiving manager, split at the backend's limit. */
export function toReassignRequests(moves: readonly { clientId: string; managerId: string }[]): ClientManagerBulkUpdateRequest[] {
  const byManager = new Map<string, string[]>();
  for (const { clientId, managerId } of moves) byManager.set(managerId, [...(byManager.get(managerId) ?? []), clientId]);
  return [...byManager].flatMap(([managerId, clientIds]) =>
    Array.from({ length: Math.ceil(clientIds.length / MAX_CLIENTS_PER_REASSIGN) }, (_, i) => ({
      managerId,
      clientIds: clientIds.slice(i * MAX_CLIENTS_PER_REASSIGN, (i + 1) * MAX_CLIENTS_PER_REASSIGN),
    })),
  );
}

// ── Copy ────────────────────────────────────────────────────────────────────────────────

export const REASSIGN_CLIENTS_LABEL = 'Reassign Clients';
export const REASSIGN_HINT_DRAG = "Drag A Client Card Onto Another Manager. Changes Aren't Applied Until You Save.";
export const REASSIGN_HINT_TAP = "Tap A Client To Move Them To Another Manager. Changes Aren't Applied Until You Save.";
export const DROP_CLIENT_HERE = 'Drop A Client Here';
export const NO_CLIENTS_ON_BOARD = 'No Clients';
export const SAVE_REASSIGN_LABEL = 'Save Changes';

/** "No Changes Yet", "1 Client Moved", "3 Clients Moved". */
export const reassignChangesLabel = (moves: number) =>
  moves === 0 ? 'No Changes Yet' : `${moves} ${moves === 1 ? 'Client' : 'Clients'} Moved`;

/** The column's figures: "2 Clients", "₹1,97,750 Pending". */
export const boardColumnFigures = (column: BoardColumn) => ({
  clients: `${column.clients.length} ${column.clients.length === 1 ? 'Client' : 'Clients'}`,
  pending: `${formatInr(column.pending)} Pending`,
});

/** "From Arjun Iyer", on a card moved away from that manager. */
export const movedFromLabel = (managerName: string) => `From ${managerName}`;

/** "Move Rajesh Mehta To", the title of the manager picker for a client. */
export const moveClientTitle = (client: ClientSummaryResponse) => `Move ${clientName(client)} To`;

/** After saving: "3 Clients Reassigned." */
export const reassignSavedMessage = (clients: number) =>
  `${clients} ${clients === 1 ? 'Client' : 'Clients'} Reassigned.`;

/** When some requests failed: what was not saved, kept on the board to try again. */
export const reassignFailedMessage = (failedClients: number, savedClients: number) =>
  `${failedClients} ${failedClients === 1 ? 'Move' : 'Moves'} Could Not Be Saved${
    savedClients ? ` (${savedClients} Saved)` : ''
  }. They Are Still On The Board — Try Again.`;
