import type { FirmDetailsRequest, FirmDetailsResponse } from '@cl/api';
import {
  saveFirmDetailsBodyAddressMax as ADDRESS_MAX,
  saveFirmDetailsBodyEmailMax as EMAIL_MAX,
  saveFirmDetailsBodyFirmNameMax as FIRM_NAME_MAX,
  saveFirmDetailsBodyFirmRegistrationNoMax as REGISTRATION_NO_MAX,
  saveFirmDetailsBodyGstinRegExp as GSTIN_PATTERN,
  saveFirmDetailsBodyPhoneMax as PHONE_MAX,
  saveFirmDetailsBodyPhoneRegExp as PHONE_PATTERN,
} from '@cl/api/zod';
import { z } from 'zod';

// Lengths and patterns come from the generated OpenAPI schema, so they follow the backend's
// @Size / @Pattern rules. @NotBlank does not survive into OpenAPI as a minimum length, so the
// required fields add it here. The backend trims every value and stores blanks as "not set".

const tooLong = (max: number) => `Must Not Exceed ${max} Characters.`;
const text = (max: number) => z.string().trim().max(max, tooLong(max));
const required = (max: number, message: string) => text(max).min(1, message);
/** Optional free text that must match `test` when filled in; blank means "not set". */
const optional = (max: number, test: (v: string) => boolean, message: string) =>
  text(max).refine((v) => v === '' || test(v), message);

export const firmDetailsFormSchema = z.object({
  firmName: required(FIRM_NAME_MAX, 'Enter The Firm Name.'),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { message: 'Enter The GSTIN.', abort: true }) // a blank GSTIN is missing, not malformed
    .regex(GSTIN_PATTERN, 'Enter A Valid 15-Character GSTIN.'),
  firmRegistrationNo: text(REGISTRATION_NO_MAX),
  email: optional(EMAIL_MAX, (v) => z.email().safeParse(v).success, 'Enter A Valid Email Address.'),
  phone: optional(
    PHONE_MAX,
    (v) => PHONE_PATTERN.test(v),
    'Use Digits, Spaces, Brackets And Hyphens, With An Optional Leading +.',
  ),
  address: required(ADDRESS_MAX, 'Enter The Firm Address.'),
});

export type FirmDetailsFormInput = z.input<typeof firmDetailsFormSchema>;
export type FirmDetailsFormValues = z.output<typeof firmDetailsFormSchema>;
export type FirmDetailsField = keyof FirmDetailsFormInput;

/** Labels for the firm details fields, rendered identically by both apps. */
export const FIRM_DETAILS_FIELDS: Readonly<Record<FirmDetailsField, { label: string }>> = {
  firmName: { label: 'Firm Name' },
  gstin: { label: 'GSTIN' },
  firmRegistrationNo: { label: 'Firm Registration No.' },
  email: { label: 'Email' },
  phone: { label: 'Phone' },
  address: { label: 'Address' },
};

/** Section copy for the Firm Details settings card. */
export const FIRM_DETAILS_SECTION = {
  title: 'Firm Details',
  description: 'Printed On Invoices And Excel Exports.',
} as const;

/** Initial form values: the stored details when they exist, else blank. */
export function firmDetailsFormDefaults(stored?: FirmDetailsResponse): FirmDetailsFormInput {
  return {
    firmName: stored?.firmName ?? '',
    gstin: stored?.gstin ?? '',
    firmRegistrationNo: stored?.firmRegistrationNo ?? '',
    email: stored?.email ?? '',
    phone: stored?.phone ?? '',
    address: stored?.address ?? '',
  };
}

/**
 * The request body for a parsed form. The save replaces the record wholesale, so a blank
 * optional field is omitted (clearing it) rather than sent as "" — the backend's phone
 * pattern would reject an empty string.
 */
export function toFirmDetailsRequest(values: FirmDetailsFormValues): FirmDetailsRequest {
  const { firmName, gstin, address, ...optionalFields } = values;
  return {
    firmName,
    gstin,
    address,
    ...Object.fromEntries(Object.entries(optionalFields).filter(([, v]) => v !== '')),
  };
}
