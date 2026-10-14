import type {
  AgeingBucket,
  AgeingResponse,
  MonthlyTrend,
  OverviewResponse,
  PeriodTotals,
  RankEntry,
  RankMeasure,
  RankSubject,
  RecentPayment,
} from '@cl/api';

import { todayApiDate } from './assignments';
import { formatApiDate, parseApiDate } from './companies';
import { financialYearLabel } from './financialYears';
import { receivedShareLabel, type SummaryCard, type SummaryChange, type SummaryTone } from './ledger';
import { managerClientsLabel } from './managers';
import { formatInr } from './services';

// The Overview screen: the firm's position for a financial year, who owes and who was billed
// most, and the latest payments received.

/** "FY 2026–27 · As Of 14 Oct 2026" above the title. */
export const overviewEyebrow = (financialYear: string, now = new Date()) =>
  `${financialYearLabel(financialYear)} · As Of ${formatApiDate(todayApiDate(now))}`;

/** Whether a rise in a figure is good news (received), bad news (pending) or neither (discount). */
type RiseMeans = 'good' | 'bad' | 'neutral';

/** "vs FY 2025–26 To Date" while the period stops short of 31 March, "vs FY 2025–26" for a whole year. */
export function previousPeriodLabel(previous: PeriodTotals): string {
  const fy = previous.financialYear ? financialYearLabel(previous.financialYear) : 'Last Year';
  const end = parseApiDate(previous.toDate);
  const wholeYear = !end || (end.getMonth() === 2 && end.getDate() === 31);
  return `vs ${fy}${wholeYear ? '' : ' To Date'}`;
}

/**
 * How a figure moved against the same point last year: "12% vs FY 2025–26 To Date". None when
 * last year had nothing to compare with (a percentage of zero means nothing).
 */
export function changeVsPrevious(
  current: number | undefined,
  previous: number | undefined,
  riseMeans: RiseMeans,
  periodLabel: string,
): SummaryChange | undefined {
  if (!previous) return undefined;
  const ratio = ((current ?? 0) - previous) / Math.abs(previous);
  const percent = Math.round(Math.abs(ratio) * 100);
  if (percent === 0) return { direction: 'flat', label: `No Change ${periodLabel}`, tone: 'default' };
  const direction = ratio > 0 ? 'up' : 'down';
  let tone: SummaryTone = 'default';
  if (riseMeans !== 'neutral') tone = (direction === 'up') === (riseMeans === 'good') ? 'positive' : 'negative';
  return { direction, label: `${percent}% ${periodLabel}`, tone };
}

/**
 * Billed, Received, Pending and Discount across every client for one financial year, each
 * against last year to the same point when the backend gives it. Pending is the year's alone
 * (earlier years are not brought forward), red only while something is owed.
 */
export function overviewSummaryCards(o: OverviewResponse, financialYear: string): SummaryCard[] {
  const fy = financialYearLabel(financialYear);
  const amount = (value: number | undefined) => formatInr(value ?? 0);
  const prev = o.previousToDate;
  const vs = prev && previousPeriodLabel(prev);
  const change = (current: number | undefined, previous: number | undefined, riseMeans: RiseMeans) =>
    vs ? changeVsPrevious(current, previous, riseMeans, vs) : undefined;
  return [
    {
      label: 'Billed',
      value: amount(o.totalBilled),
      note: `Fell Due In ${fy}`,
      tone: 'default',
      change: change(o.totalBilled, prev?.totalBilled, 'good'),
    },
    {
      label: 'Received',
      value: amount(o.totalPaymentReceived),
      note: receivedShareLabel(o.totalBilled, o.totalPaymentReceived),
      tone: 'positive',
      change: change(o.totalPaymentReceived, prev?.totalPaymentReceived, 'good'),
    },
    {
      label: 'Pending',
      value: amount(o.pending),
      note: `Billed Less Received In ${fy}`,
      tone: (o.pending ?? 0) > 0 ? 'negative' : 'default',
      change: change(o.pending, prev?.pending, 'bad'),
    },
    {
      label: 'Discount',
      value: amount(o.totalDiscount),
      note: `Given In ${fy}`,
      tone: 'positive',
      change: change(o.totalDiscount, prev?.totalDiscount, 'neutral'),
    },
  ];
}

/** The share of `total` that `part` is, from 0 to 1; 0 when there is no total. */
export const shareOf = (part: number | undefined, total: number | undefined) =>
  total && total > 0 ? Math.min(Math.max((part ?? 0) / total, 0), 1) : 0;

/** "85%" — a share as a whole percentage. */
export const percentLabel = (share: number) => `${Math.round(share * 100)}%`;

export type BookCountKey = 'clients' | 'companies' | 'services';

/** The firm's book as it stands now: how many clients, companies and assigned services. */
export const bookCounts = (o: OverviewResponse): { key: BookCountKey; label: string; value: number }[] => [
  { key: 'clients', label: 'Clients', value: o.totalClients ?? 0 },
  { key: 'companies', label: 'Companies', value: o.totalCompanies ?? 0 },
  { key: 'services', label: 'Services Assigned', value: o.totalServices ?? 0 },
];

