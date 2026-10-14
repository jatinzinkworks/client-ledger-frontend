// Which level of the client hierarchy a detail screen shows — a client, or one of their
// companies — so both apps can mark it plainly above the name, without reading the breadcrumb.

export type PageLevel = 'client' | 'company';

export const PAGE_LEVEL_LABELS: Readonly<Record<PageLevel, string>> = {
  client: 'Client',
  company: 'Company',
};

/** "Of Rohan Mehta", beside the Company badge: whose company this is. */
export const companyOwnerLabel = (clientName: string) => `Of ${clientName}`;
