import type { RankEntry } from '@cl/api';
import { describe, expect, it } from 'vitest';

import {
  ageingBucketLabel,
  bookCounts,
  changeVsPrevious,
  isFutureMonth,
  monthAxisLabel,
  monthlyMax,
  previousPeriodLabel,
  companiesPerClientLabel,
  groupPaymentsByDay,
  noRankingMessage,
  overviewEyebrow,
  overviewSummaryCards,
  paymentDayLabel,
  rankEntryNote,
  rankingMax,
  shareOf,
} from './overview';
import { formatInr } from './services';

const NOW = new Date(2026, 9, 14);
const overview = {
  totalBilled: 200000,
  totalPaymentReceived: 150000,
  pending: 50000,
  totalDiscount: 6000,
  totalClients: 4,
  totalCompanies: 10,
  totalServices: 30,
};
const entry = (over: Partial<RankEntry>): RankEntry => ({ id: 'x', rank: 1, name: 'X', billed: 0, received: 0, pending: 0, ...over });

describe('overview', () => {
  it('heads the page with the year and today', () => {
    expect(overviewEyebrow('2026-27', NOW)).toBe('FY 2026–27 · As Of 14 Oct 2026');
  });

  it('shows the year in four cards, pending red while owed', () => {
    const cards = overviewSummaryCards(overview, '2026-27');
    expect(cards.map((c) => c.label)).toEqual(['Billed', 'Received', 'Pending', 'Discount']);
    expect(cards[1]?.note).toBe('75% Of Billed');
    expect(cards[2]?.tone).toBe('negative');
    expect(overviewSummaryCards({ ...overview, pending: -10 }, '2026-27')[2]?.tone).toBe('default');
  });

  it('compares each figure with last year to date, coloured by whether the move is good', () => {
    const vs = previousPeriodLabel({ financialYear: '2025-26', toDate: '2025-10-14' });
    expect(vs).toBe('vs FY 2025–26 To Date');
    expect(previousPeriodLabel({ financialYear: '2025-26', toDate: '2026-03-31' })).toBe('vs FY 2025–26');
    expect(changeVsPrevious(112, 100, 'good', vs)).toEqual({ direction: 'up', label: '12% vs FY 2025–26 To Date', tone: 'positive' });
    expect(changeVsPrevious(112, 100, 'bad', vs)?.tone).toBe('negative');
    expect(changeVsPrevious(80, 100, 'bad', vs)?.tone).toBe('positive');
    expect(changeVsPrevious(80, 100, 'neutral', vs)?.tone).toBe('default');
    expect(changeVsPrevious(100, 100, 'good', vs)?.direction).toBe('flat');
    expect(changeVsPrevious(50, 0, 'good', vs)).toBeUndefined();
    const cards = overviewSummaryCards(
      { ...overview, previousToDate: { financialYear: '2025-26', toDate: '2025-10-14', totalBilled: 100000 } },
      '2026-27',
    );
    expect(cards[0]?.change?.label).toBe('100% vs FY 2025–26 To Date');
    expect(cards[1]?.change).toBeUndefined();
  });

  it('labels months and finds the largest monthly figure', () => {
    expect(monthAxisLabel('2026-04')).toBe('Apr');
    expect(monthlyMax([{ billed: 5, received: 9 }, { billed: 7 }])).toBe(9);
    expect(isFutureMonth('2026-11', NOW)).toBe(true);
    expect(isFutureMonth('2026-10', NOW)).toBe(false);
  });

  it('labels ageing ranges', () => {
    expect(ageingBucketLabel({ fromDays: 0, toDays: 30 })).toBe('0–30 Days');
    expect(ageingBucketLabel({ fromDays: 90 })).toBe('90+ Days');
    // The backend's label wins: its last range starts at 91 days but reads "90+".
    expect(ageingBucketLabel({ label: '90+', fromDays: 91 })).toBe('90+ Days');
    expect(ageingBucketLabel({ label: '31-60', fromDays: 31, toDays: 60 })).toBe('31–60 Days');
  });

  it('keeps shares between 0 and 1', () => {
    expect(shareOf(150, 200)).toBe(0.75);
    expect(shareOf(300, 200)).toBe(1);
    expect(shareOf(5, 0)).toBe(0);
  });

  it('counts the book', () => {
    expect(bookCounts(overview).map((c) => c.value)).toEqual([4, 10, 30]);
    expect(companiesPerClientLabel(overview)).toBe('2.5 Companies Per Client');
    expect(companiesPerClientLabel({})).toBeUndefined();
  });

  it('notes each ranked entry by who it is', () => {
    expect(rankEntryNote('clients', entry({ managerName: 'Pranay Singhal' }))).toBe('Manager: Pranay Singhal');
    expect(rankEntryNote('companies', entry({ clientName: 'Rohan Mehta' }))).toBe('Rohan Mehta');
    expect(rankEntryNote('managers', entry({ clientCount: 3 }))).toBe('3 Clients');
  });

  it('says when a ranking is empty, and finds its largest figure', () => {
    expect(noRankingMessage('pending', 'year', '2026-27')).toBe('Nobody Owes Anything In FY 2026–27.');
    expect(noRankingMessage('billed', 'all', '2026-27')).toBe('Nothing Was Billed.');
    expect(rankingMax([entry({ pending: 5, billed: 9 }), entry({ pending: 7, billed: 2 })], 'pending')).toBe(7);
    expect(rankingMax([], 'billed')).toBe(0);
  });

  it('groups payments by the day received', () => {
    expect(paymentDayLabel('2026-10-14', NOW)).toBe('Today');
    expect(paymentDayLabel('2026-10-13', NOW)).toBe('Yesterday');
    expect(paymentDayLabel('2026-10-01', NOW)).toBe('1 Oct 2026');
    const days = groupPaymentsByDay(
      [
        { paymentId: 'a', dateReceived: '2026-10-14', amount: 100 },
        { paymentId: 'b', dateReceived: '2026-10-14', amount: 50 },
        { paymentId: 'c', dateReceived: '2026-10-10', amount: 25 },
      ],
      NOW,
    );
    expect(days.map((d) => [d.label, formatInr(d.total), d.payments.length])).toEqual([
      ['Today', formatInr(150), 2],
      ['10 Oct 2026', formatInr(25), 1],
    ]);
  });
});
