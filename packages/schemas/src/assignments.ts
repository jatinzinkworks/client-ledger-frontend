import type {
  CatalogServiceResponse,
  CompanyResponse,
  ServiceAssignmentRequest,
  ServiceAssignmentResponse,
  ServiceAssignmentUpdateRequest,
} from '@cl/api';
import {
  assignServiceBodyCommentMax as COMMENT_MAX,
  assignServiceBodyDiscountPercentMax as DISCOUNT_MAX,
} from '@cl/api/zod';
import { z } from 'zod';

import { optionalPercent, tooLong } from './fields';
import { parseApiDate } from './companies';
import { DEFAULT_GST_RATE, formatInr, upcomingInvoiceDates, type Option } from './services';

// Adding a catalog service to a company of a client (`POST …/companies/{companyId}/services`).
// The service and delivery date are mandatory. The fee is not sent: it is the catalog's
// standard fee. An omitted discount gives the service the company's, and a blank note is
// stored as none.

const percent = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

const API_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const assignServiceFormSchema = z.object({
  serviceId: z.string().min(1, 'Choose A Service.'),
  // `<input type="date">` yields "2026-10-15", or "" when blank / incomplete.
  deliveryDate: z.string().regex(API_DATE, 'Enter The Date Delivered.'),
  discountPercent: optionalPercent(DISCOUNT_MAX),
  comment: z.string().trim().max(COMMENT_MAX, tooLong(COMMENT_MAX)),
});

export type AssignServiceFormInput = z.input<typeof assignServiceFormSchema>;
export type AssignServiceFormValues = z.output<typeof assignServiceFormSchema>;
export type AssignServiceField = keyof AssignServiceFormInput;

export const ASSIGN_SERVICE_FIELDS: Readonly<Record<AssignServiceField, { label: string; placeholder?: string }>> = {
  serviceId: { label: 'Service', placeholder: 'Choose A Service' },
  deliveryDate: { label: 'Date Delivered' },
  discountPercent: { label: 'Discount % (Optional)' },
  comment: { label: 'Period Or Note (Optional)', placeholder: 'E.g. Aug 2026' },
};

/** Today as an API date ("2026-10-15") in the local calendar, not UTC. */
export function todayApiDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A blank form, delivered today. */
export const assignServiceDefaults = (now?: Date): AssignServiceFormInput => ({
  serviceId: '',
  deliveryDate: todayApiDate(now),
  discountPercent: '',
  comment: '',
});

/** Every mandatory field is filled — gates the submit button. */
export const isAssignServiceComplete = (v: Partial<AssignServiceFormInput>) => !!v.serviceId && !!v.deliveryDate;

/** Blank discount and note are omitted, so the backend applies the company's discount. */
export function toAssignServiceRequest(v: AssignServiceFormValues): ServiceAssignmentRequest {
  return {
    serviceId: v.serviceId,
    deliveryDate: v.deliveryDate,
    ...(v.discountPercent != null && { discountPercent: v.discountPercent }),
    ...(v.comment && { comment: v.comment }),
  };
}

/**
 * Edit Service starts from the stored values. An omitted discount would become the company's,
 * so the stored one is shown even when it is 0.
 */
export const serviceAssignmentDefaults = (a: ServiceAssignmentResponse): AssignServiceFormInput => ({
  serviceId: a.serviceId ?? '',
  deliveryDate: a.deliveryDate ?? '',
  discountPercent: a.discountPercent != null ? String(a.discountPercent) : '',
  comment: a.comment ?? '',
});

/**
 * The editable part of a delivered service: the service itself cannot change. A blank discount
 * is omitted (the company's applies) and a blank note is omitted, which clears the stored one.
 */
export function toServiceUpdateRequest(v: AssignServiceFormValues): ServiceAssignmentUpdateRequest {
  return {
    deliveryDate: v.deliveryDate,
    ...(v.discountPercent != null && { discountPercent: v.discountPercent }),
    ...(v.comment && { comment: v.comment }),
  };
}

/**
 * The catalog entry behind a delivered service, for its fee, billing badge and schedule. Falls
 * back to what the assignment itself carries while the catalog loads (no schedule then).
 */
