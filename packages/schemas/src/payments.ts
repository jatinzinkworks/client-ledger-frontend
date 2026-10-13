import { PaymentRequestMethod, type LedgerEntryResponse, type PaymentRequest } from '@cl/api';
import {
  recordPaymentBodyAmountReceivedMin as AMOUNT_MIN,
  recordPaymentBodyCommentMax as COMMENT_MAX,
  recordPaymentBodyReferenceMax as REFERENCE_MAX,
} from '@cl/api/zod';
import { z } from 'zod';

import { todayApiDate } from './assignments';
import { blankToUndefined, hasAtMostTwoDecimals, tooLong } from './fields';
import type { Option } from './services';

// Recording a payment received from one company of a client (`POST …/companies/{companyId}/payments`).
// The company (part of the path, not the body), amount, date received and method are mandatory;
// the backend stores the payment as a negative ledger entry dated on the day received. It is not
// matched to particular charges.

export type PaymentMethod = PaymentRequestMethod;
export const PAYMENT_METHODS = Object.values(PaymentRequestMethod);

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  CASH: 'Cash',
};

export const PAYMENT_METHOD_OPTIONS: readonly Option[] = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

const API_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_MESSAGE = 'Enter The Amount Received.';

export const recordPaymentFormSchema = z.object({
  companyId: z.string().min(1, 'Choose A Company.'),
  amountReceived: z.preprocess(
    blankToUndefined,
    z
      .number({ error: AMOUNT_MESSAGE })
      .min(AMOUNT_MIN, 'The Amount Must Be More Than 0.')
      .refine(hasAtMostTwoDecimals, 'Use At Most 2 Decimal Places.'),
  ),
  // `<input type="date">` yields "2026-10-15", or "" when blank / incomplete. API dates compare
  // correctly as strings; the backend refuses a date after today too.
  dateReceived: z
    .string()
    .regex(API_DATE, 'Enter The Date Received.')
    .refine((date) => date <= todayApiDate(), 'The Date Received Cannot Be In The Future.'),
  method: z.enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]], { error: 'Choose How It Was Paid.' }),
  reference: z.string().trim().max(REFERENCE_MAX, tooLong(REFERENCE_MAX)),
  comment: z.string().trim().max(COMMENT_MAX, tooLong(COMMENT_MAX)),
});

export type RecordPaymentFormInput = z.input<typeof recordPaymentFormSchema>;
export type RecordPaymentFormValues = z.output<typeof recordPaymentFormSchema>;
export type RecordPaymentField = keyof RecordPaymentFormInput;

export const RECORD_PAYMENT_FIELDS: Readonly<
  Record<RecordPaymentField, { label: string; placeholder?: string; hint?: string }>
> = {
  companyId: { label: 'Company', placeholder: 'Choose A Company' },
  amountReceived: { label: 'Amount Received' },
  dateReceived: { label: 'Date Received' },
  method: { label: 'Method' },
  reference: { label: 'Reference', placeholder: 'UTR Or Cheque No.' },
  comment: {
    label: 'Comment',
    placeholder: 'E.g. Part payment against statutory audit',
    hint: 'Optional. Shown On The Ledger Entry.',
  },
};

/** Explains how a payment is applied, under the form. */
export const PAYMENT_SETTLEMENT_NOTE = "Payments Reduce The Company's Balance As A Whole, Not Particular Charges.";

/** The Amount Received a company's balance suggests: what it owes, or blank when nothing is. */
export const suggestedPaymentAmount = (pending: number | undefined) =>
  pending != null && pending > 0 ? String(pending) : '';

/** A payment received today by bank transfer, for the company's pending amount when it owes something. */
export const recordPaymentDefaults = (companyId: string, pending?: number, now?: Date): RecordPaymentFormInput => ({
  companyId,
  amountReceived: suggestedPaymentAmount(pending),
  dateReceived: todayApiDate(now),
  method: PaymentRequestMethod.BANK_TRANSFER,
  reference: '',
  comment: '',
});

/**
 * Edit Payment starts from the payment's ledger entry: its total is stored negative and its due
 * date is the date received.
 */
export const paymentFormDefaults = (payment: LedgerEntryResponse): RecordPaymentFormInput => ({
  companyId: payment.companyId ?? '',
  amountReceived: payment.totalAmount != null ? String(Math.abs(payment.totalAmount)) : '',
  dateReceived: payment.dueDate ?? '',
  method: payment.paymentMethod ?? PaymentRequestMethod.BANK_TRANSFER,
  reference: payment.paymentReference ?? '',
  comment: payment.comment ?? '',
});

/** Every mandatory field is filled — gates the submit button. */
export const isRecordPaymentComplete = (v: Partial<RecordPaymentFormInput>) =>
  !!v.companyId && v.amountReceived !== '' && v.amountReceived != null && !!v.dateReceived && !!v.method;

/**
 * The request body, for recording and updating alike; the company goes in the path. Blank
 * reference and comment are omitted rather than sent as "" — on update, that clears them.
 */
export const toPaymentRequest = (v: RecordPaymentFormValues): PaymentRequest => ({
  amountReceived: v.amountReceived,
  dateReceived: v.dateReceived,
  method: v.method,
  ...(v.reference && { reference: v.reference }),
  ...(v.comment && { comment: v.comment }),
});

/** The form field a backend validation error refers to, if it is one we render. */
export const paymentFieldFromApi = (path: string): RecordPaymentField | undefined =>
  path in RECORD_PAYMENT_FIELDS ? (path as RecordPaymentField) : undefined;

/** "Bank Transfer" for a payment's method; empty when missing. */
export const paymentMethodLabel = (method: PaymentMethod | undefined) => (method ? PAYMENT_METHOD_LABELS[method] : '');
