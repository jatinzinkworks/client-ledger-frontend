import { describe, expect, it } from 'vitest';

import {
  dayLabel,
  filterServices,
  formatGst,
  formatInr,
  gstRateOptions,
  nextInvoiceDate,
  scheduleSummary,
  serviceFieldFromApi,
  serviceFormDefaults,
  serviceFormSchema,
  toServiceRequest,
  usageLabel,
  type ServiceFormInput,
} from './services';

const monthly: ServiceFormInput = {
  serviceName: 'GST return filing',
  description: 'GSTR-1 and GSTR-3B for the month',
  category: 'COMPLIANCE',
  billingFrequency: 'MONTHLY',
  standardFee: '3500',
  gstRatePercent: '18',
  dayOfMonth: '11',
  monthOfQuarter: '',
  month: '',
};

function issuesFor(input: ServiceFormInput) {
  const result = serviceFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('serviceFormSchema', () => {
  it('accepts a complete monthly service', () => {
    expect(issuesFor(monthly)).toEqual({});
  });

  it('requires a name and a fee, and rejects negative or over-precise fees', () => {
    expect(issuesFor({ ...monthly, serviceName: '  ', standardFee: '' })).toEqual({
      serviceName: 'Enter The Service Name.',
      standardFee: 'Enter The Standard Fee.',
    });
    expect(issuesFor({ ...monthly, standardFee: '-1' })).toEqual({ standardFee: 'Fee Cannot Be Negative.' });
    expect(issuesFor({ ...monthly, standardFee: '10.555' })).toEqual({ standardFee: 'Use At Most 2 Decimal Places.' });
    expect(issuesFor({ ...monthly, standardFee: '0' })).toEqual({});
  });

  it('asks for the schedule each billing frequency needs', () => {
    expect(issuesFor({ ...monthly, dayOfMonth: '' })).toEqual({ dayOfMonth: 'Choose The Invoice Day.' });
    expect(issuesFor({ ...monthly, billingFrequency: 'QUARTERLY' })).toEqual({ monthOfQuarter: 'Choose The Invoice Month.' });
    expect(issuesFor({ ...monthly, billingFrequency: 'ANNUAL' })).toEqual({ month: 'Choose The Invoice Month.' });
    expect(issuesFor({ ...monthly, billingFrequency: 'ONE_OFF', dayOfMonth: '' })).toEqual({});
  });
});

describe('toServiceRequest', () => {
  const parse = (input: Partial<ServiceFormInput>) => toServiceRequest(serviceFormSchema.parse({ ...monthly, ...input }));

  it('sends only the schedule fields the billing frequency uses', () => {
    expect(parse({ billingFrequency: 'QUARTERLY', monthOfQuarter: 'FIRST_MONTH', month: 'APRIL' }).invoiceSchedule).toEqual({
      dayOfMonth: 11,
      monthOfQuarter: 'FIRST_MONTH',
    });
    expect(parse({ billingFrequency: 'ANNUAL', month: 'JULY', monthOfQuarter: 'FIRST_MONTH' }).invoiceSchedule).toEqual({
      dayOfMonth: 11,
      month: 'JULY',
    });
  });

  it('omits the schedule for one-off billing and a blank description', () => {
    const request = parse({ billingFrequency: 'ONE_OFF', description: '' });
    expect(request).not.toHaveProperty('invoiceSchedule');
    expect(request).not.toHaveProperty('description');
    expect(request).toMatchObject({ standardFee: 3500, gstRatePercent: 18 });
  });
});

describe('serviceFormDefaults', () => {
  it('starts a new service in the given category, billed monthly on the 1st at 18% GST', () => {
    expect(serviceFormDefaults(undefined, 'TAX')).toMatchObject({
      category: 'TAX',
      billingFrequency: 'MONTHLY',
      gstRatePercent: '18',
      dayOfMonth: '1',
      standardFee: '',
    });
  });

  it('loads a stored service into text fields', () => {
    expect(
      serviceFormDefaults({
        serviceName: 'Tax audit',
        category: 'AUDIT',
        billingFrequency: 'ANNUAL',
        standardFee: 35000,
        gstRatePercent: 18,
        invoiceSchedule: { dayOfMonth: 15, month: 'SEPTEMBER' },
      }),
    ).toMatchObject({ standardFee: '35000', dayOfMonth: '15', month: 'SEPTEMBER', monthOfQuarter: '' });
  });
});

describe('display helpers', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatInr(3500)).toBe('₹3,500');
    expect(formatInr(165000)).toBe('₹1,65,000');
    expect(formatInr(99.5)).toBe('₹99.5');
    expect(formatGst(18)).toBe('+ GST 18%');
  });

  it('labels days, usage and GST options', () => {
    expect(dayLabel(1)).toBe('1st');
    expect(dayLabel(22)).toBe('22nd');
    expect(dayLabel(13)).toBe('13th');
    expect(dayLabel(31)).toBe('Last Day');
    expect(usageLabel(0)).toBe('Not Used Yet');
    expect(usageLabel(1)).toBe('1 Company');
    expect(usageLabel(5)).toBe('5 Companies');
    expect(gstRateOptions(7.5).map((o) => o.label)).toEqual(['0%', '5%', '7.5%', '12%', '18%', '28%']);
  });

  it('summarises each schedule as in the mocks', () => {
    expect(scheduleSummary('MONTHLY', { dayOfMonth: 11 })).toBe('Invoiced 11th Of Each Month');
    expect(scheduleSummary('MONTHLY', { dayOfMonth: 31 })).toBe('Invoiced Last Day Of Each Month');
    expect(scheduleSummary('QUARTERLY', { dayOfMonth: 15, monthOfQuarter: 'FIRST_MONTH' })).toBe(
      'Invoiced 15th, Month After Each Quarter',
    );
    expect(scheduleSummary('ANNUAL', { dayOfMonth: 15, month: 'OCTOBER' })).toBe('Invoiced 15th Oct Each Year');
    expect(scheduleSummary('ONE_OFF', undefined)).toBe('Billed Once');
  });

  it('maps nested backend field paths onto form fields', () => {
    expect(serviceFieldFromApi('invoiceSchedule.dayOfMonth')).toBe('dayOfMonth');
    expect(serviceFieldFromApi('serviceName')).toBe('serviceName');
    expect(serviceFieldFromApi('somethingElse')).toBeUndefined();
  });
});

