import { describe, expect, it } from 'vitest';

import { fileNameFrom } from './fetcher';

describe('fileNameFrom', () => {
  it('reads the quoted file name of an attachment', () => {
    expect(fileNameFrom('attachment; filename="Rohan_Mehta_Ledger_FY2026-27.xlsx"')).toBe('Rohan_Mehta_Ledger_FY2026-27.xlsx');
  });

  it('reads an unquoted file name', () => {
    expect(fileNameFrom('attachment; filename=ledger.xlsx')).toBe('ledger.xlsx');
  });

  it('prefers the encoded UTF-8 form', () => {
    expect(fileNameFrom(`attachment; filename="a.xlsx"; filename*=UTF-8''Zo%C3%AB_Ledger.xlsx`)).toBe('Zoë_Ledger.xlsx');
  });

  it('is undefined without a header or a name', () => {
    expect(fileNameFrom(null)).toBeUndefined();
    expect(fileNameFrom('attachment')).toBeUndefined();
  });
});
