import { describe, expect, it } from 'vitest';

import {
  DELETE_OPENING_BALANCE_WARNING,
  isServiceCharge,
  ledgerEntryTitle,
  openingBalanceDetail,
  generatedEntriesMessage,
  ledgerEntryCountLabel,
  ledgerEntryDefaults,
  ledgerEntryFieldFromApi,
  ledgerEntryFormSchema,
  ledgerEntryName,
  ledgerExportFileName,
  ledgerSummaryCards,
  accountStatus,
  clientSummaryCards,
  receivedShareLabel,
  deleteEntryWarning,
  isPayment,
  DELETE_PAYMENT_WARNING,
  noLedgerEntries,
  pageRangeLabel,
  toLedgerEntryUpdateRequest,
} from './ledger';

describe('ledger copy', () => {
  it('counts entries', () => {
    expect(ledgerEntryCountLabel(1)).toBe('1 Entry');
    expect(ledgerEntryCountLabel(12)).toBe('12 Entries');
  });

  it('reports what generating did', () => {
    expect(generatedEntriesMessage(3)).toBe('3 Entries Generated.');
    expect(generatedEntriesMessage(1)).toBe('1 Entry Generated.');
    expect(generatedEntriesMessage(0)).toBe('Nothing Is Due Yet, So No New Entries Were Generated.');
  });

  it('says when a financial year has no entries', () => {
    expect(noLedgerEntries('2026-27')).toBe(
      'No Ledger Entries In FY 2026–27. Generate Service Entries To Bill The Services That Are Due.',
    );
    expect(noLedgerEntries()).toBe('No Ledger Entries Yet. Generate Service Entries To Bill The Services That Are Due.');
  });

  it('describes the page shown', () => {
    expect(pageRangeLabel(0, 20, 132)).toBe('Showing 1–20 Of 132');
    expect(pageRangeLabel(6, 20, 132)).toBe('Showing 121–132 Of 132');
    expect(pageRangeLabel(0, 20, 0)).toBe('No Entries');
  });
});

describe('editing a ledger entry', () => {
  const entry = { serviceName: 'GST Return Filing', dueDate: '2026-10-07', serviceFee: 5000, discountPercent: 0, gstRatePercent: 18 };
  const issues = (input: Record<string, string>) => {
    const result = ledgerEntryFormSchema.safeParse({ serviceFee: '5000', discountPercent: '5', gstRatePercent: '18', ...input });
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };

  it('starts from the stored rates, showing a 0% discount', () => {
    expect(ledgerEntryDefaults(entry)).toEqual({ serviceFee: '5000', discountPercent: '0', gstRatePercent: '18' });
  });

  it('needs every rate, within bounds and to the paisa', () => {
    expect(issues({})).toEqual([]);
    expect(issues({ serviceFee: '' })).toEqual(['Enter The Service Fee.']);
    expect(issues({ serviceFee: '-1' })).toEqual(['Enter The Service Fee.']);
    expect(issues({ discountPercent: '101' })).toEqual(['Enter A Discount From 0 To 100%.']);
    expect(issues({ gstRatePercent: '' })).toEqual(['Choose A GST Rate.']);
    expect(issues({ serviceFee: '10.555' })).toEqual(['Use At Most 2 Decimal Places.']);
  });

  it('sends the three rates as numbers', () => {
    const values = ledgerEntryFormSchema.parse({ serviceFee: '4500.5', discountPercent: '10', gstRatePercent: '12' });
    expect(toLedgerEntryUpdateRequest(values)).toEqual({ serviceFee: 4500.5, discountPercent: 10, gstRatePercent: 12 });
  });

  it('names the entry by service and due date, and maps field errors', () => {
    expect(ledgerEntryName(entry)).toBe('GST Return Filing · Due 7 Oct 2026');
    expect(ledgerEntryName({ entryType: 'PAYMENT', dueDate: '2026-09-27' })).toBe('Payment · 27 Sep 2026');
    expect(ledgerEntryFieldFromApi('gstRatePercent')).toBe('gstRatePercent');
    expect(ledgerEntryFieldFromApi('dueDate')).toBeUndefined();
  });
});

