import { ApiError, errorMessage, type LedgerSummaryEmailResponse } from '@cl/api';

import { currentFinancialYear, financialYearLabel } from './financialYears';

// Emailing a client their ledger summary. The backend always summarises the current financial
// year, whichever year the screen is showing, so the copy names it.

export const EMAIL_LEDGER_LABEL = 'Email Summary';

export const EMAIL_LEDGER_TITLE = 'Email The Ledger Summary?';

export const EMAIL_SENT_TITLE = 'Email Sent';

/** What sending does, for the confirmation: who it goes to, which year, what is attached. */
export const companyLedgerEmailDescription = (companyName: string, now = new Date()) =>
  `Emails ${companyName || 'this company'}'s ledger summary for ${financialYearLabel(currentFinancialYear(now))} ` +
  "to the client, copying in their manager, with the year's Excel ledger attached.";

/** The confirmation for the client-wide email: every company together, a sheet each in the workbook. */
export const clientLedgerEmailDescription = (clientName: string, now = new Date()) =>
  `Emails ${clientName || 'the client'} their ledger summary for ${financialYearLabel(currentFinancialYear(now))} ` +
  "across all of their companies, copying in their manager, with the year's Excel ledger attached (a sheet per company).";

/** The button's tooltip on web: what it sends, for a client or one company. */
export const ledgerEmailTooltip = (scope: 'client' | 'company') =>
  scope === 'client'
    ? 'Email The Client Their Ledger Summary Across All Companies For The Current Financial Year'
    : "Email The Client This Company's Ledger Summary For The Current Financial Year";

/** "Ledger Summary Emailed To rohan@example.com, Copying In pranay@example.com." */
export function ledgerEmailSentMessage(sent: LedgerSummaryEmailResponse): string {
  const cc = sent.cc?.filter(Boolean) ?? [];
  return `Ledger Summary Emailed To ${sent.to ?? 'The Client'}${cc.length ? `, Copying In ${cc.join(', ')}` : ''}.`;
}

/** Why the email was not sent; a 502 is the mail set-up or server, and nothing went out. */
export const ledgerEmailError = (error: unknown) =>
  error instanceof ApiError && error.status === 502
    ? 'The Email Could Not Be Sent: Email Is Not Set Up, Or The Mail Server Could Not Be Reached. Nothing Was Sent.'
    : errorMessage(error);
