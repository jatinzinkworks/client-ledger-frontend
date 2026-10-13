import { describe, expect, it } from 'vitest';

import { todayApiDate } from './assignments';
import {
  PAYMENT_METHOD_OPTIONS,
  isRecordPaymentComplete,
  paymentFieldFromApi,
  paymentFormDefaults,
  paymentMethodLabel,
  recordPaymentDefaults,
  recordPaymentFormSchema,
  toPaymentRequest,
  type RecordPaymentFormInput,
} from './payments';

const valid: RecordPaymentFormInput = {
  companyId: 'co-1',
  amountReceived: '52650',
  dateReceived: '2026-09-27',
  method: 'BANK_TRANSFER',
  reference: ' UTR123 ',
  comment: '',
};

const issues = (input: Partial<RecordPaymentFormInput>) => {
  const result = recordPaymentFormSchema.safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('recordPaymentFormSchema', () => {
  it('accepts a complete payment', () => {
    expect(issues({})).toEqual([]);
  });

  it('needs a company', () => {
    expect(issues({ companyId: '' })).toEqual(['Choose A Company.']);
  });

  it('needs a positive amount with at most 2 decimals', () => {
    expect(issues({ amountReceived: '' })).toEqual(['Enter The Amount Received.']);
    expect(issues({ amountReceived: '0' })).toEqual(['The Amount Must Be More Than 0.']);
    expect(issues({ amountReceived: '10.505' })).toEqual(['Use At Most 2 Decimal Places.']);
  });

  it('needs a received date that is not in the future', () => {
    expect(issues({ dateReceived: '' })).toEqual(['Enter The Date Received.']);
    expect(issues({ dateReceived: '2999-01-01' })).toEqual(['The Date Received Cannot Be In The Future.']);
    expect(issues({ dateReceived: todayApiDate() })).toEqual([]);
  });

  it('limits the reference and comment to the backend bounds', () => {
    expect(issues({ reference: 'x'.repeat(101) })).toEqual(['Must Not Exceed 100 Characters.']);
    expect(issues({ comment: 'x'.repeat(1001) })).toEqual(['Must Not Exceed 1000 Characters.']);
  });
});

describe('record payment defaults and mapping', () => {
  it('offers the methods the backend accepts', () => {
    expect(PAYMENT_METHOD_OPTIONS.map((o) => o.label)).toEqual(['Bank Transfer', 'UPI', 'Cheque', 'Cash']);
    expect(paymentMethodLabel('CHEQUE')).toBe('Cheque');
    expect(paymentMethodLabel(undefined)).toBe('');
  });

  it('starts today by bank transfer, for the pending amount when something is owed', () => {
    const now = new Date(2026, 9, 13);
    expect(recordPaymentDefaults('co-1', undefined, now)).toEqual({
      companyId: 'co-1',
      amountReceived: '',
      dateReceived: '2026-10-13',
      method: 'BANK_TRANSFER',
      reference: '',
      comment: '',
    });
    expect(recordPaymentDefaults('co-1', 52650, now).amountReceived).toBe('52650');
    expect(recordPaymentDefaults('co-1', 0, now).amountReceived).toBe('');
    expect(recordPaymentDefaults('co-1', -500, now).amountReceived).toBe('');
  });

  it('is complete once amount, date and method are filled', () => {
    expect(isRecordPaymentComplete(valid)).toBe(true);
    expect(isRecordPaymentComplete({ ...valid, amountReceived: '' })).toBe(false);
    expect(isRecordPaymentComplete({ ...valid, companyId: '' })).toBe(false);
  });

  it('trims and omits blank optional fields, and leaves the company to the path', () => {
    expect(toPaymentRequest(recordPaymentFormSchema.parse(valid))).toEqual({
      amountReceived: 52650,
      dateReceived: '2026-09-27',
      method: 'BANK_TRANSFER',
      reference: 'UTR123',
    });
  });

  it('maps backend field errors onto form fields', () => {
    expect(paymentFieldFromApi('dateReceived')).toBe('dateReceived');
    expect(paymentFieldFromApi('clientId')).toBeUndefined();
  });
});

describe('editing a payment', () => {
  it('starts from the ledger entry, with the amount positive and the date received', () => {
    expect(
      paymentFormDefaults({
        companyId: 'co-1',
        entryType: 'PAYMENT',
        totalAmount: -52650,
        dueDate: '2026-09-27',
        paymentMethod: 'UPI',
        paymentReference: 'UTR123',
      }),
    ).toEqual({
      companyId: 'co-1',
      amountReceived: '52650',
      dateReceived: '2026-09-27',
      method: 'UPI',
      reference: 'UTR123',
      comment: '',
    });
  });
});
