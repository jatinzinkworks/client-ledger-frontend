import { InvoiceScheduleMonth, type CatalogServiceResponse, type InvoiceSchedule } from './generated/model';

const MONTHS = Object.values(InvoiceScheduleMonth);

/**
 * The spec declares `invoiceSchedule.month` as a month name ("APRIL"), but the backend currently
 * serialises java.time.Month by number (4). Accept either and always hand the app the name, so
 * the rest of the code can trust the generated type. Unrecognised values become undefined.
 */
export function toMonthName(value: unknown): InvoiceScheduleMonth | undefined {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 1 && value <= 12 ? MONTHS[value - 1] : undefined;
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    return (MONTHS as string[]).includes(upper) ? (upper as InvoiceScheduleMonth) : undefined;
  }
  return undefined;
}

function normalizeSchedule(schedule: InvoiceSchedule | undefined): InvoiceSchedule | undefined {
  if (!schedule || schedule.month == null) return schedule;
  return { ...schedule, month: toMonthName(schedule.month) };
}

/** A catalog service as the app expects it, regardless of how the backend serialised the month. */
export function normalizeService(service: CatalogServiceResponse): CatalogServiceResponse {
  return { ...service, invoiceSchedule: normalizeSchedule(service.invoiceSchedule) };
}
