import { describe, expect, it } from 'vitest';

import {
  paymentDueExample,
  paymentTermsFormDefaults,
  paymentTermsFormSchema,
  reminderOptions,
  toPaymentTermsRequest,
  type PaymentTermsFormInput,
} from './paymentTerms';

const valid: PaymentTermsFormInput = {
  paymentDueAfterDays: '15',
  markOverdueAfterDays: '60',
  paymentReminderEnabled: true,
  paymentReminderDays: '7',
};

function issuesFor(input: PaymentTermsFormInput) {
  const result = paymentTermsFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('paymentTermsFormSchema', () => {
  it('coerces typed strings into numbers', () => {
    expect(paymentTermsFormSchema.parse(valid)).toEqual({
      paymentDueAfterDays: 15,
      markOverdueAfterDays: 60,
      paymentReminderEnabled: true,
      paymentReminderDays: 7,
    });
  });

  it('enforces the 1–365 day bounds from the spec', () => {
    expect(issuesFor({ ...valid, paymentDueAfterDays: '0' })).toEqual({
      paymentDueAfterDays: 'Enter Whole Days From 1 To 365.',
    });
    expect(issuesFor({ ...valid, markOverdueAfterDays: '366' })).toHaveProperty('markOverdueAfterDays');
    expect(issuesFor({ ...valid, paymentDueAfterDays: '2.5' })).toHaveProperty('paymentDueAfterDays');
  });

  it('lets overdue be fewer days than payment due — it is counted from the due date', () => {
    expect(issuesFor({ ...valid, paymentDueAfterDays: '30', markOverdueAfterDays: '10' })).toEqual({});
  });

  it('requires reminder days only while reminders are enabled', () => {
    expect(issuesFor({ ...valid, paymentReminderDays: '' })).toHaveProperty('paymentReminderDays');
    expect(issuesFor({ ...valid, paymentReminderEnabled: false, paymentReminderDays: '' })).toEqual({});
  });
});

describe('paymentDueExample', () => {
  it('describes the due date for an invoice on 1 October', () => {
    expect(paymentDueExample(15, 2026)).toBe('An Invoice On 1 Oct Is Due On 16 Oct 2026.');
    expect(paymentDueExample(60, 2026)).toBe('An Invoice On 1 Oct Is Due On 30 Nov 2026.');
  });
});

describe('reminderOptions', () => {
  it('offers off plus the presets', () => {
    expect(reminderOptions().map((o) => o.label)).toEqual([
      "Don't Send Reminders",
      '1 Day Before Due Date',
      '3 Days Before Due Date',
      '7 Days Before Due Date',
      '14 Days Before Due Date',
    ]);
  });

  it('keeps a stored value that is not a preset', () => {
    expect(reminderOptions(10).map((o) => o.value)).toEqual(['off', '1', '3', '7', '10', '14']);
  });
});

describe('paymentTermsFormDefaults', () => {
  it('falls back to the backend defaults when nothing is stored', () => {
    expect(paymentTermsFormDefaults()).toEqual({
      paymentDueAfterDays: 15,
      markOverdueAfterDays: 60,
      paymentReminderEnabled: false,
      paymentReminderDays: undefined,
    });
  });
});

describe('toPaymentTermsRequest', () => {
  it('drops reminder days when reminders are off', () => {
    const values = paymentTermsFormSchema.parse({ ...valid, paymentReminderEnabled: false });
    expect(toPaymentTermsRequest(values)).toEqual({
      paymentDueAfterDays: 15,
      markOverdueAfterDays: 60,
      paymentReminderEnabled: false,
    });
  });
});
