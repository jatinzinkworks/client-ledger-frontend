import {
  LedgerEntryResponseEntryType,
  type ClientLedgerSummaryResponse,
  type CompanyLedgerSummaryResponse,
  type LedgerEntryResponse,
  type LedgerEntryUpdateRequest,
} from '@cl/api';
import {
  updateEntryBodyDiscountPercentMax as DISCOUNT_MAX,
  updateEntryBodyGstRatePercentMax as GST_MAX,
} from '@cl/api/zod';
import { z } from 'zod';

import { formatApiDate } from './companies';
import { financialYearLabel } from './financialYears';
import { blankToUndefined, hasAtMostTwoDecimals } from './fields';
import { formatInr } from './services';
import { servicesCountLabel } from './companies';

// A company's ledger: service charges posted for services that fell due, and payments received
// (stored with a negative total). A service charge's fee, discount and GST rate can be corrected
// — the backend works the amounts out again — but not what it bills or when. A payment cannot be
// corrected, only deleted.

/** "12 Entries" / "1 Entry". */
export const ledgerEntryCountLabel = (count: number) => `${count} ${count === 1 ? 'Entry' : 'Entries'}`;

/** What Generate Service Entries did: how many entries it posted, or that nothing was due. */
export const generatedEntriesMessage = (count: number) =>
  count === 0 ? 'Nothing Is Due Yet, So No New Entries Were Generated.' : `${ledgerEntryCountLabel(count)} Generated.`;

/** "Showing 21–40 Of 132" for a page (counting from 0) of a paged list. */
export function pageRangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) return 'No Entries';
  const first = page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  return `Showing ${first}–${last} Of ${total}`;
}

/** Shown in place of the table when no entry falls in the financial year (or none exists at all). */
export const noLedgerEntries = (financialYear?: string) =>
  `No Ledger Entries ${financialYear ? `In ${financialYearLabel(financialYear)}` : 'Yet'}. Generate Service Entries To Bill The Services That Are Due.`;

// ── Edit Ledger Entry ───────────────────────────────────────────────────────────────────

/** A mandatory number from 0 to `max` (unbounded when omitted) with up to 2 decimals. */
const requiredAmount = (message: string, max?: number) =>
  z.preprocess(
    blankToUndefined,
    z
      .number({ error: message })
      .min(0, message)
      .max(max ?? Number.MAX_SAFE_INTEGER, message)
      .refine(hasAtMostTwoDecimals, 'Use At Most 2 Decimal Places.'),
  );

export const ledgerEntryFormSchema = z.object({
  serviceFee: requiredAmount('Enter The Service Fee.'),
  discountPercent: requiredAmount(`Enter A Discount From 0 To ${DISCOUNT_MAX}%.`, DISCOUNT_MAX),
  // A select of GST slabs, so its value is a string.
  gstRatePercent: requiredAmount('Choose A GST Rate.', GST_MAX),
});

export type LedgerEntryFormInput = z.input<typeof ledgerEntryFormSchema>;
export type LedgerEntryFormValues = z.output<typeof ledgerEntryFormSchema>;
export type LedgerEntryField = keyof LedgerEntryFormInput;

export const LEDGER_ENTRY_FIELDS: Readonly<Record<LedgerEntryField, { label: string; hint?: string }>> = {
  serviceFee: { label: 'Service Fee', hint: 'Before Discount, Excluding GST.' },
  discountPercent: { label: 'Discount %' },
  gstRatePercent: { label: 'GST Rate' },
};

/** The form starts from the entry's stored rates. */
export const ledgerEntryDefaults = (e: LedgerEntryResponse): LedgerEntryFormInput => ({
  serviceFee: e.serviceFee != null ? String(e.serviceFee) : '',
  discountPercent: e.discountPercent != null ? String(e.discountPercent) : '0',
  gstRatePercent: e.gstRatePercent != null ? String(e.gstRatePercent) : '',
});

export const toLedgerEntryUpdateRequest = (v: LedgerEntryFormValues): LedgerEntryUpdateRequest => ({ ...v });

/** The form field a backend validation error refers to, if it is one we render. */
export const ledgerEntryFieldFromApi = (path: string): LedgerEntryField | undefined =>
  path in LEDGER_ENTRY_FIELDS ? (path as LedgerEntryField) : undefined;

/** "GST Return Filing · Due 7 Oct 2026" — names an entry in titles and dialogs. */
/** "Payment · 27 Sep 2026" for a payment (its due date is the date received). */
export function ledgerEntryName(e: Pick<LedgerEntryResponse, 'serviceName' | 'dueDate' | 'entryType'>): string {
  const date = formatApiDate(e.dueDate);
  if (isPayment(e)) return ['Payment', date].filter(Boolean).join(' · ');
  return [e.serviceName ?? 'Ledger Entry', date && `Due ${date}`].filter(Boolean).join(' · ');
}

/** A payment received, rather than a charge for a service. */
export const isPayment = (e: Pick<LedgerEntryResponse, 'entryType'>) => e.entryType === LedgerEntryResponseEntryType.PAYMENT;

