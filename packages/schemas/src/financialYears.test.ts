import { describe, expect, it } from 'vitest';

import { currentFinancialYear, financialYearLabel, financialYearOf, financialYearOptions } from './financialYears';

describe('Indian financial years', () => {
  it('runs from 1 April to 31 March', () => {
    expect(currentFinancialYear(new Date(2026, 9, 13))).toBe('2026-27');
    expect(currentFinancialYear(new Date(2026, 3, 1))).toBe('2026-27');
    expect(currentFinancialYear(new Date(2026, 2, 31))).toBe('2025-26');
    expect(currentFinancialYear(new Date(2027, 0, 15))).toBe('2026-27');
  });

  it('writes the year as the backend takes it, across a century', () => {
    expect(financialYearOf(2026)).toBe('2026-27');
    expect(financialYearOf(2099)).toBe('2099-00');
    expect(financialYearOf(2008)).toBe('2008-09');
    expect(financialYearLabel('2026-27')).toBe('FY 2026–27');
  });

  it('offers the current year and the four before it, newest first', () => {
    expect(financialYearOptions(new Date(2026, 9, 13))).toEqual([
      { value: '2026-27', label: 'FY 2026–27' },
      { value: '2025-26', label: 'FY 2025–26' },
      { value: '2024-25', label: 'FY 2024–25' },
      { value: '2023-24', label: 'FY 2023–24' },
      { value: '2022-23', label: 'FY 2022–23' },
    ]);
  });
});
