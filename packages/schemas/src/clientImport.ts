import type { ClientImportResponse } from '@cl/api';

import { CLIENT_ID_LABEL } from './clients';
import { companyCountLabel } from './overview';
import type { ImportCopy, ImportSummary } from './workbookImport';

// Import Clients (Clients screen): GET /clients/import/template, POST /clients/import. Rows are
// matched by Client ID: a new one creates the client with the companies the Companies sheet links
// to it; one already on file adds those companies to that client and leaves its details alone.
// Managers are named by their full name. Services are assigned afterwards as usual.

export const IMPORT_CLIENTS_LABEL = 'Import Clients';

export const CLIENT_IMPORT_COPY: ImportCopy = {
  title: IMPORT_CLIENTS_LABEL,
  description: 'Add many clients and their companies from an Excel workbook',
  steps: {
    template: {
      title: '1. Download The Template',
      body:
        `One Row Per Client On The Clients Sheet, And One Per Company On The Companies Sheet, Linked By ${CLIENT_ID_LABEL} (Such As PSC-00042). ` +
        'Name Each Manager By Their Full Name. Companies Can Bring An Opening Balance. The Instructions Sheet Explains Every Column.',
    },
    upload: {
      title: '2. Import The Filled-In Workbook',
      body:
        `Up To 500 Clients At Once. A ${CLIENT_ID_LABEL} Already On File Adds Its Companies To That Client, Keeping Their Details; ` +
        'A Client Can Hold Up To 50 Companies. If Any Cell Is Wrong, Nothing Is Imported And Each Cell At Fault Is Listed. ' +
        'Importing The Same Workbook Again Does Not Add Its Clients Twice, But Does Add Their Companies Again.',
    },
  },
  templateFileName: 'Client_Import_Template.xlsx',
};

const clientsLabel = (count: number) => `${count} ${count === 1 ? 'Client' : 'Clients'}`;

/**
 * The result heading: "2 Clients And 3 Companies Imported" when every client was new;
 * "3 Companies Added To 1 Existing Client" when none was; otherwise
 * "5 Companies Imported For 2 New Clients And 1 Existing Client".
 */
export function importedClientsTitle(created: number, companies: number, existing = 0): string {
  if (!existing) return `${clientsLabel(created)} And ${companyCountLabel(companies)} Imported`;
  const existingLabel = `${existing} Existing ${existing === 1 ? 'Client' : 'Clients'}`;
  if (!created) return `${companyCountLabel(companies)} Added To ${existingLabel}`;
  return `${companyCountLabel(companies)} Imported For ${created} New ${created === 1 ? 'Client' : 'Clients'} And ${existingLabel}`;
}

/** Marks a client already on file, which the import only added companies to. */
export const EXISTING_CLIENT_NOTE = 'Existing Client';

/**
 * What an import did, for its result: a line per client, created or already on file, with their
 * Client ID and how many companies were added ("PSC-00001 · 2 Companies · Existing Client").
 */
export const clientImportSummary = (r: ClientImportResponse): ImportSummary => {
  const clients = r.clients ?? [];
  const existing = r.existingClientCount ?? clients.filter((c) => c.created === false).length;
  return {
    title: importedClientsTitle(
      r.clientCount ?? clients.length - existing,
      r.companyCount ?? clients.reduce((sum, c) => sum + (c.companyCount ?? 0), 0),
      existing,
    ),
    items: clients.map((c, i) => ({
      key: c.id ?? String(i),
      name: c.clientName ?? '',
      detail: [c.clientId, companyCountLabel(c.companyCount), c.created === false && EXISTING_CLIENT_NOTE]
        .filter(Boolean)
        .join(' · '),
    })),
  };
};
