import { describe, expect, it } from 'vitest';

import {
  adjustPricesDefaults,
  adjustPricesFormSchema,
  adjustedFee,
  applyPriceChangeLabel,
  priceChangeBlocker,
  priceChangeLabel,
  priceChangePreview,
  toServiceFeeBulkUpdateRequest,
} from './priceAdjustments';

const services = [
  { id: 'a', serviceName: 'TDS return', category: 'COMPLIANCE' as const, standardFee: 4000 },
  { id: 'b', serviceName: 'GST return filing', category: 'COMPLIANCE' as const, standardFee: 3500 },
  { id: 'c', serviceName: 'Tax audit', category: 'AUDIT' as const, standardFee: 35000 },
];

describe('adjustedFee', () => {
  it('applies the change and rounds to the chosen amount, as in the mock', () => {
    expect(adjustedFee(3500, 10, '100')).toBe(3900);
    expect(adjustedFee(12000, 10, '100')).toBe(13200);
    expect(adjustedFee(3500, -5, '10')).toBe(3330);
    expect(adjustedFee(3500, 10, '1000')).toBe(4000);
  });

  it('keeps paise without rounding', () => {
    expect(adjustedFee(999, 10, 'NONE')).toBe(1098.9);
  });

  it('never rounds a fee away to nothing', () => {
    expect(adjustedFee(40, -50, '100')).toBe(100);
    expect(adjustedFee(0, 10, '100')).toBe(0);
  });
});

describe('priceChangePreview', () => {
  it('lists the services in scope by name with current and new fees', () => {
    expect(priceChangePreview(services, 'COMPLIANCE', 10, '100')).toEqual([
      { id: 'b', name: 'GST return filing', current: 3500, next: 3900 },
      { id: 'a', name: 'TDS return', current: 4000, next: 4400 },
    ]);
    expect(priceChangePreview(services, 'ALL', undefined, 'NONE').map((r) => r.next)).toEqual([undefined, undefined, undefined]);
  });
});

describe('adjust prices form', () => {
  const parse = (changePercent: string) => adjustPricesFormSchema.safeParse({ ...adjustPricesDefaults(), changePercent });

  it('starts at +10%, nearest 100, for the given category', () => {
    expect(adjustPricesFormSchema.parse(adjustPricesDefaults('TAX'))).toEqual({ changePercent: 10, rounding: '100', scope: 'TAX' });
  });

  it('needs a change between -99% and 500%, other than 0', () => {
    expect(parse('-15').success).toBe(true);
    expect(parse('').success).toBe(false);
    expect(parse('0').success).toBe(false);
    expect(parse('-100').success).toBe(false);
    expect(parse('501').success).toBe(false);
    expect(parse('1.234').success).toBe(false);
  });

  it('labels the change and the Apply button', () => {
    expect(priceChangeLabel(10)).toBe('+10%');
    expect(priceChangeLabel(-7.5)).toBe('−7.5%');
    expect(applyPriceChangeLabel(10, 10)).toBe('Apply +10% To 10');
    expect(applyPriceChangeLabel(undefined, 10)).toBe('Apply');
  });
});

describe('bulk fee request', () => {
  const rows = [
    { id: 'a', name: 'A', current: 3500, next: 3900 },
    { id: 'b', name: 'B', current: 100, next: 100 },
  ];

  it('names only the services whose fee changes', () => {
    expect(toServiceFeeBulkUpdateRequest(rows)).toEqual({ updates: [{ serviceId: 'a', standardFee: 3900 }] });
  });

  it('says why a change cannot be applied', () => {
    expect(priceChangeBlocker(rows)).toBeUndefined();
    expect(priceChangeBlocker([])).toBe('No Services In This Category.');
    expect(priceChangeBlocker([rows[1]!])).toBe('No Fee Changes At This Rounding.');
  });
});
