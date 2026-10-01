import {
  CatalogServiceRequestBillingFrequency as BILLING_FREQUENCY,
  CatalogServiceRequestCategory as CATEGORY,
  InvoiceScheduleMonth as MONTH,
  InvoiceScheduleMonthOfQuarter as MONTH_OF_QUARTER,
  type CatalogServiceRequest,
  type CatalogServiceRequestBillingFrequency as BillingFrequency,
  type CatalogServiceRequestCategory as Category,
  type CatalogServiceResponse,
  type InvoiceSchedule,
  type InvoiceScheduleMonth as Month,
  type InvoiceScheduleMonthOfQuarter as MonthOfQuarter,
} from '@cl/api';
import {
  createServiceBodyDescriptionMax as DESCRIPTION_MAX,
  createServiceBodyGstRatePercentMax as GST_MAX,
  createServiceBodyInvoiceScheduleDayOfMonthMax as DAY_MAX,
  createServiceBodyServiceNameMax as NAME_MAX,
} from '@cl/api/zod';
import { z } from 'zod';

// Lengths and bounds come from the generated OpenAPI schema. The schedule rules mirror the
// backend's @AssertTrue checks on CatalogServiceRequest: a recurring service needs a day of
// month, QUARTERLY also a month of quarter, ANNUAL also a month, and ONE_OFF no schedule.
// Copy is Title Case to match the product mocks.

export type { BillingFrequency, Category, Month, MonthOfQuarter };

export const CATEGORIES = Object.values(CATEGORY);
export const BILLING_FREQUENCIES = Object.values(BILLING_FREQUENCY);
export const MONTHS = Object.values(MONTH);
export const MONTHS_OF_QUARTER = Object.values(MONTH_OF_QUARTER);

export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  COMPLIANCE: 'Compliance',
  TAX: 'Tax',
  AUDIT: 'Audit',
  ACCOUNTING: 'Accounting',
  ADVISORY: 'Advisory',
};

export const BILLING_LABELS: Readonly<Record<BillingFrequency, string>> = {
  ONE_OFF: 'One-Off',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

export const MONTH_LABELS: Readonly<Record<Month, string>> = Object.fromEntries(
  MONTHS.map((m) => [m, m.charAt(0) + m.slice(1).toLowerCase()]),
) as Record<Month, string>;

export const MONTH_OF_QUARTER_LABELS: Readonly<Record<MonthOfQuarter, string>> = {
  FIRST_MONTH: '1st Month After Quarter',
  SECOND_MONTH: '2nd Month After Quarter',
  THIRD_MONTH: '3rd Month After Quarter',
};

/** Standard Indian GST slabs offered by the GST Rate select. */
export const GST_RATE_PRESETS: readonly number[] = [0, 5, 12, 18, 28];
export const DEFAULT_GST_RATE = 18;

/** Day 31 always lands on the last day of the month (shorter months fall back to their last day). */
const LAST_DAY = DAY_MAX;

const MAX_FEE = 9_999_999_999.99; // backend @Digits(integer = 10, fraction = 2)

export interface Option {
  value: string;
  label: string;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** "15th", or "Last Day" for 31. */
export const dayLabel = (day: number) => (day === LAST_DAY ? 'Last Day' : ordinal(day));

export const DAY_OPTIONS: readonly Option[] = Array.from({ length: DAY_MAX }, (_, i) => ({
  value: String(i + 1),
  label: dayLabel(i + 1),
}));

const optionsFrom = <T extends string>(labels: Readonly<Record<T, string>>): Option[] =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));

export const CATEGORY_OPTIONS = optionsFrom(CATEGORY_LABELS);
export const BILLING_OPTIONS = optionsFrom(BILLING_LABELS);
export const MONTH_OPTIONS = optionsFrom(MONTH_LABELS);
export const MONTH_OF_QUARTER_OPTIONS = optionsFrom(MONTH_OF_QUARTER_LABELS);

const formatRate = (rate: number) => `${Number(rate.toFixed(2))}%`;

/** GST Rate options: the standard slabs, plus a stored rate that is not one of them. */
export function gstRateOptions(current?: number): Option[] {
  const rates = current != null && !GST_RATE_PRESETS.includes(current) ? [...GST_RATE_PRESETS, current] : GST_RATE_PRESETS;
  return [...rates].sort((a, b) => a - b).map((r) => ({ value: String(r), label: formatRate(r) }));
}

// ── Form ────────────────────────────────────────────────────────────────────────────────

/** Blank text fields mean "not set"; everything else must be a finite number. */
const blankToUndefined = (v: unknown) => (v === '' || v == null ? undefined : typeof v === 'string' ? Number(v) : v);
const hasAtMostTwoDecimals = (n: number) => Math.round(n * 100) === n * 100;
const optionalEnum = <T extends string>(values: T[]) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values as [T, ...T[]]).optional());

