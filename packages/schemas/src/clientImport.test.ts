import { describe, expect, it } from 'vitest';

import { clientImportSummary, importedClientsTitle } from './clientImport';

describe('Import Clients', () => {
  it('heads the result with the clients and companies created', () => {
    expect(importedClientsTitle(1, 1)).toBe('1 Client And 1 Company Imported');
    expect(importedClientsTitle(2, 3)).toBe('2 Clients And 3 Companies Imported');
  });

  it('names clients already on file that only had companies added', () => {
    expect(importedClientsTitle(0, 3, 1)).toBe('3 Companies Added To 1 Existing Client');
    expect(importedClientsTitle(2, 5, 1)).toBe('5 Companies Imported For 2 New Clients And 1 Existing Client');
    expect(importedClientsTitle(1, 4, 2)).toBe('4 Companies Imported For 1 New Client And 2 Existing Clients');
  });

  it('lists each client with its client id and company count', () => {
    const summary = clientImportSummary({
      clientCount: 2,
      companyCount: 3,
      clients: [
        { id: 'a', clientId: 'PSC-00001', created: true, clientName: 'Rohan Mehta', companyCount: 2 },
        { id: 'b', clientId: 'PSC-00002', created: true, clientName: 'Anita Desai', companyCount: 1 },
      ],
    });
    expect(summary.title).toBe('2 Clients And 3 Companies Imported');
    expect(summary.items).toEqual([
      { key: 'a', name: 'Rohan Mehta', detail: 'PSC-00001 · 2 Companies' },
      { key: 'b', name: 'Anita Desai', detail: 'PSC-00002 · 1 Company' },
    ]);
  });

  it('marks clients already on file', () => {
    const summary = clientImportSummary({
      clientCount: 1,
      existingClientCount: 1,
      companyCount: 3,
      clients: [
        { id: 'a', clientId: 'PSC-00009', created: true, clientName: 'Rohan Mehta', companyCount: 2 },
        { id: 'b', clientId: 'PSC-00002', created: false, clientName: 'Anita Desai', companyCount: 1 },
      ],
    });
    expect(summary.title).toBe('3 Companies Imported For 1 New Client And 1 Existing Client');
    expect(summary.items[1]).toEqual({ key: 'b', name: 'Anita Desai', detail: 'PSC-00002 · 1 Company · Existing Client' });
  });
});
