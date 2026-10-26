import {
  ApiError,
  errorMessage,
  type BulkLedgerSummaryEmailResponse,
  type BulkPostingResponse,
  type BulkRun,
  type PaymentReminderResponse,
} from '@cl/api';

import { currentFinancialYear, financialYearLabel } from './financialYears';

// Bulk actions (Settings, both apps): runs across every client the backend offers —
// payment reminders, every client's ledger summary email, and posting every company's due
// services. Each asks first, then reports what it did, listing any client or company that failed
// (the rest go ahead regardless).

export type BulkActionKey = 'paymentReminders' | 'ledgerSummaries' | 'postDue';

export interface BulkActionCopy {
  key: BulkActionKey;
  title: string;
  description: string;
  /** The button, and the confirm action. */
  label: string;
  runningLabel: string;
  confirmTitle: string;
  confirmBody: string;
}

export const BULK_ACTIONS_SECTION = {
  title: 'Bulk Actions',
  description: 'Run these across every client at once. Each asks first, then lists anyone it could not reach.',
} as const;

/** The three actions, top to bottom. The year is the current one: the backend always uses it. */
export const bulkActions = (now = new Date()): readonly BulkActionCopy[] => {
  const year = financialYearLabel(currentFinancialYear(now));
  return [
    {
      key: 'paymentReminders',
      title: 'Payment Reminders',
      description: `Email every client who owes anything a reminder for the whole amount, with their ${year} ledger statement attached.`,
      label: 'Send Reminders',
      runningLabel: 'Sending Reminders…',
      confirmTitle: 'Send Payment Reminders?',
      confirmBody:
        'Every client who owes something, across all years, is emailed a reminder, copying in their manager. Clients who are settled or in credit are skipped.',
    },
    {
      key: 'ledgerSummaries',
      title: 'Ledger Summaries',
      description: `Email every client their ${year} ledger summary across all of their companies, with the PDF statement attached.`,
      label: 'Email All Clients',
      runningLabel: 'Emailing Clients…',
      confirmTitle: 'Email Every Client Their Ledger Summary?',
      confirmBody: `Every client is emailed their ${year} summary, copying in their manager, even those with nothing billed this year. This can take a while.`,
    },
    {
      key: 'postDue',
      title: 'Post Due Services',
      description: "Bill every company's services that have fallen due up to today, as Generate Service Entries does for one company.",
      label: 'Post Due Services',
      runningLabel: 'Posting…',
      confirmTitle: 'Post Due Services For Every Company?',
      confirmBody: 'Each service due on or before today and not yet billed is added to its ledger once. Running it again bills nothing new.',
    },
  ];
};

/** What a run did: a line to read at a glance, and anyone it failed for, with why. */
export interface BulkOutcome {
  summary: string;
  failures: { key: string; name: string; reason: string }[];
}

const count = (n: number | undefined, one: string, many: string) => `${n ?? 0} ${n === 1 ? one : many}`;

export function paymentRemindersOutcome(r: PaymentReminderResponse): BulkOutcome {
  return {
    summary:
      `Reminders Sent To ${count(r.sentCount, 'Client', 'Clients')}. ` +
      `${count(r.skippedCount, 'Client Was', 'Clients Were')} Skipped, Owing Nothing.`,
    failures: (r.failures ?? []).map((f, i) => ({ key: f.clientId ?? String(i), name: f.clientName ?? '', reason: f.error ?? '' })),
  };
}

export function ledgerSummariesOutcome(r: BulkLedgerSummaryEmailResponse): BulkOutcome {
  return {
    summary: `Ledger Summaries Sent To ${r.sentCount ?? 0} Of ${count(r.clientCount, 'Client', 'Clients')}.`,
    failures: (r.failures ?? []).map((f, i) => ({ key: f.clientId ?? String(i), name: f.clientName ?? '', reason: f.error ?? '' })),
  };
}

export function postDueOutcome(r: BulkPostingResponse): BulkOutcome {
  const posted = r.companies?.length ?? 0;
  return {
    summary: r.entriesPosted
      ? `${count(r.entriesPosted, 'Entry', 'Entries')} Posted For ${count(posted, 'Company', 'Companies')}, Of ${r.companyCount ?? 0} Checked.`
      : `Nothing Was Due. ${count(r.companyCount, 'Company', 'Companies')} Checked.`,
    failures: (r.failures ?? []).map((f, i) => ({ key: f.companyId ?? String(i), name: f.companyName ?? '', reason: f.error ?? '' })),
  };
}

/** A bulk action ready for a screen: start it to get its outcome; whether it is running. */
export interface BulkActionRun {
  run: () => Promise<BulkOutcome>;
  running: boolean;
}

/** `useBulkActions()`'s runs, each turned into its outcome for the screen. */
export const bulkActionRuns = (runs: {
  paymentReminders: BulkRun<PaymentReminderResponse>;
  ledgerSummaries: BulkRun<BulkLedgerSummaryEmailResponse>;
  postDue: BulkRun<BulkPostingResponse>;
}): Record<BulkActionKey, BulkActionRun> => ({
  paymentReminders: { run: () => runs.paymentReminders.run().then(paymentRemindersOutcome), running: runs.paymentReminders.running },
  ledgerSummaries: { run: () => runs.ledgerSummaries.run().then(ledgerSummariesOutcome), running: runs.ledgerSummaries.running },
  postDue: { run: () => runs.postDue.run().then(postDueOutcome), running: runs.postDue.running },
});

/** "Not Done For 2" — heads the failure list. */
export const bulkFailuresTitle = (failures: number) => `Not Done For ${failures}`;

/** Why a run did not happen at all; a 502 means email is not set up, so nobody was emailed. */
export const bulkActionError = (error: unknown) =>
  error instanceof ApiError && error.status === 502
    ? 'Email Is Not Set Up On The Server, So Nobody Was Emailed.'
    : errorMessage(error);