describe('payments in the ledger', () => {
  it('tells payments from service charges', () => {
    expect(isPayment({ entryType: 'PAYMENT' })).toBe(true);
    expect(isPayment({ entryType: 'SERVICE_CHARGE' })).toBe(false);
    expect(deleteEntryWarning({ entryType: 'PAYMENT' })).toBe(DELETE_PAYMENT_WARNING);
  });
});

describe('year summary cards', () => {
  it('shows billed, received, pending, last payment and the discount amount', () => {
    const cards = ledgerSummaryCards(
      {
        totalBilled: 127000,
        totalPaymentReceived: 68000,
        pending: 52650,
        totalDiscount: 6350,
        lastPayment: { date: '2026-08-28', amount: 30000 },
      },
      '2026-27',
    );
    expect(cards).toEqual([
      { label: 'Billed', value: '₹1,27,000', tone: 'default' },
      { label: 'Received', value: '₹68,000', tone: 'positive' },
      { label: 'Pending', value: '₹52,650', tone: 'negative' },
      { label: 'Last Payment', value: '28 Aug 2026', note: '₹30,000', tone: 'default' },
      { label: 'Discount', value: '₹6,350', note: 'Given In FY 2026–27', tone: 'positive' },
    ]);
  });

  it('shows zeros and no last payment for a quiet year, and an overpaid year plainly', () => {
    const cards = ledgerSummaryCards({ pending: -500 }, '2025-26');
    expect(cards[0].value).toBe('₹0');
    expect(cards[2]).toEqual({ label: 'Pending', value: '-₹500', tone: 'default' });
    expect(cards[3]).toEqual({ label: 'Last Payment', value: '—', note: 'None In FY 2025–26', tone: 'default' });
  });
});

describe('client summary cards', () => {
  it("shows the client's billed (with services), received (with its share), pending and discount amount", () => {
    const cards = clientSummaryCards(
      { totalBilled: 184500, totalPaymentReceived: 80000, pending: 98150, totalDiscount: 6350 },
      '2026-27',
      17,
    );
    expect(cards).toEqual([
      { label: 'Billed', value: '₹1,84,500', note: '17 Services', tone: 'default' },
      { label: 'Received', value: '₹80,000', note: '43% Of Billed', tone: 'positive' },
      { label: 'Pending', value: '₹98,150', tone: 'negative' },
      { label: 'Discount', value: '₹6,350', note: 'Given In FY 2026–27', tone: 'positive' },
    ]);
  });

  it('leaves out notes it cannot work out', () => {
    expect(receivedShareLabel(0, 500)).toBeUndefined();
    const cards = clientSummaryCards({}, '2026-27');
    expect(cards[0]).toEqual({ label: 'Billed', value: '₹0', tone: 'default' });
    expect(cards[1]).toEqual({ label: 'Received', value: '₹0', tone: 'positive' });
  });
});

describe('account status', () => {
  it('is Overdue while pending, Settled at zero, In Credit when overpaid', () => {
    expect(accountStatus(52650)).toBe('OVERDUE');
    expect(accountStatus(0)).toBe('SETTLED');
    expect(accountStatus(-500)).toBe('IN_CREDIT');
    expect(accountStatus(undefined)).toBeUndefined();
  });
});

describe('ledgerExportFileName', () => {
  it('names the workbook after the client and the year, like the backend', () => {
    expect(ledgerExportFileName('Rohan Mehta', '2026-27')).toBe('Rohan_Mehta_Ledger_FY2026-27.xlsx');
  });

  it('drops characters a file name should not carry', () => {
    expect(ledgerExportFileName(" D'Souza / Sons ", '2025-26')).toBe('D_Souza_Sons_Ledger_FY2025-26.xlsx');
    expect(ledgerExportFileName('', '2025-26')).toBe('Client_Ledger_FY2025-26.xlsx');
  });
});

describe('opening balance entries', () => {
  const opening = { entryType: 'OPENING_BALANCE', dueDate: '2026-03-31', totalAmount: -5000 } as const;

  it('is named and described as an opening balance, not a service charge', () => {
    expect(isServiceCharge(opening)).toBe(false);
    expect(ledgerEntryTitle(opening)).toBe('Opening Balance');
    expect(ledgerEntryName(opening)).toBe('Opening Balance · As Of 31 Mar 2026');
    expect(openingBalanceDetail(opening)).toMatch(/^In Credit, /);
    expect(deleteEntryWarning(opening)).toBe(DELETE_OPENING_BALANCE_WARNING);
  });
});
