import { ApiError } from '@cl/api';
import { describe, expect, it } from 'vitest';

import { bulkActionError, bulkActions, ledgerSummariesOutcome, paymentRemindersOutcome, postDueOutcome } from './bulkActions';

describe('bulk actions', () => {
  it('names the current financial year, whichever year is selected', () => {
    const [reminders, summaries] = bulkActions(new Date(2026, 9, 26));
    expect(reminders?.description).toContain('FY 2026–27');
    expect(summaries?.confirmBody).toContain('FY 2026–27');
  });

  it('reports reminders sent and skipped, with each failure', () => {
    const outcome = paymentRemindersOutcome({
      sentCount: 17,
      skippedCount: 1,
      failures: [{ clientId: 'c1', clientName: 'Rohan Mehta', error: 'The mail server refused it' }],
    });
    expect(outcome.summary).toBe('Reminders Sent To 17 Clients. 1 Client Was Skipped, Owing Nothing.');
    expect(outcome.failures).toEqual([{ key: 'c1', name: 'Rohan Mehta', reason: 'The mail server refused it' }]);
  });

  it('reports ledger summaries sent out of every client', () => {
    expect(ledgerSummariesOutcome({ sentCount: 41, clientCount: 42 }).summary).toBe('Ledger Summaries Sent To 41 Of 42 Clients.');
  });

  it('reports entries posted, or that nothing was due', () => {
    const posted = postDueOutcome({ companyCount: 97, entriesPosted: 41, companies: [{}, {}, {}] });
    expect(posted.summary).toBe('41 Entries Posted For 3 Companies, Of 97 Checked.');
    expect(postDueOutcome({ companyCount: 1, entriesPosted: 0 }).summary).toBe('Nothing Was Due. 1 Company Checked.');
  });

  it('explains a 502: mail is not set up and nobody was emailed', () => {
    expect(bulkActionError(new ApiError(502, { status: 502 }))).toBe('Email Is Not Set Up On The Server, So Nobody Was Emailed.');
    expect(bulkActionError(new Error('Offline'))).toBe('Offline');
  });
});
