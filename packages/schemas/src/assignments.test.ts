import { describe, expect, it } from 'vitest';

import {
  assignServiceDefaults,
  assignedCatalogService,
  assignServiceFormSchema,
  catalogServiceOptions,
  chargeBreakdown,
  effectiveDiscount,
  isAssignServiceComplete,
  serviceAssignmentDefaults,
  serviceDiscountHint,
  standardFeeHint,
  toAssignServiceRequest,
  toServiceUpdateRequest,
  todayApiDate,
  upcomingDueDates,
} from './assignments';
import { formatDate } from './services';

const valid = { serviceId: 'svc-1', deliveryDate: '2026-09-27', discountPercent: '', comment: '' };

describe('assignServiceFormSchema', () => {
  it('needs a service and a delivery date', () => {
    const result = assignServiceFormSchema.safeParse({ ...valid, serviceId: '', deliveryDate: '' });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(['Choose A Service.', 'Enter The Date Delivered.']);
  });

  it('keeps the discount between 0 and 100 with 2 decimals', () => {
    expect(assignServiceFormSchema.safeParse({ ...valid, discountPercent: '101' }).success).toBe(false);
    expect(assignServiceFormSchema.safeParse({ ...valid, discountPercent: '5.555' }).success).toBe(false);
    expect(assignServiceFormSchema.parse({ ...valid, discountPercent: '7.5' }).discountPercent).toBe(7.5);
  });

  it('limits the note to 1000 characters', () => {
    expect(assignServiceFormSchema.safeParse({ ...valid, comment: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('toAssignServiceRequest', () => {
  it('omits a blank discount and note', () => {
    expect(toAssignServiceRequest(assignServiceFormSchema.parse(valid))).toEqual({
      serviceId: 'svc-1',
      deliveryDate: '2026-09-27',
    });
  });

  it('sends a zero discount and the trimmed note', () => {
    const values = assignServiceFormSchema.parse({ ...valid, discountPercent: '0', comment: ' Aug 2026 ' });
    expect(toAssignServiceRequest(values)).toEqual({
      serviceId: 'svc-1',
      deliveryDate: '2026-09-27',
      discountPercent: 0,
      comment: 'Aug 2026',
    });
  });
});

describe('defaults', () => {
  it('delivers today, in the local calendar', () => {
    expect(todayApiDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(assignServiceDefaults(new Date(2026, 9, 11)).deliveryDate).toBe('2026-10-11');
  });

  it('is complete once a service and date are set', () => {
    expect(isAssignServiceComplete(assignServiceDefaults())).toBe(false);
    expect(isAssignServiceComplete(valid)).toBe(true);
  });
});

describe('display', () => {
  it('lists catalog services by name', () => {
    expect(
      catalogServiceOptions([
        { id: 'b', serviceName: 'TDS Returns' },
        { serviceName: 'No Id' },
        { id: 'a', serviceName: 'Audit' },
      ]),
    ).toEqual([
      { value: 'a', label: 'Audit' },
      { value: 'b', label: 'TDS Returns' },
    ]);
  });

  it('describes the standard fee', () => {
    expect(standardFeeHint({ standardFee: 3500, billingFrequency: 'MONTHLY', gstRatePercent: 18 })).toBe(
      'Standard Fee ₹3,500 · GST 18% Added On Invoice',
    );
  });

  it("explains a blank discount with the company's", () => {
    expect(serviceDiscountHint({ companyName: 'Mehta Textiles', discountPercent: 5 })).toBe(
      "Leave Blank To Use Mehta Textiles's Discount Of 5%.",
    );
    expect(serviceDiscountHint({ companyName: 'Mehta Textiles' })).toContain('Discount Of 0%');
  });
});

describe('charges', () => {
  it('works out the discount and net charge', () => {
    expect(chargeBreakdown(3500, 5)).toEqual({ fee: 3500, discount: 175, net: 3325 });
    expect(chargeBreakdown(999, 12.5)).toEqual({ fee: 999, discount: 124.88, net: 874.12 });
  });

  it("uses the entered discount, else the company's", () => {
    expect(effectiveDiscount('', 5)).toBe(5);
    expect(effectiveDiscount('', undefined)).toBe(0);
    expect(effectiveDiscount('10', 5)).toBe(10);
    expect(effectiveDiscount('0', 5)).toBe(0);
    expect(effectiveDiscount('150', 5)).toBeUndefined();
  });
});

describe('upcomingDueDates', () => {
  const dates = (...args: Parameters<typeof upcomingDueDates>) => upcomingDueDates(...args).map(formatDate);

  it('lists the next 5 monthly dates from delivery, including the delivery day itself', () => {
    expect(dates({ billingFrequency: 'MONTHLY', invoiceSchedule: { dayOfMonth: 7 } }, '2026-10-07')).toEqual([
      '7 Oct 2026',
      '7 Nov 2026',
      '7 Dec 2026',
      '7 Jan 2027',
      '7 Feb 2027',
    ]);
  });

  it('falls on the last day of a shorter month', () => {
    expect(dates({ billingFrequency: 'MONTHLY', invoiceSchedule: { dayOfMonth: 31 } }, '2027-01-15', 3)).toEqual([
      '31 Jan 2027',
      '28 Feb 2027',
      '31 Mar 2027',
    ]);
  });

  it('follows the month after each quarter', () => {
    const quarterly = { billingFrequency: 'QUARTERLY', invoiceSchedule: { dayOfMonth: 15, monthOfQuarter: 'FIRST_MONTH' } } as const;
    expect(dates(quarterly, '2026-10-16', 3)).toEqual(['15 Jan 2027', '15 Apr 2027', '15 Jul 2027']);
  });

  it('recurs yearly in the invoice month', () => {
    const annual = { billingFrequency: 'ANNUAL', invoiceSchedule: { dayOfMonth: 31, month: 'MARCH' } } as const;
    expect(dates(annual, '2026-10-11', 2)).toEqual(['31 Mar 2027', '31 Mar 2028']);
  });

  it('is due once, on delivery, for a one-off service', () => {
    expect(dates({ billingFrequency: 'ONE_OFF' }, '2026-11-27')).toEqual(['27 Nov 2026']);
  });

  it('is empty without a valid delivery date', () => {
    expect(upcomingDueDates({ billingFrequency: 'MONTHLY', invoiceSchedule: { dayOfMonth: 7 } }, '')).toEqual([]);
  });
});

describe('editing a delivered service', () => {
  const assignment = {
    id: 'a-1',
    serviceId: 'svc-1',
    serviceName: 'GST Return Filing',
    serviceType: 'MONTHLY',
    serviceFee: 3500,
    deliveryDate: '2026-10-15',
    discountPercent: 0,
  } as const;

  it('starts from the stored values, keeping a zero discount', () => {
    expect(serviceAssignmentDefaults(assignment)).toEqual({
      serviceId: 'svc-1',
      deliveryDate: '2026-10-15',
      discountPercent: '0',
      comment: '',
    });
  });

  it('sends only the date, discount and note, omitting blanks', () => {
    const values = assignServiceFormSchema.parse({ ...valid, discountPercent: '', comment: '' });
    expect(toServiceUpdateRequest(values)).toEqual({ deliveryDate: '2026-09-27' });
    const full = assignServiceFormSchema.parse({ ...valid, discountPercent: '5', comment: 'Sep 2026' });
    expect(toServiceUpdateRequest(full)).toEqual({ deliveryDate: '2026-09-27', discountPercent: 5, comment: 'Sep 2026' });
  });

  it('takes the fee and schedule from the catalog, else from the assignment', () => {
    const catalogEntry = { id: 'svc-1', standardFee: 4000, billingFrequency: 'MONTHLY', invoiceSchedule: { dayOfMonth: 7 } } as const;
    expect(assignedCatalogService(assignment, [catalogEntry])).toBe(catalogEntry);
    expect(assignedCatalogService(assignment, [])).toEqual({
      id: 'svc-1',
      serviceName: 'GST Return Filing',
      standardFee: 3500,
      billingFrequency: 'MONTHLY',
    });
  });
});