export const serviceFormSchema = z
  .object({
    serviceName: z.string().trim().min(1, 'Enter The Service Name.').max(NAME_MAX, `Must Not Exceed ${NAME_MAX} Characters.`),
    description: z.string().trim().max(DESCRIPTION_MAX, `Must Not Exceed ${DESCRIPTION_MAX} Characters.`),
    category: z.enum(CATEGORIES as [Category, ...Category[]], { error: 'Choose A Category.' }),
    billingFrequency: z.enum(BILLING_FREQUENCIES as [BillingFrequency, ...BillingFrequency[]], {
      error: 'Choose How Often It Is Billed.',
    }),
    standardFee: z.preprocess(
      blankToUndefined,
      z
        .number({ error: 'Enter The Standard Fee.' })
        .min(0, 'Fee Cannot Be Negative.')
        .max(MAX_FEE, 'Fee Is Too Large.')
        .refine(hasAtMostTwoDecimals, 'Use At Most 2 Decimal Places.'),
    ),
    gstRatePercent: z.preprocess(
      blankToUndefined,
      z.number({ error: 'Choose A GST Rate.' }).min(0).max(GST_MAX).refine(hasAtMostTwoDecimals),
    ),
    dayOfMonth: z.preprocess(blankToUndefined, z.number().int().min(1).max(DAY_MAX).optional()),
    monthOfQuarter: optionalEnum(MONTHS_OF_QUARTER),
    month: optionalEnum(MONTHS),
  })
  .superRefine((v, ctx) => {
    const require = (path: 'dayOfMonth' | 'monthOfQuarter' | 'month', message: string) =>
      v[path] == null && ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.billingFrequency !== 'ONE_OFF') require('dayOfMonth', 'Choose The Invoice Day.');
    if (v.billingFrequency === 'QUARTERLY') require('monthOfQuarter', 'Choose The Invoice Month.');
    if (v.billingFrequency === 'ANNUAL') require('month', 'Choose The Invoice Month.');
  });

export type ServiceFormInput = z.input<typeof serviceFormSchema>;
export type ServiceFormValues = z.output<typeof serviceFormSchema>;
export type ServiceField = keyof ServiceFormInput;

export const SERVICE_FIELD_LABELS: Readonly<Record<ServiceField, string>> = {
  serviceName: 'Service Name',
  description: 'Description',
  category: 'Category',
  billingFrequency: 'Billing',
  standardFee: 'Standard Fee',
  gstRatePercent: 'GST Rate',
  dayOfMonth: 'Day',
  monthOfQuarter: 'Invoice Month',
  month: 'Invoice Month',
};

/** Initial form values: the stored service, or a new one in `category` billed monthly. */
export function serviceFormDefaults(stored?: CatalogServiceResponse, category: Category = 'COMPLIANCE'): ServiceFormInput {
  const schedule = stored?.invoiceSchedule;
  return {
    serviceName: stored?.serviceName ?? '',
    description: stored?.description ?? '',
    category: stored?.category ?? category,
    billingFrequency: stored?.billingFrequency ?? 'MONTHLY',
    standardFee: stored?.standardFee != null ? String(stored.standardFee) : '',
    gstRatePercent: String(stored?.gstRatePercent ?? DEFAULT_GST_RATE),
    dayOfMonth: schedule?.dayOfMonth != null ? String(schedule.dayOfMonth) : stored ? '' : '1',
    monthOfQuarter: schedule?.monthOfQuarter ?? '',
    month: schedule?.month ?? '',
  };
}

/** Sensible schedule picks when the billing frequency changes, so the user isn't left with blanks. */
export function scheduleDefaultsFor(billing: BillingFrequency): Pick<ServiceFormInput, 'monthOfQuarter' | 'month'> {
  return {
    monthOfQuarter: billing === 'QUARTERLY' ? 'FIRST_MONTH' : '',
    month: billing === 'ANNUAL' ? 'APRIL' : '',
  };
}

/** Only the schedule fields that apply to the billing frequency — the backend rejects the rest. */
function scheduleFor(v: Pick<ServiceFormValues, 'billingFrequency' | 'dayOfMonth' | 'monthOfQuarter' | 'month'>): InvoiceSchedule | undefined {
  switch (v.billingFrequency) {
    case 'ONE_OFF':
      return undefined;
    case 'MONTHLY':
      return { dayOfMonth: v.dayOfMonth };
    case 'QUARTERLY':
      return { dayOfMonth: v.dayOfMonth, monthOfQuarter: v.monthOfQuarter };
    case 'ANNUAL':
      return { dayOfMonth: v.dayOfMonth, month: v.month };
  }
}

/** The request body for a parsed form. Updates replace the record wholesale, so every field is sent. */
export function toServiceRequest(v: ServiceFormValues): CatalogServiceRequest {
  const invoiceSchedule = scheduleFor(v);
  return {
    serviceName: v.serviceName,
    ...(v.description ? { description: v.description } : {}),
    category: v.category,
    billingFrequency: v.billingFrequency,
    standardFee: v.standardFee,
    gstRatePercent: v.gstRatePercent,
    ...(invoiceSchedule ? { invoiceSchedule } : {}),
  };
}

