import type { CompanyResponse, ServiceAssignmentResponse } from '@cl/api';

import { companyTypeLabel } from './clients';
import { BILLING_LABELS, formatDate } from './services';

// Display helpers for the company page: its details line and the services assigned to it.

/** "Discount 5%", or "No Discount". */
export const companyDiscountDetail = (rate: number | undefined) =>
  rate ? `Discount ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(rate)}%` : 'No Discount';

/** The line under the company name: legal form and discount. */
export const companyDetails = (company: CompanyResponse) =>
  [companyTypeLabel(company.companyType), companyDiscountDetail(company.discountPercent)].filter(Boolean);

/**
 * "15 Oct 2026" for an API date ("2026-10-15"). Parsed as a local calendar date, so it never
 * shifts a day the way `new Date("2026-10-15")` (UTC midnight) can. Empty when missing.
 */
export function formatApiDate(value: string | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const [, y, m, d] = match.map(Number);
  return formatDate(new Date(y, m - 1, d));
}

/** "Monthly · Due 7 Nov 2026" under an assigned service's name. */
export const assignmentSummary = (a: Pick<ServiceAssignmentResponse, 'serviceType' | 'nextDueDate'>) =>
  [a.serviceType && BILLING_LABELS[a.serviceType], a.nextDueDate && `Due ${formatApiDate(a.nextDueDate)}`]
    .filter(Boolean)
    .join(' · ');

export const servicesCountLabel = (count: number) => `${count} ${count === 1 ? 'Service' : 'Services'}`;
