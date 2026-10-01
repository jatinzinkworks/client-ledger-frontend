import { describe, expect, it } from 'vitest';

import { normalizeService, toMonthName } from './normalize';

describe('toMonthName', () => {
  it('accepts the spec’s month names and the backend’s month numbers', () => {
    expect(toMonthName('APRIL')).toBe('APRIL');
    expect(toMonthName('april')).toBe('APRIL');
    expect(toMonthName(4)).toBe('APRIL');
    expect(toMonthName(1)).toBe('JANUARY');
    expect(toMonthName(12)).toBe('DECEMBER');
  });

  it('drops values that are not a month', () => {
    expect(toMonthName(0)).toBeUndefined();
    expect(toMonthName(13)).toBeUndefined();
    expect(toMonthName('SPRING')).toBeUndefined();
  });
});

describe('normalizeService', () => {
  it('rewrites a numeric schedule month as its name and leaves the rest alone', () => {
    // Shape of the real backend response for an ANNUAL service.
    const raw = { serviceName: 'TDS return', billingFrequency: 'ANNUAL', invoiceSchedule: { dayOfMonth: 7, month: 4 } };
    expect(normalizeService(raw as never)).toEqual({
      serviceName: 'TDS return',
      billingFrequency: 'ANNUAL',
      invoiceSchedule: { dayOfMonth: 7, month: 'APRIL' },
    });
  });

  it('passes through services without a month', () => {
    const monthly = { serviceName: 'GST return filing', invoiceSchedule: { dayOfMonth: 5 } };
    expect(normalizeService(monthly)).toEqual(monthly);
  });
});
