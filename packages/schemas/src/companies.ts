import type { CompanyResponse } from '@cl/api';

import { companyTypeLabel } from './clients';
import { formatDate } from './services';

// Display helpers for the company page: its details line and the services assigned to it.

/** "Discount 5%", or "No Discount". */
export const companyDiscountDetail = (rate: number | undefined) =>
  rate ? `Discount ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(rate)}%` : 'No Discount';

/** The line under the company name: address, legal form and discount. */
export const companyDetails = (company: CompanyResponse) =>
  [company.address, companyTypeLabel(company.companyType), companyDiscountDetail(company.discountPercent)].filter(
    (detail): detail is string => !!detail,
  );

/**
 * "15 Oct 2026" for an API date ("2026-10-15"). Parsed as a local calendar date, so it never
 * shifts a day the way `new Date("2026-10-15")` (UTC midnight) can. Empty when missing.
 */
export function formatApiDate(value: string | undefined): string {
  const date = parseApiDate(value);
  return date ? formatDate(date) : '';
}

/** An API date ("2026-10-15") as a local calendar date; undefined when missing or malformed. */
export function parseApiDate(value: string | undefined): Date | undefined {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const [, y, m, d] = match.map(Number);
  return new Date(y, m - 1, d);
}

export const servicesCountLabel = (count: number) => `${count} ${count === 1 ? 'Service' : 'Services'}`;
