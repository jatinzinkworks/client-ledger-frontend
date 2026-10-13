import type { Option } from './services';

// The Indian (Income Tax) financial year: 1 April to 31 March, written as the backend takes it,
// "2026-27". The app filters year-based data by one financial year at a time.

/** How many financial years the picker offers: the current one and those before it. */
export const FINANCIAL_YEARS_SHOWN = 5;

/** "2026-27" for the financial year that starts in April of `startYear`. */
export const financialYearOf = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

/** The financial year a date falls in: January to March belong to the year that began the April before. */
export function currentFinancialYear(now = new Date()): string {
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return financialYearOf(startYear);
}

/** "FY 2026–27". */
export const financialYearLabel = (fy: string) => `FY ${fy.replace('-', '–')}`;

/** The current financial year and the ones before it, newest first. */
export function financialYearOptions(now = new Date(), count = FINANCIAL_YEARS_SHOWN): Option[] {
  const start = Number(currentFinancialYear(now).slice(0, 4));
  return Array.from({ length: count }, (_, i) => {
    const fy = financialYearOf(start - i);
    return { value: fy, label: financialYearLabel(fy) };
  });
}
