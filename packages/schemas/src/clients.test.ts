import { describe, expect, it } from 'vitest';

import {
  ALL_MANAGERS,
  addCompanyTitle,
  areCompaniesComplete,
  clientCountLabel,
  companiesLeft,
  companyFormDefaults,
  companyFormSchema,
  toCompanyRequest,
  clientDetailsDefaults,
  deleteClientWarning,
  isClientDetailsComplete,
  toClientUpdateRequest,
  clientSinceLabel,
  companyDiscountLabel,
  discountLabel,
  managerFilterOptions,
  clientFieldFromApi,
  clientFormDefaults,
  clientFormSchema,
  clientName,
  filterClients,
  isClientFormComplete,
  managerOptions,
  toClientRequest,
  type ClientFormInput,
} from './clients';

const valid: ClientFormInput = {
  firstName: 'Rajesh',
  lastName: 'Mehta',
  phone: '+91 98200 12345',
  email: 'rajesh@mehtatextiles.in',
  managerId: 'e9b2c4d1-7f35-4a68-91c0-3d8a5e2f6b47',
  discountPercent: '',
  companies: [{ companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: '12 MG Road, Bengaluru' }],
};

function issuesFor(input: ClientFormInput) {
  const result = clientFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('clientFormSchema', () => {
  it('accepts a complete client and maps it to the request', () => {
    const parsed = clientFormSchema.parse({ ...valid, firstName: ' Rajesh ' });
    const { discountPercent: _blank, ...request } = valid;
    // A blank discount is left out of the request, so the backend stores zero.
    expect(toClientRequest(parsed)).toStrictEqual(request);
  });

  it('sends a discount when one is given', () => {
    expect(toClientRequest(clientFormSchema.parse({ ...valid, discountPercent: '12.5' })).discountPercent).toBe(12.5);
    expect(toClientRequest(clientFormSchema.parse({ ...valid, discountPercent: '0' })).discountPercent).toBe(0);
  });

  it('keeps the discount between 0 and 100 with at most 2 decimals', () => {
    expect(issuesFor({ ...valid, discountPercent: '101' })).toEqual({ discountPercent: 'Enter A Discount From 0 To 100%.' });
    expect(issuesFor({ ...valid, discountPercent: '-1' })).toEqual({ discountPercent: 'Enter A Discount From 0 To 100%.' });
    expect(issuesFor({ ...valid, discountPercent: '5.125' })).toEqual({ discountPercent: 'Use At Most 2 Decimal Places.' });
  });

  it('requires every field, including each company field', () => {
    expect(issuesFor({ ...clientFormDefaults() })).toEqual({
      firstName: 'Enter The First Name.',
      lastName: 'Enter The Last Name.',
      phone: 'Enter The Phone Number.',
      email: 'Enter The Email Address.',
      managerId: 'Choose A Manager.',
      'companies.0.companyName': 'Enter The Company Name.',
      'companies.0.address': 'Enter The Registered Address.',
    });
  });

  it('requires at least one company', () => {
    expect(issuesFor({ ...valid, companies: [] })).toEqual({ companies: 'Add At Least One Company.' });
  });

  it('rejects a malformed phone and email', () => {
    const issues = issuesFor({ ...valid, phone: '12', email: 'rajesh@' });
    expect(issues).toHaveProperty('phone');
    expect(issues).toHaveProperty('email', 'Enter A Valid Email Address.');
  });
});

describe('clientFormDefaults', () => {
  it('starts with one blank Private Limited company', () => {
    expect(clientFormDefaults().companies).toEqual([{ companyName: '', companyType: 'PRIVATE_LIMITED', address: '', discountPercent: '' }]);
  });
});

describe('isClientFormComplete', () => {
  it('needs every mandatory field filled, but not the discount', () => {
    expect(isClientFormComplete(valid)).toBe(true);
    expect(isClientFormComplete({ ...valid, discountPercent: '10' })).toBe(true);
    expect(isClientFormComplete(clientFormDefaults())).toBe(false);
    expect(isClientFormComplete({ ...valid, managerId: '' })).toBe(false);
    expect(isClientFormComplete({ ...valid, email: '   ' })).toBe(false);
  });

  it('needs at least one company, each fully filled in', () => {
    expect(isClientFormComplete({ ...valid, companies: [] })).toBe(false);
    expect(isClientFormComplete({ ...valid, companies: [...valid.companies, { companyName: 'Mehta Exports', companyType: 'LLP', address: '' }] })).toBe(false);
  });
});

describe('clientFieldFromApi', () => {
  it('maps backend paths onto form paths', () => {
    expect(clientFieldFromApi('email')).toBe('email');
    expect(clientFieldFromApi('companies[1].address')).toBe('companies.1.address');
    expect(clientFieldFromApi('companies[0].discountPercent')).toBe('companies.0.discountPercent');
    expect(clientFieldFromApi('companies[0].cin')).toBeUndefined();
    expect(clientFieldFromApi('discountPercent')).toBe('discountPercent');
  });
});

describe('display helpers', () => {
  const clients = [
    { firstName: 'Rajesh', lastName: 'Mehta', email: 'rajesh@mehtatextiles.in', managerId: 'm-1', companyNames: ['Mehta Textiles Pvt Ltd', 'Mehta Exports LLP'] },
    { firstName: 'Priya', lastName: 'Nair', email: 'priya@nairstudio.in', managerId: 'm-2', companyNames: ['Nair Design Studio LLP'] },
  ];

  it('counts clients and their companies', () => {
    expect(clientCountLabel(clients)).toBe('2 Clients · 3 Companies');
    expect(clientCountLabel(clients.slice(1))).toBe('1 Client · 1 Company');
  });

  it('searches names, emails and company names', () => {
    expect(filterClients(clients, 'exports').map(clientName)).toEqual(['Rajesh Mehta']);
    expect(filterClients(clients, 'NAIRSTUDIO').map(clientName)).toEqual(['Priya Nair']);
    expect(filterClients(clients, ' ')).toHaveLength(2);
  });

  it('narrows to one manager, alone or with the search', () => {
    expect(filterClients(clients, '', 'm-2').map(clientName)).toEqual(['Priya Nair']);
    expect(filterClients(clients, '', ALL_MANAGERS)).toHaveLength(2);
    expect(filterClients(clients, 'mehta', 'm-2')).toEqual([]);
    expect(managerFilterOptions([{ id: 'm-1', firstName: 'Neha', lastName: 'Kulkarni' }])).toEqual([
      { value: ALL_MANAGERS, label: 'All Managers' },
      { value: 'm-1', label: 'Neha Kulkarni' },
    ]);
  });

  it('labels discounts and client age for the client page', () => {
    expect(discountLabel(undefined)).toBe('No Discount');
    expect(discountLabel(0)).toBe('No Discount');
    expect(discountLabel(12.5)).toBe('12.5% Discount');
    expect(companyDiscountLabel(5)).toBe('5%');
    expect(companyDiscountLabel(0)).toBe('—');
    expect(clientSinceLabel('2026-10-04T10:15:30Z')).toBe('Client Since Oct 2026');
    expect(clientSinceLabel(undefined)).toBe('');
  });

  it('lists managers as select options by full name', () => {
    expect(managerOptions([{ id: 'm-1', firstName: 'Neha', lastName: 'Kulkarni' }, { firstName: 'No', lastName: 'Id' }])).toEqual([
      { value: 'm-1', label: 'Neha Kulkarni' },
    ]);
  });
});

describe('Edit Client', () => {
  const stored = {
    id: 'c-1',
    firstName: 'Rajesh',
    lastName: 'Mehta',
    phone: '+91 98200 41177',
    email: 'rajesh@mehtatextiles.in',
    managerId: 'm-1',
    discountPercent: 0,
    companies: [
      { id: 'co-1', companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED' as const, address: 'Plot 14, Mumbai', discountPercent: 5 },
      { id: 'co-2', companyName: 'Mehta Exports LLP', companyType: 'LLP' as const, address: 'Andheri, Mumbai', discountPercent: 0 },
    ],
  };

  it('starts from the stored client, showing a zero discount as blank', () => {
    expect(clientDetailsDefaults(stored)).toEqual({
      firstName: 'Rajesh',
      lastName: 'Mehta',
      phone: '+91 98200 41177',
      email: 'rajesh@mehtatextiles.in',
      managerId: 'm-1',
      discountPercent: '',
    });
    expect(clientDetailsDefaults({ ...stored, discountPercent: 7.5 }).discountPercent).toBe('7.5');
  });

  it("sends only the client's own fields", () => {
    const request = toClientUpdateRequest({
      firstName: 'Rajesh',
      lastName: 'Mehta',
      phone: '+91 98200 41177',
      email: 'r@mehta.in',
      managerId: 'm-2',
      discountPercent: 10,
    });
    expect(request).toStrictEqual({
      firstName: 'Rajesh',
      lastName: 'Mehta',
      phone: '+91 98200 41177',
      email: 'r@mehta.in',
      managerId: 'm-2',
      discountPercent: 10,
    });
  });

  it('omits a blank client discount', () => {
    const { discountPercent: _blank, ...details } = clientDetailsDefaults(stored);
    expect(toClientUpdateRequest({ ...details })).not.toHaveProperty('discountPercent');
  });

  it('needs every detail but the discount', () => {
    expect(isClientDetailsComplete(clientDetailsDefaults(stored))).toBe(true);
    expect(isClientDetailsComplete({ ...clientDetailsDefaults(stored), phone: ' ' })).toBe(false);
  });

  it('can label managers with their role', () => {
    expect(managerOptions([{ id: 'm-1', firstName: 'Neha', lastName: 'Kulkarni', role: 'SENIOR_MANAGER' }], { withRole: true })).toEqual([
      { value: 'm-1', label: 'Neha Kulkarni · Senior Manager' },
    ]);
  });

  it('warns that companies go with the client', () => {
    expect(deleteClientWarning(stored)).toBe('All 2 Of Their Companies Are Deleted Too. This Cannot Be Undone.');
    expect(deleteClientWarning({ companies: stored.companies.slice(0, 1) })).toBe('Their Company Is Deleted Too. This Cannot Be Undone.');
  });
});

describe('Add Company', () => {
  it('checks each company is filled in', () => {
    expect(areCompaniesComplete([{ companyName: 'Mehta Exports', companyType: 'LLP', address: '14 MG Road' }])).toBe(true);
    expect(areCompaniesComplete([{ companyName: 'Mehta Exports', companyType: 'LLP', address: ' ' }])).toBe(false);
    expect(areCompaniesComplete([])).toBe(false);
  });

  it('titles the sheet with the client', () => {
    expect(addCompanyTitle({ firstName: 'Rajesh', lastName: 'Mehta' })).toBe('Add Company For Rajesh Mehta');
  });

  it('caps companies at the backend limit', () => {
    expect(companiesLeft(1)).toBe(49);
    expect(companiesLeft(50)).toBe(0);
    expect(companiesLeft(60)).toBe(0);
  });

  it("sends a company's own discount, and omits a blank one so it takes the client's", () => {
    const company = { companyName: 'Mehta Exports', companyType: 'LLP' as const, address: '14 MG Road' };
    expect(toCompanyRequest(companyFormSchema.parse({ ...company, discountPercent: '5' }))).toEqual({ ...company, discountPercent: 5 });
    expect(toCompanyRequest(companyFormSchema.parse({ ...company, discountPercent: '' }))).toStrictEqual(company);
    expect(
      toClientRequest(clientFormSchema.parse({ ...valid, companies: [{ ...company, discountPercent: '7.5' }] })).companies,
    ).toEqual([{ ...company, discountPercent: 7.5 }]);
  });

  it('keeps a company discount between 0 and 100', () => {
    const issues = issuesFor({ ...valid, companies: [{ ...valid.companies[0], discountPercent: '120' }] });
    expect(issues).toEqual({ 'companies.0.discountPercent': 'Enter A Discount From 0 To 100%.' });
  });

  it('maps a company to its request', () => {
    expect(toCompanyRequest({ companyName: 'Mehta Exports', companyType: 'LLP', address: '14 MG Road' })).toEqual({
      companyName: 'Mehta Exports',
      companyType: 'LLP',
      address: '14 MG Road',
    });
  });
});

describe('Edit Company', () => {
  it('starts from the stored company, showing even a zero discount', () => {
    const stored = { id: 'co-1', companyName: 'Mehta Exports LLP', companyType: 'LLP' as const, address: 'Andheri', discountPercent: 0 };
    expect(companyFormDefaults(stored)).toEqual({
      companyName: 'Mehta Exports LLP',
      companyType: 'LLP',
      address: 'Andheri',
      discountPercent: '0',
    });
    expect(companyFormDefaults({ ...stored, discountPercent: undefined }).discountPercent).toBe('');
  });
});
