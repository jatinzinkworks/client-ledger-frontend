import {
  CompanyRequestCompanyType as COMPANY_TYPE,
  type ClientRequest,
  type ClientResponse,
  type ClientSummaryResponse,
  type ClientUpdateRequest,
  type CompanyRequest,
  type CompanyResponse,
  type CompanyRequestCompanyType as CompanyType,
  type ManagerResponse,
} from '@cl/api';
import {
  createClientBodyCompaniesItemAddressMax as ADDRESS_MAX,
  createClientBodyCompaniesItemCompanyNameMax as COMPANY_NAME_MAX,
  createClientBodyCompaniesItemDiscountPercentMax as COMPANY_DISCOUNT_MAX,
  createClientBodyCompaniesMax as COMPANIES_MAX,
  createClientBodyDiscountPercentMax as DISCOUNT_MAX,
  createClientBodyEmailMax as EMAIL_MAX,
  createClientBodyFirstNameMax as FIRST_NAME_MAX,
  createClientBodyLastNameMax as LAST_NAME_MAX,
  createClientBodyPhoneMax as PHONE_MAX,
  createClientBodyPhoneRegExp as PHONE_PATTERN,
} from '@cl/api/zod';
import { z } from 'zod';

import { optionalPercent, requiredEmail, requiredPhone, requiredText } from './fields';
import { managerName, roleLabel } from './managers';

// Lengths, the phone pattern and the company limit come from the generated OpenAPI schema.
// Every field is mandatory on the backend and a client needs at least one company — rules
// OpenAPI cannot express (@NotBlank, @NotEmpty), so they are added here. The client discount
// is optional: left blank it is omitted and the backend stores zero. Its companies take it
// unless they set their own (company discounts are not on the form yet).

export type { CompanyType };

export const COMPANY_TYPES = Object.values(COMPANY_TYPE);

export const COMPANY_TYPE_LABELS: Readonly<Record<CompanyType, string>> = {
  PRIVATE_LIMITED: 'Private Limited',
  PUBLIC_LIMITED: 'Public Limited',
  LLP: 'LLP',
  PARTNERSHIP: 'Partnership',
  PROPRIETORSHIP: 'Proprietorship',
  TRUST: 'Trust',
  HUF: 'HUF',
  INDIVIDUAL: 'Individual',
};

export const COMPANY_TYPE_OPTIONS = COMPANY_TYPES.map((value) => ({ value, label: COMPANY_TYPE_LABELS[value] }));

/** Most companies the backend accepts on one client. */
export const MAX_COMPANIES = COMPANIES_MAX;

export const companyFormSchema = z.object({
  companyName: requiredText(COMPANY_NAME_MAX, 'Enter The Company Name.'),
  companyType: z.enum(COMPANY_TYPES, 'Choose A Company Type.'),
  address: requiredText(ADDRESS_MAX, 'Enter The Registered Address.'),
  /** Optional: left blank, the company takes the client's discount. */
  discountPercent: optionalPercent(COMPANY_DISCOUNT_MAX, `Enter A Discount From 0 To ${COMPANY_DISCOUNT_MAX}%.`),
});

/** The client's own details — what Edit Client changes. */
export const clientDetailsSchema = z.object({
  firstName: requiredText(FIRST_NAME_MAX, 'Enter The First Name.'),
  lastName: requiredText(LAST_NAME_MAX, 'Enter The Last Name.'),
  phone: requiredPhone(PHONE_MAX, PHONE_PATTERN),
  email: requiredEmail(EMAIL_MAX),
  managerId: z.string().min(1, 'Choose A Manager.'),
  discountPercent: optionalPercent(DISCOUNT_MAX, `Enter A Discount From 0 To ${DISCOUNT_MAX}%.`),
});

/** Onboarding: the client's details plus at least one company. */
export const clientFormSchema = clientDetailsSchema.extend({
  companies: z
    .array(companyFormSchema)
    .min(1, 'Add At Least One Company.')
    .max(COMPANIES_MAX, `A Client Can Hold Up To ${COMPANIES_MAX} Companies.`),
});

/**
 * Add Company: one company for an existing client. Held as a one-item `companies` array so the
 * form reuses the onboarding company block.
 */
export const addCompanyFormSchema = z.object({
  companies: z.array(companyFormSchema).length(1),
});

export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormValues = z.output<typeof companyFormSchema>;
export type AddCompanyFormInput = z.input<typeof addCompanyFormSchema>;
export type AddCompanyFormValues = z.output<typeof addCompanyFormSchema>;
export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;
export type ClientDetailsInput = z.input<typeof clientDetailsSchema>;
export type ClientDetailsValues = z.output<typeof clientDetailsSchema>;
export type ClientField = Exclude<keyof ClientFormInput, 'companies'>;
export type CompanyField = keyof CompanyFormInput;

interface FieldCopy {
  label: string;
  placeholder?: string;
  hint?: string;
}

