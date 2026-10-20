import type { ClientImportResponse } from '@cl/api';

import { companyCountLabel } from './overview';
import type { ImportCopy, ImportSummary } from './workbookImport';

// Import Clients (Clients screen): GET /clients/import/template, POST /clients/import. Each row
// of the Clients sheet is a client, linked by its Client Ref to rows of the Companies sheet;
// managers are named by their email. Services are assigned afterwards as usual.

export const IMPORT_CLIENTS_LABEL = 'Import Clients';

export const CLIENT_IMPORT_COPY: ImportCopy = {
  title: IMPORT_CLIENTS_LABEL,
  description: 'Add many clients and their companies from an Excel workbook',
  steps: {
    template: {
      title: '1. Download The Template',
      body:
        'One Row Per Client On The Clients Sheet, And One Per Company On The Companies Sheet, Linked By Client Ref. ' +
        'Name Each Manager By Their Email. The Instructions Sheet Explains Every Column.',
    },
    upload: {
      title: '2. Import The Filled-In Workbook',
      body:
        'Up To 500 Clients At Once, Each With 1 To 50 Companies. If Any Cell Is Wrong, Nothing Is Imported And Each Cell At Fault Is Listed. ' +
        'Clients Already On File Are Not Checked, So Importing The Same Workbook Twice Adds Them Twice.',
    },
  },
  templateFileName: 'Client_Import_Template.xlsx',
};

/** "2 Clients And 3 Companies Imported" — the result heading. */
export const importedClientsTitle = (clients: number, companies: number) =>
  `${clients} ${clients === 1 ? 'Client' : 'Clients'} And ${companyCountLabel(companies)} Imported`;

/** The clients an import created, for its result: each with its Client Ref and company count. */
export const clientImportSummary = (r: ClientImportResponse): ImportSummary => {
  const clients = r.clients ?? [];
  return {
    title: importedClientsTitle(
      r.clientCount ?? clients.length,
      r.companyCount ?? clients.reduce((sum, c) => sum + (c.companyCount ?? 0), 0),
    ),
    items: clients.map((c, i) => ({
      key: c.clientId ?? String(i),
      name: c.clientName ?? '',
      detail: [c.clientRef, companyCountLabel(c.companyCount)].filter(Boolean).join(' · '),
    })),
  };
};
