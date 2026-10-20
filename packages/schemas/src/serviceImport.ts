import type { CatalogServiceResponse, ServiceCatalogImportResponse } from '@cl/api';

import { categoryLabel, formatInr } from './services';
import type { ImportCopy, ImportSummary } from './workbookImport';

// Import Services (Services screen): GET /services/import/template, POST /services/import.

export const IMPORT_SERVICES_LABEL = 'Import Services';

export const SERVICE_IMPORT_COPY: ImportCopy = {
  title: IMPORT_SERVICES_LABEL,
  description: 'Add many services to the catalog from an Excel workbook',
  steps: {
    template: {
      title: '1. Download The Template',
      body: 'Fill In One Row Per Service. The Instructions Sheet Explains Every Column And Which Schedule Columns Each Billing Frequency Needs.',
    },
    upload: {
      title: '2. Import The Filled-In Workbook',
      body: 'Up To 500 Services At Once. If Any Cell Is Wrong, Nothing Is Imported And Each Cell At Fault Is Listed.',
    },
  },
  templateFileName: 'Service_Catalog_Import_Template.xlsx',
};

/** "3 Services Imported" — the result heading. */
export const importedTitle = (count: number) => `${count} ${count === 1 ? 'Service' : 'Services'} Imported`;

/** One imported service's line: "Compliance · ₹5,000". */
export const importedServiceDetail = (s: CatalogServiceResponse) =>
  [s.category ? categoryLabel(s.category) : '', s.standardFee != null ? formatInr(s.standardFee) : '']
    .filter(Boolean)
    .join(' · ');

/** The services an import created, for its result. */
export const serviceImportSummary = (r: ServiceCatalogImportResponse): ImportSummary => ({
  title: importedTitle(r.serviceCount ?? r.services?.length ?? 0),
  items: (r.services ?? []).map((s, i) => ({
    key: s.id ?? String(i),
    name: s.serviceName ?? '',
    detail: importedServiceDetail(s),
  })),
});
