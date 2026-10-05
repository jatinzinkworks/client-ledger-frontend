import { describe, expect, it } from 'vitest';

import { assignmentSummary, companyDetails, companyDiscountDetail, formatApiDate, servicesCountLabel } from './companies';

describe('company page helpers', () => {
  it('describes the company under its name', () => {
    expect(companyDetails({ companyType: 'PRIVATE_LIMITED', discountPercent: 5 })).toEqual(['Private Limited', 'Discount 5%']);
    expect(companyDiscountDetail(undefined)).toBe('No Discount');
    expect(companyDiscountDetail(0)).toBe('No Discount');
  });

  it('formats API dates as calendar dates, without a time-zone shift', () => {
    expect(formatApiDate('2026-10-01')).toBe('1 Oct 2026');
    expect(formatApiDate('2026-12-31')).toBe('31 Dec 2026');
    expect(formatApiDate(undefined)).toBe('');
    expect(formatApiDate('not a date')).toBe('');
  });

  it('summarises an assigned service', () => {
    expect(assignmentSummary({ serviceType: 'MONTHLY', nextDueDate: '2026-11-07' })).toBe('Monthly · Due 7 Nov 2026');
    expect(assignmentSummary({ serviceType: 'ONE_OFF' })).toBe('One-Off');
  });

  it('counts services', () => {
    expect(servicesCountLabel(1)).toBe('1 Service');
    expect(servicesCountLabel(3)).toBe('3 Services');
  });
});