describe('nextInvoiceDate', () => {
  const on = (y: number, m: number, d: number) => new Date(y, m - 1, d);
  const next = (...args: Parameters<typeof nextInvoiceDate>) => nextInvoiceDate(...args)?.toDateString();

  it('finds the next annual invoice, rolling into next year once this year has passed', () => {
    expect(next('ANNUAL', { dayOfMonth: 15, month: 'JULY' }, on(2026, 10, 1))).toBe(on(2027, 7, 15).toDateString());
    expect(next('ANNUAL', { dayOfMonth: 15, month: 'OCTOBER' }, on(2026, 10, 1))).toBe(on(2026, 10, 15).toDateString());
  });

  it('counts today as due, and falls back to the last day of shorter months', () => {
    expect(next('MONTHLY', { dayOfMonth: 1 }, on(2026, 10, 1))).toBe(on(2026, 10, 1).toDateString());
    expect(next('MONTHLY', { dayOfMonth: 31 }, on(2026, 11, 5))).toBe(on(2026, 11, 30).toDateString());
    expect(next('MONTHLY', { dayOfMonth: 30 }, on(2027, 2, 1))).toBe(on(2027, 2, 28).toDateString());
  });

  it('places quarterly invoices in the chosen month after each quarter closes', () => {
    // Quarters close Mar/Jun/Sep/Dec: FIRST_MONTH → Jan/Apr/Jul/Oct, THIRD_MONTH → Mar/Jun/Sep/Dec.
    expect(next('QUARTERLY', { dayOfMonth: 15, monthOfQuarter: 'FIRST_MONTH' }, on(2026, 10, 20))).toBe(
      on(2027, 1, 15).toDateString(),
    );
    expect(next('QUARTERLY', { dayOfMonth: 15, monthOfQuarter: 'THIRD_MONTH' }, on(2026, 10, 20))).toBe(
      on(2026, 12, 15).toDateString(),
    );
  });

  it('has no next invoice for one-off billing', () => {
    expect(nextInvoiceDate('ONE_OFF', undefined)).toBeUndefined();
  });
});

describe('filterServices', () => {
  const services = [
    { serviceName: 'GST return filing', category: 'COMPLIANCE' as const },
    { serviceName: 'Tax audit', category: 'AUDIT' as const },
    { serviceName: 'Income tax return', category: 'TAX' as const },
  ];

  it('filters by category and by name, ignoring case', () => {
    expect(filterServices(services, '', 'ALL')).toHaveLength(3);
    expect(filterServices(services, '', 'AUDIT').map((s) => s.serviceName)).toEqual(['Tax audit']);
    expect(filterServices(services, 'TAX', 'ALL').map((s) => s.serviceName)).toEqual(['Tax audit', 'Income tax return']);
    expect(filterServices(services, 'tax', 'TAX').map((s) => s.serviceName)).toEqual(['Income tax return']);
  });
});
