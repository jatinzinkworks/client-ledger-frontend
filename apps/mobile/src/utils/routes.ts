// Links to the client, company and ledger screens (expo-router typed hrefs). Build every link
// here, so screens agree on the route shapes. expo-router encodes params, so ids go in raw.

export const clientsHref = '/clients' as const;
export const newClientHref = '/client/new' as const;
export const importClientsHref = '/client/import' as const;

export const clientHref = (clientId: string) => ({ pathname: '/client/[clientId]', params: { clientId } }) as const;

export const editClientHref = (clientId: string) =>
  ({ pathname: '/client/[clientId]/edit', params: { clientId } }) as const;

export const newCompanyHref = (clientId: string) =>
  ({ pathname: '/client/[clientId]/company/new', params: { clientId } }) as const;

export const companyHref = (clientId: string, companyId: string) =>
  ({ pathname: '/client/[clientId]/company/[companyId]', params: { clientId, companyId } }) as const;

export const editCompanyHref = (clientId: string, companyId: string) =>
  ({ pathname: '/client/[clientId]/company/[companyId]/edit', params: { clientId, companyId } }) as const;

export const newAssignmentHref = (clientId: string, companyId: string) =>
  ({ pathname: '/client/[clientId]/company/[companyId]/service/new', params: { clientId, companyId } }) as const;

export const assignmentHref = (clientId: string, companyId: string, assignmentId: string) =>
  ({
    pathname: '/client/[clientId]/company/[companyId]/service/[assignmentId]',
    params: { clientId, companyId, assignmentId },
  }) as const;

/** A ledger entry: a service charge opens its rates, a payment opens Edit Payment. */
export const ledgerEntryHref = (clientId: string, companyId: string, entryId: string) =>
  ({
    pathname: '/client/[clientId]/company/[companyId]/entry/[entryId]',
    params: { clientId, companyId, entryId },
  }) as const;

/** Record Payment; with a company it is fixed, without one the screen offers a Company choice. */
export const recordPaymentHref = (clientId: string, companyId?: string) =>
  ({ pathname: '/client/[clientId]/payment', params: companyId ? { clientId, companyId } : { clientId } }) as const;

export const adjustPricesHref = '/service/adjust' as const;
export const importServicesHref = '/service/import' as const;
export const reassignClientsHref = '/manager/reassign' as const;
