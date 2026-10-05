import {
  CompanyRequestCompanyType as COMPANY_TYPE,
  type ClientRequest,
  type ClientSummaryResponse,
  type CompanyRequestCompanyType as CompanyType,
  type ManagerResponse,
} from '@cl/api';
import {
  createClientBodyCompaniesItemAddressMax as ADDRESS_MAX,
  createClientBodyCompaniesItemCompanyNameMax as COMPANY_NAME_MAX,
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
import { managerName } from './managers';

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
});

export const clientFormSchema = z.object({
  firstName: requiredText(FIRST_NAME_MAX, 'Enter The First Name.'),
  lastName: requiredText(LAST_NAME_MAX, 'Enter The Last Name.'),
  phone: requiredPhone(PHONE_MAX, PHONE_PATTERN),
  email: requiredEmail(EMAIL_MAX),
  managerId: z.string().min(1, 'Choose A Manager.'),
  discountPercent: optionalPercent(DISCOUNT_MAX, `Enter A Discount From 0 To ${DISCOUNT_MAX}%.`),
  companies: z
    .array(companyFormSchema)
    .min(1, 'Add At Least One Company.')
    .max(COMPANIES_MAX, `A Client Can Hold Up To ${COMPANIES_MAX} Companies.`),
});

export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;
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

export const COMPANY_FIELDS: Readonly<Record<CompanyField, FieldCopy>> = {
  companyName: { label: 'Company Name', placeholder: 'Registered Name' },
  companyType: { label: 'Company Type' },
  address: { label: 'Address', placeholder: 'Registered Office Address' },
};

export const emptyCompany = (): CompanyFormInput => ({ companyName: '', companyType: COMPANY_TYPE.PRIVATE_LIMITED, address: '' });

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

/**
 * Whether every mandatory field has something in it — the client's details, a manager and at
 * least one company with all of its fields. The discount is optional and ignored. This only
 * gates the Onboard button; format checks (email, phone) still run on submit.
 */
/** Form values as a watcher sees them mid-edit: any field, including any company's, may be unset. */
type PartialClientForm = Partial<Omit<ClientFormInput, 'companies'>> & {
  companies?: readonly (Partial<CompanyFormInput> | undefined)[];
};

export function isClientFormComplete(values: PartialClientForm): boolean {
  const { firstName, lastName, phone, email, managerId, companies = [] } = values;
  return (
    [firstName, lastName, phone, email, managerId].every(filled) &&
    companies.length > 0 &&
    companies.every((c) => [c?.companyName, c?.companyType, c?.address].every(filled))
  );
}

/** The request body for a parsed form; a blank discount is omitted rather than sent. */
export const toClientRequest = ({ companies, discountPercent, ...client }: ClientFormValues): ClientRequest => ({
  ...client,
  ...(discountPercent !== undefined && { discountPercent }),
  companies: companies.map((company) => ({ ...company })),
});

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

/** Select options for the managers a client can be assigned to. */
export const managerOptions = (managers: readonly ManagerResponse[]) =>
  managers.filter((m) => m.id).map((m) => ({ value: m.id!, label: managerName(m) }));

// ── Display ─────────────────────────────────────────────────────────────────────────────

export const clientName = (c: Pick<ClientSummaryResponse, 'firstName' | 'lastName'>) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ');

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "5 Clients · 10 Companies" — the list eyebrow. */
export function clientCountLabel(clients: readonly Pick<ClientSummaryResponse, 'companyNames'>[]) {
  const companies = clients.reduce((sum, c) => sum + (c.companyNames?.length ?? 0), 0);
  return `${plural(clients.length, 'Client', 'Clients')} · ${plural(companies, 'Company', 'Companies')}`;
}

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
