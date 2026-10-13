import type { ClientLedgerStatusResponse, FinancialYearStatus, FinancialYearStatusStatus } from '@cl/api';

import { formatApiDate, parseApiDate } from './companies';
import { financialYearLabel } from './financialYears';

// A client's balance for every financial year since they became one (GET …/ledger-status).
// Each year stands alone: an earlier year's balance is not brought into the next.

export type YearStatus = FinancialYearStatusStatus;

export const YEAR_STATUS_LABELS: Readonly<Record<YearStatus, string>> = {
  // The current year, while something is owing.
  PENDING: 'Pending',
  // A closed year that ended with something owing.
  CARRIED: 'Carried',
  // Nothing owing, or more received than billed.
  SETTLED: 'Settled',
};

const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

/** "8 Years" / "1 Year". */
export const yearCountLabel = (count: number) => `${count} ${count === 1 ? 'Year' : 'Years'}`;

/** "Client Since Apr 2019 · 8 Years" for the section's subtitle. */
export function clientYearsNote(status: Pick<ClientLedgerStatusResponse, 'clientSince' | 'yearCount' | 'years'>): string {
  const since = parseApiDate(status.clientSince);
  const count = status.yearCount ?? status.years?.length ?? 0;
  return [since && `Client Since ${monthYear.format(since)}`, yearCountLabel(count)].filter(Boolean).join(' · ');
}

/** "FY 2026–27". */
export const yearTitle = (year: Pick<FinancialYearStatus, 'financialYear'>) => financialYearLabel(year.financialYear ?? '');

/** Under a year: "Current Year · To Date", or "3 Companies · Closed 31 Mar 2026". */
export function yearNote(year: Pick<FinancialYearStatus, 'current' | 'companyCount' | 'closedOn'>): string {
  if (year.current) return 'Current Year · To Date';
  const companies = year.companyCount ?? 0;
  return [
    `${companies} ${companies === 1 ? 'Company' : 'Companies'}`,
    year.closedOn && `Closed ${formatApiDate(year.closedOn)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