export function assignedCatalogService(
  a: ServiceAssignmentResponse,
  catalog: readonly CatalogServiceResponse[],
): CatalogServiceResponse {
  return (
    catalog.find((s) => s.id === a.serviceId) ?? {
      id: a.serviceId,
      serviceName: a.serviceName,
      standardFee: a.serviceFee,
      gstRatePercent: a.gstRatePercent,
      billingFrequency: a.serviceType,
    }
  );
}

/** Maps a backend field error onto the form; an unknown service lands on the service field. */
export function assignServiceFieldFromApi(path: string): AssignServiceField | undefined {
  return path in ASSIGN_SERVICE_FIELDS ? (path as AssignServiceField) : undefined;
}

/** The Delete Service warning. */
export const DELETE_SERVICE_WARNING = 'The Service Is Removed From This Company. This Cannot Be Undone.';

/** The catalog as select options, by name. */
export const catalogServiceOptions = (services: readonly CatalogServiceResponse[]): Option[] =>
  services
    .filter((s): s is CatalogServiceResponse & { id: string } => !!s.id)
    .map((s) => ({ value: s.id, label: s.serviceName ?? '' }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const addServiceTitle = (company: Pick<CompanyResponse, 'companyName'>) =>
  `Add Service To ${company.companyName ?? 'Company'}`;

/** "18%" for a service's GST rate; a 0% rate shows as "0%", a missing one as "—". */
export const gstRateLabel = (rate: number | undefined) =>
  rate == null ? '—' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(rate)}%`;

/** "Standard Fee ₹3,500 · GST 18% Added On Invoice" beside the service's billing badge. */
export const standardFeeHint = (service: CatalogServiceResponse) =>
  [
    service.standardFee != null && `Standard Fee ${formatInr(service.standardFee)}`,
    `GST ${service.gstRatePercent ?? DEFAULT_GST_RATE}% Added On Invoice`,
  ]
    .filter(Boolean)
    .join(' · ');

/** What a blank discount means for this company. */
export const serviceDiscountHint = (company: Pick<CompanyResponse, 'companyName' | 'discountPercent'>) =>
  `Leave Blank To Use ${company.companyName ?? 'The Company'}'s Discount Of ${percent.format(company.discountPercent ?? 0)}%.`;

export interface ChargeBreakdown {
  fee: number;
  discount: number;
  /** After the discount, before GST. */
  net: number;
  gstRatePercent: number;
  gst: number;
  /** The net charge plus GST: what the invoice comes to. */
  total: number;
}

const toPaisa = (amount: number) => Math.round(amount * 100) / 100;

/**
 * Fee, discount, net charge, GST on the net charge, and the total with GST. The discount and GST
 * are each rounded to the paisa. A missing GST rate is the catalog default.
 */
export function chargeBreakdown(fee: number, discountPercent: number, gstRatePercent = DEFAULT_GST_RATE): ChargeBreakdown {
  const discount = Math.round(fee * discountPercent) / 100;
  const net = toPaisa(fee - discount);
  const gst = Math.round(net * gstRatePercent) / 100;
  return { fee, discount, net, gstRatePercent, gst, total: toPaisa(net + gst) };
}

/**
 * The discount the backend will apply: the one entered, else the company's. Undefined while the
 * entry is not a valid percentage, so the summary does not show a misleading figure.
 */
export function effectiveDiscount(entered: unknown, companyDiscount: number | undefined): number | undefined {
  const parsed = optionalPercent(DISCOUNT_MAX).safeParse(entered);
  if (!parsed.success) return undefined;
  return parsed.data ?? companyDiscount ?? 0;
}

/** How many upcoming due dates Add Service previews. */
export const DUE_DATES_SHOWN = 5;

/**
 * The service's upcoming due dates from the delivery date, as the backend schedules them: a
 * ONE_OFF service is due once, on its delivery date. Empty until the date is valid.
 */
export function upcomingDueDates(
  service: Pick<CatalogServiceResponse, 'billingFrequency' | 'invoiceSchedule'>,
  deliveryDate: string | undefined,
  count = DUE_DATES_SHOWN,
): Date[] {
  const from = parseApiDate(deliveryDate);
  if (!from) return [];
  if (service.billingFrequency === 'ONE_OFF') return [from];
  return upcomingInvoiceDates(service.billingFrequency, service.invoiceSchedule, from, count);
}