/** What deleting a service charge does: the service is not billed again for that date. */
export const DELETE_LEDGER_ENTRY_WARNING =
  'The Entry Is Removed From The Ledger And The Service Is Not Billed Again For This Date. This Cannot Be Undone.';

/** What deleting a payment does: the amount counts as owed again. */
export const DELETE_PAYMENT_WARNING =
  'The Payment Is Removed From The Ledger, So Its Amount Counts As Owed Again. This Cannot Be Undone.';

export const deleteEntryWarning = (e: Pick<LedgerEntryResponse, 'entryType'>) =>
  isPayment(e) ? DELETE_PAYMENT_WARNING : DELETE_LEDGER_ENTRY_WARNING;

// ── Year summary cards ──────────────────────────────────────────────────────────────────

/** How a summary card's figure is coloured: owed in red, received in green. */
export type SummaryTone = 'default' | 'positive' | 'negative';

/** How a figure moved against an earlier period, e.g. this year to date against last. */
export interface SummaryChange {
  direction: 'up' | 'down' | 'flat';
  /** "12% vs FY 2025–26 To Date". */
  label: string;
  /** Green when the move is good (more received), red when bad (more pending). */
  tone: SummaryTone;
}

export interface SummaryCard {
  label: string;
  value: string;
  /** A smaller line under the figure. */
  note?: string;
  tone: SummaryTone;
  /** Against an earlier period, when known. */
  change?: SummaryChange;
}

/**
 * Billed, Received, Pending, Last Payment and Discount for one financial year. Pending is red
 * only while something is owed; a year whose payments exceed its billing shows it plain.
 */
export function ledgerSummaryCards(s: CompanyLedgerSummaryResponse, financialYear: string): SummaryCard[] {
  const fy = financialYearLabel(financialYear);
  const amount = (value: number | undefined) => formatInr(value ?? 0);
  return [
    { label: 'Billed', value: amount(s.totalBilled), tone: 'default' },
    { label: 'Received', value: amount(s.totalPaymentReceived), tone: 'positive' },
    { label: 'Pending', value: amount(s.pending), tone: (s.pending ?? 0) > 0 ? 'negative' : 'default' },
    s.lastPayment
      ? {
          label: 'Last Payment',
          value: formatApiDate(s.lastPayment.date),
          note: amount(s.lastPayment.amount),
          tone: 'default',
        }
      : { label: 'Last Payment', value: '—', note: `None In ${fy}`, tone: 'default' },
    { label: 'Discount', value: amount(s.totalDiscount), note: `Given In ${fy}`, tone: 'positive' },
  ];
}

/** "43% Of Billed" — the share of the year's billing received; none when nothing was billed. */
export function receivedShareLabel(billed: number | undefined, received: number | undefined): string | undefined {
  if (!billed || billed <= 0) return undefined;
  return `${Math.round(((received ?? 0) / billed) * 100)}% Of Billed`;
}

/**
 * Billed, Received, Pending and Discount for a client across all of their companies in one
 * financial year. `serviceCount` (the client's services, from their companies list) notes the
 * billed figure when known.
 */
export function clientSummaryCards(
  s: ClientLedgerSummaryResponse,
  financialYear: string,
  serviceCount?: number,
): SummaryCard[] {
  const amount = (value: number | undefined) => formatInr(value ?? 0);
  const card = (label: string, value: string, tone: SummaryTone, note?: string): SummaryCard =>
    note ? { label, value, note, tone } : { label, value, tone };
  return [
    card('Billed', amount(s.totalBilled), 'default', serviceCount != null ? servicesCountLabel(serviceCount) : undefined),
    card('Received', amount(s.totalPaymentReceived), 'positive', receivedShareLabel(s.totalBilled, s.totalPaymentReceived)),
    card('Pending', amount(s.pending), (s.pending ?? 0) > 0 ? 'negative' : 'default'),
    card('Discount', amount(s.totalDiscount), 'positive', `Given In ${financialYearLabel(financialYear)}`),
  ];
}

// ── Account status ──────────────────────────────────────────────────────────────────────

/** Where a company's account stands for a financial year, from what is pending in it. */
export type AccountStatus = 'OVERDUE' | 'SETTLED' | 'IN_CREDIT';

export const ACCOUNT_STATUS_LABELS: Readonly<Record<AccountStatus, string>> = {
  OVERDUE: 'Overdue',
  SETTLED: 'Settled',
  // Paid more than was billed: the company holds a credit against future charges.
  IN_CREDIT: 'In Credit',
};

/** Overdue while anything is pending, Settled at zero, In Credit when overpaid; none when unknown. */
export function accountStatus(pending: number | undefined): AccountStatus | undefined {
  if (pending == null) return undefined;
  return pending > 0 ? 'OVERDUE' : pending < 0 ? 'IN_CREDIT' : 'SETTLED';
}

// ── Export ──────────────────────────────────────────────────────────────────────────────

/**
 * The workbook's name when the backend does not send one, matching its own pattern:
 * Rohan_Mehta_Ledger_FY2026-27.xlsx.
 */
export const ledgerExportFileName = (clientName: string, financialYear: string) =>
  `${clientName.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'Client'}_Ledger_FY${financialYear}.xlsx`;
