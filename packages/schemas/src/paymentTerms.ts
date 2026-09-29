import type { PaymentTermsRequest, PaymentTermsResponse } from '@cl/api';
import {
  savePaymentTermsBodyMarkOverdueAfterDaysDefault as OVERDUE_DEFAULT,
  savePaymentTermsBodyMarkOverdueAfterDaysMax as OVERDUE_MAX,
  savePaymentTermsBodyPaymentDueAfterDaysDefault as DUE_DEFAULT,
  savePaymentTermsBodyPaymentDueAfterDaysMax as DUE_MAX,
  savePaymentTermsBodyPaymentReminderDaysMax as REMINDER_MAX,
  savePaymentTermsBodyPaymentReminderEnabledDefault as REMINDER_ENABLED_DEFAULT,
} from '@cl/api/zod';
import { z } from 'zod';

// Bounds and defaults come from the generated OpenAPI schema, so they follow the backend.
// The cross-field rule mirrors the backend's @AssertTrue check on PaymentTermsRequest, which
// OpenAPI cannot express — keep the rules (not the wording) in step with the Java side.
// Copy is Title Case to match the product mocks.
const MIN_DAYS = 1;

/** A day count typed into a text field: accepts "15" (web and native inputs) or 15. */
const days = (max: number) => {
  const message = `Enter Whole Days From ${MIN_DAYS} To ${max}.`;
  return z.coerce.number({ error: message }).int(message).min(MIN_DAYS, message).max(max, message);
};

export const paymentTermsFormSchema = z
  .object({
    paymentDueAfterDays: days(DUE_MAX),
    markOverdueAfterDays: days(OVERDUE_MAX),
    paymentReminderEnabled: z.boolean(),
    // Only meaningful when reminders are on; an empty field is "not set", not 0.
    paymentReminderDays: z.preprocess((v) => (v === '' || v == null ? undefined : v), days(REMINDER_MAX).optional()),
  })
  .superRefine((values, ctx) => {
    if (values.paymentReminderEnabled && values.paymentReminderDays == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentReminderDays'],
        message: 'Choose When To Send The Reminder.',
      });
    }
  });

/** What the form fields hold (strings while typing). */
export type PaymentTermsFormInput = z.input<typeof paymentTermsFormSchema>;
/** What a successful parse yields. */
export type PaymentTermsFormValues = z.output<typeof paymentTermsFormSchema>;

export type PaymentTermsDayField = 'paymentDueAfterDays' | 'markOverdueAfterDays' | 'paymentReminderDays';

/** Labels and hints for the day-count fields, rendered identically by both apps. */
export const PAYMENT_TERMS_DAY_FIELDS: Readonly<Record<PaymentTermsDayField, { label: string; hint: string }>> = {
  paymentDueAfterDays: { label: 'Payment Due After Invoice', hint: 'Days After The Invoice Date.' },
  markOverdueAfterDays: { label: 'Mark Overdue After', hint: 'Counted From The Payment Due Date.' },
  paymentReminderDays: { label: 'Payment Reminder', hint: 'Days Before The Due Date.' },
};

/** Section copy for the Payment Terms settings card. */
export const PAYMENT_TERMS_SECTION = {
  title: 'Payment Terms',
  description: 'When Invoices Fall Due And When Unpaid Balances Are Flagged.',
} as const;

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * The worked example under "Payment Due After Invoice", e.g. "An Invoice On 1 Oct Is Due On
 * 16 Oct 2026." — anchored on 1 October of `year` so the sentence reads the same every day.
 */
export function paymentDueExample(dueDays: number, year = new Date().getFullYear()): string {
  const invoiced = new Date(year, 9, 1);
  const due = new Date(year, 9, 1 + dueDays);
  return `An Invoice On ${dateFormat.format(invoiced).replace(` ${year}`, '')} Is Due On ${dateFormat.format(due)}.`;
}

/** Select value meaning "reminders off"; every other value is a day count as a string. */
export const REMINDER_OFF = 'off';

/** Preset reminder lead times offered by the Payment Reminder select. */
export const REMINDER_PRESET_DAYS: readonly number[] = [1, 3, 7, 14];

export interface ReminderOption {
  value: string;
  label: string;
}

const daysBeforeLabel = (n: number) => `${n} ${n === 1 ? 'Day' : 'Days'} Before Due Date`;

/**
 * Options for the Payment Reminder select. The backend stores reminders only as days *before*
 * the due date (1–365), so that is all we offer; a stored value outside the presets is kept
 * as an extra option rather than silently changed.
 */
export function reminderOptions(current?: number): ReminderOption[] {
  const presets = current && !REMINDER_PRESET_DAYS.includes(current) ? [...REMINDER_PRESET_DAYS, current] : REMINDER_PRESET_DAYS;
  return [
    { value: REMINDER_OFF, label: "Don't Send Reminders" },
    ...[...presets].sort((a, b) => a - b).map((n) => ({ value: String(n), label: daysBeforeLabel(n) })),
  ];
}

/** Initial form values: the stored terms when they exist, else the backend defaults. */
export function paymentTermsFormDefaults(stored?: PaymentTermsResponse): PaymentTermsFormInput {
  return {
    paymentDueAfterDays: stored?.paymentDueAfterDays ?? DUE_DEFAULT,
    markOverdueAfterDays: stored?.markOverdueAfterDays ?? OVERDUE_DEFAULT,
    paymentReminderEnabled: stored?.paymentReminderEnabled ?? REMINDER_ENABLED_DEFAULT,
    paymentReminderDays: stored?.paymentReminderDays,
  };
}

/**
 * The request body for a parsed form. The endpoint replaces the record wholesale, so every
 * field is sent; reminder days are dropped when reminders are off (the backend ignores them).
 */
export function toPaymentTermsRequest(values: PaymentTermsFormValues): PaymentTermsRequest {
  return {
    paymentDueAfterDays: values.paymentDueAfterDays,
    markOverdueAfterDays: values.markOverdueAfterDays,
    paymentReminderEnabled: values.paymentReminderEnabled,
    ...(values.paymentReminderEnabled ? { paymentReminderDays: values.paymentReminderDays } : {}),
  };
}
