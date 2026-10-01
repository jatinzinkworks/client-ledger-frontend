import {
  ManagerRequestRole as ROLE,
  type ManagerRequest,
  type ManagerRequestRole as Role,
  type ManagerResponse,
} from '@cl/api';
import {
  createManagerBodyEmailMax as EMAIL_MAX,
  createManagerBodyFirstNameMax as FIRST_NAME_MAX,
  createManagerBodyLastNameMax as LAST_NAME_MAX,
  createManagerBodyMobileNumberMax as MOBILE_MAX,
  createManagerBodyMobileNumberRegExp as MOBILE_PATTERN,
} from '@cl/api/zod';
import { z } from 'zod';

// Lengths and the mobile pattern come from the generated OpenAPI schema. Every field is
// mandatory on the backend (@NotBlank / @NotNull), which OpenAPI cannot express as a minimum
// length, so the required checks are added here. Copy is Title Case to match the mocks.

export type { Role };

export const ROLES = Object.values(ROLE);

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  SENIOR_MANAGER: 'Senior Manager',
  MANAGER: 'Manager',
  ASSOCIATE: 'Associate',
};

export const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }));

const tooLong = (max: number) => `Must Not Exceed ${max} Characters.`;
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max));

export const managerFormSchema = z.object({
  firstName: required(FIRST_NAME_MAX, 'Enter The First Name.'),
  lastName: required(LAST_NAME_MAX, 'Enter The Last Name.'),
  email: required(EMAIL_MAX, 'Enter The Email Address.').pipe(z.email('Enter A Valid Email Address.')),
  role: z.enum(ROLES, 'Choose A Role.'),
  mobileNumber: required(MOBILE_MAX, 'Enter The Mobile Number.').regex(
    MOBILE_PATTERN,
    'Use 6 To 20 Digits, Spaces, Brackets Or Hyphens, With An Optional Leading +.',
  ),
});

export type ManagerFormInput = z.input<typeof managerFormSchema>;
export type ManagerFormValues = z.output<typeof managerFormSchema>;
export type ManagerField = keyof ManagerFormInput;

/** Field labels, rendered identically by both apps. */
export const MANAGER_FIELD_LABELS: Readonly<Record<ManagerField, string>> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  role: 'Role',
  mobileNumber: 'Phone',
};

/** Initial form values: the stored manager when editing, else blank as an Associate. */
export function managerFormDefaults(stored?: ManagerResponse): ManagerFormInput {
  return {
    firstName: stored?.firstName ?? '',
    lastName: stored?.lastName ?? '',
    email: stored?.email ?? '',
    role: stored?.role ?? ROLE.ASSOCIATE,
    mobileNumber: stored?.mobileNumber ?? '',
  };
}

/** The request body for a parsed form — every field is mandatory, so it maps one to one. */
export const toManagerRequest = (values: ManagerFormValues): ManagerRequest => ({ ...values });

/** The form field a backend validation error refers to, if it is one we render. */
export function managerFieldFromApi(path: string): ManagerField | undefined {
  return path in MANAGER_FIELD_LABELS ? (path as ManagerField) : undefined;
}

// ── Display ─────────────────────────────────────────────────────────────────────────────

type Named = Pick<ManagerResponse, 'firstName' | 'lastName'>;

export const managerName = (m: Named) => [m.firstName, m.lastName].filter(Boolean).join(' ');

/** "NK" for Neha Kulkarni — the avatar monogram. */
export const managerInitials = (m: Named) =>
  [m.firstName, m.lastName].map((part) => part?.trim().charAt(0) ?? '').join('').toUpperCase();

export const roleLabel = (role: Role | undefined) => (role ? ROLE_LABELS[role] : '');

export const managerCountLabel = (count: number) => `${count} ${count === 1 ? 'Manager' : 'Managers'}`;