/** Labels, placeholders and hints for the client fields, rendered identically by both apps. */
export const CLIENT_FIELDS: Readonly<Record<ClientField, FieldCopy>> = {
  firstName: { label: 'First Name' },
  lastName: { label: 'Last Name' },
  phone: { label: 'Phone', placeholder: '+91 98xxx Xxxxx' },
  email: { label: 'Email', placeholder: 'name@company.com' },
  managerId: {
    label: 'Manager Assigned',
    placeholder: 'Select A Manager',
    hint: "The Manager Handles All Of This Client's Companies.",
  },
  discountPercent: {
    label: 'Discount % (Optional)',
    hint: "Applied To This Client's Companies.",
  },
};

/**
 * The discount hint when editing. Companies already held keep their own discount; only
 * companies added later without one take the client's.
 */
export const EDIT_DISCOUNT_HINT = 'Companies Added From Now On Start With This Discount. Existing Companies Keep Theirs.';

export const COMPANY_FIELDS: Readonly<Record<CompanyField, FieldCopy>> = {
  companyName: { label: 'Company Name', placeholder: 'Registered Name' },
  companyType: { label: 'Company Type' },
  address: { label: 'Address', placeholder: 'Registered Office Address' },
  discountPercent: { label: 'Company Discount % (Optional)', hint: "Leave Blank To Use The Client's Discount." },
};

export const emptyCompany = (): CompanyFormInput => ({
  companyName: '',
  companyType: COMPANY_TYPE.PRIVATE_LIMITED,
  address: '',
  discountPercent: '',
});

/**
 * Edit Company's starting values: the company as stored. The discount is shown even when it is
 * zero, because clearing it means "take the client's discount" rather than "no discount".
 */
export const companyFormDefaults = (company: CompanyResponse): CompanyFormInput => ({
  companyName: company.companyName ?? '',
  companyType: company.companyType ?? COMPANY_TYPE.PRIVATE_LIMITED,
  address: company.address ?? '',
  discountPercent: company.discountPercent != null ? String(company.discountPercent) : '',
});

/** A blank onboarding form: one company, since every client needs at least one. */
export const clientFormDefaults = (): ClientFormInput => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  managerId: '',
  discountPercent: '',
  companies: [emptyCompany()],
});

const filled = (v: unknown) => typeof v === 'string' && v.trim() !== '';

const DETAIL_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'managerId'] as const;

/** Whether a company block has its name, type and address filled in. */
export const isCompanyComplete = (c: Partial<CompanyFormInput> | undefined) =>
  [c?.companyName, c?.companyType, c?.address].every(filled);

/** Whether every company block is filled in (and there is at least one). */
export const areCompaniesComplete = (companies: readonly (Partial<CompanyFormInput> | undefined)[] = []) =>
  companies.length > 0 && companies.every(isCompanyComplete);

/** Whether every mandatory client detail has something in it (the discount is optional). */
export const isClientDetailsComplete = (values: Partial<ClientDetailsInput>) =>
  DETAIL_FIELDS.every((field) => filled(values[field]));

/** Form values as a watcher sees them mid-edit: any field, including any company's, may be unset. */
type PartialClientForm = Partial<Omit<ClientFormInput, 'companies'>> & {
  companies?: readonly (Partial<CompanyFormInput> | undefined)[];
};

/**
 * Whether every mandatory field has something in it — the client's details, a manager and at
 * least one company with all of its fields. The discount is optional and ignored. This only
 * gates the Onboard button; format checks (email, phone) still run on submit.
 */
export function isClientFormComplete(values: PartialClientForm): boolean {
  return isClientDetailsComplete(values) && areCompaniesComplete(values.companies);
}

/** The request body for a parsed form; a blank discount is omitted rather than sent. */
export const toClientRequest = ({ companies, discountPercent, ...client }: ClientFormValues): ClientRequest => ({
  ...client,
  ...(discountPercent !== undefined && { discountPercent }),
  companies: companies.map(toCompanyRequest),
});

/** Edit Client's starting values: the client as stored. A zero discount shows as blank. */
export const clientDetailsDefaults = (client: ClientResponse): ClientDetailsInput => ({
  firstName: client.firstName ?? '',
  lastName: client.lastName ?? '',
  phone: client.phone ?? '',
  email: client.email ?? '',
  managerId: client.managerId ?? '',
  discountPercent: client.discountPercent ? String(client.discountPercent) : '',
});

/**
 * The PUT body for Edit Client: the client's own fields. The endpoint leaves companies as they
 * are (they have their own add / delete endpoints). A blank discount is omitted, which the
 * backend stores as zero.
 */
export const toClientUpdateRequest = ({ discountPercent, ...details }: ClientDetailsValues): ClientUpdateRequest => ({
  ...details,
  ...(discountPercent !== undefined && { discountPercent }),
});

/**
 * The request body for one company. A blank discount is omitted, so the backend gives the
 * company the client's discount.
 */
export const toCompanyRequest = ({ discountPercent, ...company }: CompanyFormValues): CompanyRequest => ({
  ...company,
  ...(discountPercent !== undefined && { discountPercent }),
});