/** Maps a backend field path ("invoiceSchedule.dayOfMonth") onto the form field it belongs to. */
export function serviceFieldFromApi(path: string): ServiceField | undefined {
  const field = path.split('.').pop() as ServiceField;
  return field in SERVICE_FIELD_LABELS ? field : undefined;
}

// ── Display ─────────────────────────────────────────────────────────────────────────────

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "₹3,500" / "₹1,65,000" — Indian digit grouping, paise only when present. */
export const formatInr = (amount: number) => inr.format(amount);

export const formatGst = (rate: number | undefined) => `+ GST ${formatRate(rate ?? DEFAULT_GST_RATE)}`;

export function usageLabel(companies: number | undefined): string {
  const n = companies ?? 0;
  if (n === 0) return 'Not Used Yet';
  return `${n} ${n === 1 ? 'Company' : 'Companies'}`;
}

const QUARTER_PHRASE: Readonly<Record<MonthOfQuarter, string>> = {
  FIRST_MONTH: 'Month After Each Quarter',
  SECOND_MONTH: 'Second Month After Each Quarter',
  THIRD_MONTH: 'Third Month After Each Quarter',
};

const shortMonth = (m: Month) => MONTH_LABELS[m].slice(0, 3);

/** The card's schedule line, e.g. "Invoiced 15th Oct Each Year". */
export function scheduleSummary(billing: BillingFrequency | undefined, schedule: InvoiceSchedule | undefined): string {
  const day = schedule?.dayOfMonth;
  if (billing === 'ONE_OFF' || billing == null) return 'Billed Once';
  if (day == null) return 'No Invoice Schedule';
  const isLast = day === LAST_DAY;
  switch (billing) {
    case 'MONTHLY':
      return `Invoiced ${dayLabel(day)} Of Each Month`;
    case 'QUARTERLY':
      return `Invoiced ${dayLabel(day)}, ${QUARTER_PHRASE[schedule?.monthOfQuarter ?? 'FIRST_MONTH']}`;
    case 'ANNUAL': {
      const month = schedule?.month;
      // Guard unknown values too — never let a display string take the screen down.
      if (!month || !MONTH_LABELS[month]) return 'Invoiced Once A Year';
      return isLast ? `Invoiced Last Day Of ${MONTH_LABELS[month]} Each Year` : `Invoiced ${ordinal(day)} ${shortMonth(month)} Each Year`;
    }
  }
}

/** Months (0–11) an invoice can fall in. Quarters close in Mar/Jun/Sep/Dec (Indian FY and calendar alike). */
function invoiceMonths(billing: BillingFrequency, schedule: InvoiceSchedule): number[] {
  switch (billing) {
    case 'MONTHLY':
      return Array.from({ length: 12 }, (_, i) => i);
    case 'QUARTERLY': {
      const offset = MONTHS_OF_QUARTER.indexOf(schedule.monthOfQuarter ?? 'FIRST_MONTH'); // 0, 1, 2
      return [0, 3, 6, 9].map((m) => m + offset); // FIRST → Jan/Apr/Jul/Oct, …
    }
    case 'ANNUAL':
      return schedule.month ? [MONTHS.indexOf(schedule.month)] : [];
    case 'ONE_OFF':
      return [];
  }
}

/**
 * The next date an invoice is raised on or after `from` (today by default), or undefined for
 * one-off billing or an incomplete schedule. A day past the month's end falls on its last day.
 */
export function nextInvoiceDate(
  billing: BillingFrequency | undefined,
  schedule: InvoiceSchedule | undefined,
  from: Date = new Date(),
): Date | undefined {
  const day = schedule?.dayOfMonth;
  if (!billing || !schedule || day == null) return undefined;
  const months = new Set(invoiceMonths(billing, schedule));
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 24; i++) {
    const year = start.getFullYear() + Math.floor((start.getMonth() + i) / 12);
    const month = (start.getMonth() + i) % 12;
    if (!months.has(month)) continue;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const date = new Date(year, month, Math.min(day, lastDay));
    if (date >= start) return date;
  }
  return undefined;
}

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (date: Date) => longDate.format(date);

// ── Listing ─────────────────────────────────────────────────────────────────────────────

export type CategoryFilter = Category | 'ALL';

export const CATEGORY_FILTERS: readonly Option[] = [{ value: 'ALL', label: 'All' }, ...CATEGORY_OPTIONS];

/** Services matching the search text (name, case-insensitive) and category filter. */
export function filterServices<T extends Pick<CatalogServiceResponse, 'serviceName' | 'category'>>(
  services: readonly T[],
  query: string,
  category: CategoryFilter,
): T[] {
  const q = query.trim().toLowerCase();
  return services.filter(
    (s) => (category === 'ALL' || s.category === category) && (!q || (s.serviceName ?? '').toLowerCase().includes(q)),
  );
}
