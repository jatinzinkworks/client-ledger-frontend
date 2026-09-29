import { describe, expect, it } from 'vitest';

import {
  firmDetailsFormDefaults,
  firmDetailsFormSchema,
  toFirmDetailsRequest,
  type FirmDetailsFormInput,
} from './firmDetails';

const valid: FirmDetailsFormInput = {
  firmName: 'Pranay Singhal & Company',
  gstin: '27AAKFP4471M1ZS',
  firmRegistrationNo: 'FRN 0148290W',
  email: 'accounts@pranaysinghal.in',
  phone: '+91 22 4012 8890',
  address: '302, Hubtown Solaris, N.S. Phadke Marg, Andheri East, Mumbai 400069',
};

function issuesFor(input: FirmDetailsFormInput) {
  const result = firmDetailsFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('firmDetailsFormSchema', () => {
  it('accepts the documented example', () => {
    expect(issuesFor(valid)).toEqual({});
  });

  it('trims values and upper-cases the GSTIN', () => {
    const parsed = firmDetailsFormSchema.parse({ ...valid, firmName: '  Acme  ', gstin: ' 27aakfp4471m1zs ' });
    expect(parsed.firmName).toBe('Acme');
    expect(parsed.gstin).toBe('27AAKFP4471M1ZS');
  });

  it('requires firm name, GSTIN and address', () => {
    expect(issuesFor({ ...valid, firmName: '   ', gstin: '', address: '' })).toEqual({
      firmName: 'Enter The Firm Name.',
      gstin: 'Enter The GSTIN.',
      address: 'Enter The Firm Address.',
    });
  });

  it('rejects a malformed GSTIN', () => {
    expect(issuesFor({ ...valid, gstin: '27AAKFP4471M1Z' })).toEqual({ gstin: 'Enter A Valid 15-Character GSTIN.' });
  });

  it('validates email and phone only when filled in', () => {
    expect(issuesFor({ ...valid, email: '', phone: '' })).toEqual({});
    expect(issuesFor({ ...valid, email: 'not-an-email' })).toHaveProperty('email');
    expect(issuesFor({ ...valid, phone: 'call me' })).toHaveProperty('phone');
  });

  it('enforces the backend length limits', () => {
    expect(issuesFor({ ...valid, firmRegistrationNo: 'x'.repeat(51) })).toEqual({
      firmRegistrationNo: 'Must Not Exceed 50 Characters.',
    });
  });
});

describe('firmDetailsFormDefaults', () => {
  it('starts blank when nothing is stored', () => {
    expect(Object.values(firmDetailsFormDefaults())).toEqual(['', '', '', '', '', '']);
  });
});

describe('toFirmDetailsRequest', () => {
  it('omits blank optional fields', () => {
    const values = firmDetailsFormSchema.parse({ ...valid, firmRegistrationNo: '', phone: ' ' });
    expect(toFirmDetailsRequest(values)).toEqual({
      firmName: valid.firmName,
      gstin: valid.gstin,
      email: valid.email,
      address: valid.address,
    });
  });
});
