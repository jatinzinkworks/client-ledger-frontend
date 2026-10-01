import { describe, expect, it } from 'vitest';

import {
  managerCountLabel,
  managerFieldFromApi,
  managerFormDefaults,
  managerFormSchema,
  managerInitials,
  managerName,
  roleLabel,
  toManagerRequest,
  type ManagerFormInput,
} from './managers';

const valid: ManagerFormInput = {
  firstName: 'Neha',
  lastName: 'Kulkarni',
  email: 'neha@pranaysinghal.in',
  role: 'SENIOR_MANAGER',
  mobileNumber: '+91 98201 55610',
};

function issuesFor(input: ManagerFormInput) {
  const result = managerFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('managerFormSchema', () => {
  it('accepts a complete manager and trims the text', () => {
    const parsed = managerFormSchema.parse({ ...valid, firstName: '  Neha ' });
    expect(toManagerRequest(parsed)).toEqual(valid);
  });

  it('requires every field', () => {
    const issues = issuesFor({ firstName: ' ', lastName: '', email: '', role: 'MANAGER', mobileNumber: '' });
    expect(issues).toMatchObject({
      firstName: 'Enter The First Name.',
      lastName: 'Enter The Last Name.',
      email: 'Enter The Email Address.',
      mobileNumber: 'Enter The Mobile Number.',
    });
  });

  it('rejects a malformed email and phone number', () => {
    expect(issuesFor({ ...valid, email: 'neha@' })).toHaveProperty('email', 'Enter A Valid Email Address.');
    expect(issuesFor({ ...valid, mobileNumber: '98-ab' })).toHaveProperty('mobileNumber');
  });
});

describe('managerFormDefaults', () => {
  it('starts a new manager blank, as an Associate', () => {
    expect(managerFormDefaults()).toEqual({ firstName: '', lastName: '', email: '', role: 'ASSOCIATE', mobileNumber: '' });
  });

  it('loads a stored manager', () => {
    expect(managerFormDefaults({ id: 'm-1', ...valid })).toEqual(valid);
  });
});

describe('display helpers', () => {
  it('formats names, initials, roles and counts', () => {
    expect(managerName(valid)).toBe('Neha Kulkarni');
    expect(managerInitials({ firstName: 'arjun', lastName: 'Iyer' })).toBe('AI');
    expect(roleLabel('SENIOR_MANAGER')).toBe('Senior Manager');
    expect(managerCountLabel(1)).toBe('1 Manager');
    expect(managerCountLabel(4)).toBe('4 Managers');
  });

  it('maps backend field errors onto form fields', () => {
    expect(managerFieldFromApi('mobileNumber')).toBe('mobileNumber');
    expect(managerFieldFromApi('salary')).toBeUndefined();
  });
});