/** "2.4 Companies Per Client" — the book at a glance; none without clients. */
export function companiesPerClientLabel(o: OverviewResponse): string | undefined {
  if (!o.totalClients) return undefined;
  const ratio = (o.totalCompanies ?? 0) / o.totalClients;
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(ratio)} Companies Per Client`;
}

// ── Monthly trend ───────────────────────────────────────────────────────────────────────

const MONTH_SHORT = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const MONTH_LONG = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const monthDate = (month: string | undefined) => parseApiDate(month && `${month}-01`);

/** "Apr" for "2026-04", on the chart's axis. */
export const monthAxisLabel = (month: string | undefined) => {
  const date = monthDate(month);
  return date ? MONTH_SHORT.format(date) : '';
};

/** "April 2026" for "2026-04", in the chart's readout. */
export const monthTitle = (month: string | undefined) => {
  const date = monthDate(month);
  return date ? MONTH_LONG.format(date) : '';
};

/** The largest billed or received figure of the year, which the bars are drawn against. */
export const monthlyMax = (months: readonly MonthlyTrend[]) =>
  Math.max(0, ...months.flatMap((m) => [m.billed ?? 0, m.received ?? 0]));

/** The year's billed and received, summed over its months. */
export const monthlyTotals = (months: readonly MonthlyTrend[]) => ({
  billed: months.reduce((total, m) => total + (m.billed ?? 0), 0),
  received: months.reduce((total, m) => total + (m.received ?? 0), 0),
});

/** Whether a month is still to come; those are drawn faint, as they hold nothing so far. */
export const isFutureMonth = (month: string | undefined, now = new Date()) => {
  const date = monthDate(month);
  return !!date && date > new Date(now.getFullYear(), now.getMonth(), 1);
};

// ── Ageing ──────────────────────────────────────────────────────────────────────────────

/** "0–30 Days", "90+ Days": the backend's own label for the range, else built from its days. */
export function ageingBucketLabel(b: AgeingBucket): string {
  if (b.label) return `${b.label.replace('-', '–')} Days`;
  return b.toDays == null ? `${b.fromDays ?? 0}+ Days` : `${b.fromDays ?? 0}–${b.toDays} Days`;
}

/** "12 Companies" / "1 Company". */
export const companyCountLabel = (count: number | undefined) =>
  `${count ?? 0} ${count === 1 ? 'Company' : 'Companies'}`;

/** What "overdue" means in the ageing panel. */
export const ageingOverdueNote = (a: AgeingResponse) => `Due Over ${a.overdueAfterDays ?? 60} Days, Per Your Payment Terms`;

export const NO_AGEING = 'Nobody Owes Anything Right Now.';

// ── Rankings ────────────────────────────────────────────────────────────────────────────

/** Whether a ranking covers the selected financial year or every year to date. */
export type RankPeriod = 'year' | 'all';

export const RANK_SUBJECT_OPTIONS: readonly { value: RankSubject; label: string }[] = [
  { value: 'clients', label: 'Clients' },
  { value: 'companies', label: 'Companies' },
  { value: 'managers', label: 'Managers' },
];

export const rankPeriodOptions = (financialYear: string): { value: RankPeriod; label: string }[] => [
  { value: 'year', label: financialYearLabel(financialYear) },
  { value: 'all', label: 'All Years' },
];

export const RANKING_COPY: Readonly<Record<RankMeasure, { title: string; hint: string }>> = {
  pending: { title: 'Who Owes Most', hint: 'Billed Less Received, Highest First.' },
  billed: { title: 'Billed Most', hint: 'Billed After Discount, GST Included. Green Is Received.' },
};

/** The title of each Who Owes Most panel, one per subject. */
export const PENDING_RANKING_TITLES: Readonly<Record<RankSubject, string>> = {
  clients: 'Clients Owing Most',
  companies: 'Companies Owing Most',
  managers: 'Managers With Most Pending',
};

/** The line under a ranked name: a client's manager, a company's client, a manager's clients. */
export function rankEntryNote(subject: RankSubject, e: RankEntry): string {
  if (subject === 'clients') return e.managerName ? `Manager: ${e.managerName}` : '';
  if (subject === 'companies') return e.clientName ?? '';
  return managerClientsLabel(e.clientCount);
}

/** Said when a ranking lists nobody. */
export function noRankingMessage(measure: RankMeasure, period: RankPeriod, financialYear: string): string {
  const when = period === 'year' ? ` In ${financialYearLabel(financialYear)}` : '';
  return measure === 'pending' ? `Nobody Owes Anything${when}.` : `Nothing Was Billed${when}.`;
}

/** The ranking's largest figure, which the bars are drawn against. */
export const rankingMax = (entries: readonly RankEntry[], measure: RankMeasure) =>
  Math.max(0, ...entries.map((e) => (measure === 'pending' ? e.pending : e.billed)));

// ── Recent payments ─────────────────────────────────────────────────────────────────────

/** "Today", "Yesterday", or the date, for a payment's day. */
export function paymentDayLabel(dateReceived: string | undefined, now = new Date()): string {
  if (dateReceived === todayApiDate(now)) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dateReceived === todayApiDate(yesterday)) return 'Yesterday';
  return formatApiDate(dateReceived);
}

export interface PaymentDay {
  label: string;
  /** What came in that day. */
  total: number;
  payments: RecentPayment[];
}

/** The payments grouped by the day received, keeping their order (most recent first). */
export function groupPaymentsByDay(payments: readonly RecentPayment[], now = new Date()): PaymentDay[] {
  const days: PaymentDay[] = [];
  for (const payment of payments) {
    const label = paymentDayLabel(payment.dateReceived, now);
    const last = days[days.length - 1];
    if (last?.label === label) {
      last.payments.push(payment);
      last.total += payment.amount ?? 0;
    } else {
      days.push({ label, total: payment.amount ?? 0, payments: [payment] });
    }
  }
  return days;
}

/** "₹1,25,000 In The Last 20 Payments". */
export const recentPaymentsNote = (payments: readonly RecentPayment[]) =>
  `${formatInr(payments.reduce((total, p) => total + (p.amount ?? 0), 0))} In The Last ${payments.length} ${
    payments.length === 1 ? 'Payment' : 'Payments'
  }`;

export const NO_RECENT_PAYMENTS = 'No Payments Received Yet.';
