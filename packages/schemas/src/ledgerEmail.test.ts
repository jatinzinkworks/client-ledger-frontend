import { ApiError } from '@cl/api';
import { describe, expect, it } from 'vitest';

import { clientLedgerEmailDescription, companyLedgerEmailDescription, ledgerEmailError, ledgerEmailSentMessage } from './ledgerEmail';

describe('ledger summary email', () => {
  it('names the company and the current financial year, whichever year is on screen', () => {
    expect(companyLedgerEmailDescription('Mehta Textiles Pvt Ltd', new Date(2026, 9, 14))).toBe(
      "Emails Mehta Textiles Pvt Ltd's ledger summary for FY 2026–27 to the client, copying in their manager, with the year's Excel ledger attached.",
    );
  });

  it('covers every company in the client-wide email', () => {
    expect(clientLedgerEmailDescription('Rohan Mehta', new Date(2026, 9, 14))).toBe(
      "Emails Rohan Mehta their ledger summary for FY 2026–27 across all of their companies, copying in their manager, with the year's Excel ledger attached (a sheet per company).",
    );
  });

  it('says who it went to', () => {
    expect(ledgerEmailSentMessage({ to: 'rohan@example.com', cc: ['pranay@example.com'] })).toBe(
      'Ledger Summary Emailed To rohan@example.com, Copying In pranay@example.com.',
    );
    expect(ledgerEmailSentMessage({ to: 'rohan@example.com' })).toBe('Ledger Summary Emailed To rohan@example.com.');
  });

  it('explains a mail failure in plain words', () => {
    expect(ledgerEmailError(new ApiError(502))).toMatch(/Nothing Was Sent/);
  });
});
