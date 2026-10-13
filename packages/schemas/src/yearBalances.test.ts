import { describe, expect, it } from 'vitest';

import { clientYearsNote, yearCountLabel, yearNote, yearTitle } from './yearBalances';

describe('year balances', () => {
  it('describes how long the client has been one', () => {
    expect(clientYearsNote({ clientSince: '2019-04-01', yearCount: 8 })).toBe('Client Since Apr 2019 · 8 Years');
    expect(clientYearsNote({ years: [{}] })).toBe('1 Year');
    expect(yearCountLabel(2)).toBe('2 Years');
  });

  it('titles and notes each year', () => {
    expect(yearTitle({ financialYear: '2026-27' })).toBe('FY 2026–27');
    expect(yearNote({ current: true, companyCount: 3 })).toBe('Current Year · To Date');
    expect(yearNote({ current: false, companyCount: 3, closedOn: '2026-03-31' })).toBe('3 Companies · Closed 31 Mar 2026');
    expect(yearNote({ current: false, companyCount: 1 })).toBe('1 Company');
  });
});
