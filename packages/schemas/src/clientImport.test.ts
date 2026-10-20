import { describe, expect, it } from 'vitest';

import { clientImportSummary, importedClientsTitle } from './clientImport';

describe('Import Clients', () => {
  it('heads the result with the clients and companies created', () => {
    expect(importedClientsTitle(1, 1)).toBe('1 Client And 1 Company Imported');
    expect(importedClientsTitle(2, 3)).toBe('2 Clients And 3 Companies Imported');
  });

  it('lists each client with its Client Ref and company count', () => {
    const summary = clientImportSummary({
      clientCount: 2,
      companyCount: 3,
      clients: [
        { clientRef: 'C1', clientId: 'a', clientName: 'Rohan Mehta', companyCount: 2 },
        { clientRef: 'C2', clientId: 'b', clientName: 'Anita Desai', companyCount: 1 },
      ],
    });
    expect(summary.title).toBe('2 Clients And 3 Companies Imported');
    expect(summary.items).toEqual([
      { key: 'a', name: 'Rohan Mehta', detail: 'C1 · 2 Companies' },
      { key: 'b', name: 'Anita Desai', detail: 'C2 · 1 Company' },
    ]);
  });
});