/** How many more companies a client may hold (the backend allows at most MAX_COMPANIES). */
export const companiesLeft = (held: number) => Math.max(0, MAX_COMPANIES - held);

/** The Add Company sheet title. */
export const addCompanyTitle = (client: Pick<ClientResponse, 'firstName' | 'lastName'>) =>
  `Add Company For ${clientName(client)}`;

/** Refused with 409 when the client already holds MAX_COMPANIES. */
export const TOO_MANY_COMPANIES = `A Client Can Hold Up To ${COMPANIES_MAX} Companies.`;

/** Why a company's delete is unavailable: a client must keep at least one. */
export const LAST_COMPANY_REASON = "A Client Must Keep At Least One Company. Delete The Client Instead.";

/** Why the backend refuses (409) to delete a company: services are still assigned to it. */
export const DELETE_COMPANY_IN_USE = 'This Company Still Has Services. Remove Those Services First.';

/** The Delete Company warning. */
export const DELETE_COMPANY_WARNING = 'The Company Is Removed From This Client. This Cannot Be Undone.';

/**
 * The form field a backend validation error refers to, as a react-hook-form path:
 * "companies[0].address" becomes "companies.0.address". Unknown fields return undefined.
 */
export function clientFieldFromApi(path: string): string | undefined {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  const [head, index, field] = normalized.split('.');
  if (head === 'companies' && index !== undefined && field && field in COMPANY_FIELDS) return normalized;
  return head in CLIENT_FIELDS && index === undefined ? head : undefined;
}

/**
 * Select options for the managers a client can be assigned to: "Neha Kulkarni", or with
 * `withRole` "Neha Kulkarni · Senior Manager" (the assignment forms).
 */
export const managerOptions = (managers: readonly ManagerResponse[], { withRole = false } = {}) =>
  managers
    .filter((m) => m.id)
    .map((m) => ({ value: m.id!, label: [managerName(m), withRole && roleLabel(m.role)].filter(Boolean).join(' · ') }));

// ── Display ─────────────────────────────────────────────────────────────────────────────

export const clientName = (c: Pick<ClientSummaryResponse, 'firstName' | 'lastName'>) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ');

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "5 Clients · 10 Companies" — the list eyebrow. */
export function clientCountLabel(clients: readonly Pick<ClientSummaryResponse, 'companyNames'>[]) {
  const companies = clients.reduce((sum, c) => sum + (c.companyNames?.length ?? 0), 0);
  return `${plural(clients.length, 'Client', 'Clients')} · ${plural(companies, 'Company', 'Companies')}`;
}

/** The Delete Client warning: the client goes, and every company with them. */
export function deleteClientWarning(client: Pick<ClientResponse, 'companies'>): string {
  const count = client.companies?.length ?? 0;
  const companies = count === 1 ? 'Their Company Is' : `All ${count} Of Their Companies Are`;
  return `${companies} Deleted Too. This Cannot Be Undone.`;
}

/** Why the backend refuses (409): services are still assigned to one of the companies. */
export const DELETE_CLIENT_IN_USE = "This Client's Companies Still Have Services. Remove Those Services First.";

/** The manager filter's "everyone" value. */
export const ALL_MANAGERS = 'ALL';

/** Manager filter options for the client list: everyone, then each manager by name. */
export const managerFilterOptions = (managers: readonly ManagerResponse[]) => [
  { value: ALL_MANAGERS, label: 'All Managers' },
  ...managerOptions(managers),
];

/**
 * Clients matching the search — case-insensitive on the client's name, email or any of their
 * company names — and, unless `managerId` is ALL_MANAGERS, looked after by that manager.
 */
export function filterClients<T extends ClientSummaryResponse>(
  clients: readonly T[],
  query: string,
  managerId: string = ALL_MANAGERS,
): T[] {
  const q = query.trim().toLowerCase();
  return clients.filter(
    (c) =>
      (managerId === ALL_MANAGERS || c.managerId === managerId) &&
      (!q || [clientName(c), c.email ?? '', ...(c.companyNames ?? [])].some((text) => text.toLowerCase().includes(q))),
  );
}

// ── Client page ─────────────────────────────────────────────────────────────────────────

const percent = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** "No Discount" / "10% Discount" for the client header. */
export const discountLabel = (rate: number | undefined) => (rate ? `${percent.format(rate)}% Discount` : 'No Discount');

/** A company's discount for the table: "5%", or "—" when it has none. */
export const companyDiscountLabel = (rate: number | undefined) => (rate ? `${percent.format(rate)}%` : '—');

export const companyTypeLabel = (type: CompanyType | undefined) => (type ? COMPANY_TYPE_LABELS[type] : '');

const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

/** "Client Since Oct 2026", from when the client was added; empty when unknown. */
export const clientSinceLabel = (createdAt: string | undefined) => {
  const date = createdAt ? new Date(createdAt) : undefined;
  return date && !Number.isNaN(date.getTime()) ? `Client Since ${monthYear.format(date)}` : '';
};
