import type { ClientSummaryResponse, ManagerResponse } from '@cl/api';
import { describe, expect, it } from 'vitest';

import {
  MAX_CLIENTS_PER_REASSIGN,
  moveClient,
  reassignBoard,
  reassignChangesLabel,
  reassignMoves,
  toReassignRequests,
} from './reassignClients';

const neha: ManagerResponse = { id: 'm1', firstName: 'Neha', lastName: 'Kulkarni' };
const arjun: ManagerResponse = { id: 'm2', firstName: 'Arjun', lastName: 'Iyer' };
const rajesh: ClientSummaryResponse = { id: 'c1', firstName: 'Rajesh', lastName: 'Mehta', managerId: 'm1', totalPending: 98150 };
const anita: ClientSummaryResponse = { id: 'c2', firstName: 'Anita', lastName: 'Desai', managerId: 'm2', totalPending: 30500 };

describe('Reassign Clients', () => {
  it('moves a client, and moving them back home drops the move', () => {
    const moved = moveClient({}, rajesh, 'm2');
    expect(moved).toEqual({ c1: 'm2' });
    expect(moveClient(moved, rajesh, 'm1')).toEqual({});
  });

  it('builds the board from the draft, with figures and where moved cards came from', () => {
    const [nehaColumn, arjunColumn] = reassignBoard([neha, arjun], [rajesh, anita], { c1: 'm2' });
    expect(nehaColumn!.clients).toEqual([]);
    expect(nehaColumn!.pending).toBe(0);
    expect(arjunColumn!.clients.map((c) => [c.client.id, c.movedFrom])).toEqual([
      ['c2', undefined],
      ['c1', 'Neha Kulkarni'],
    ]);
    expect(arjunColumn!.pending).toBe(128650);
  });

  it('lists only real moves', () => {
    expect(reassignMoves([rajesh, anita], { c1: 'm2', c2: 'm2' })).toEqual([{ clientId: 'c1', managerId: 'm2' }]);
    expect(reassignChangesLabel(0)).toBe('No Changes Yet');
    expect(reassignChangesLabel(1)).toBe('1 Client Moved');
  });

  it('sends one request per receiving manager, split at the backend limit', () => {
    const many = Array.from({ length: MAX_CLIENTS_PER_REASSIGN + 1 }, (_, i) => ({ clientId: `c${i}`, managerId: 'm2' }));
    const requests = toReassignRequests([{ clientId: 'x', managerId: 'm1' }, ...many]);
    expect(requests.map((r) => [r.managerId, r.clientIds.length])).toEqual([
      ['m1', 1],
      ['m2', MAX_CLIENTS_PER_REASSIGN],
      ['m2', 1],
    ]);
  });
});
