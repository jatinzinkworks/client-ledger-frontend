import { useClientImport } from '@cl/api';
import { CLIENT_IMPORT_COPY, clientImportSummary } from '@cl/schemas';

import { WorkbookImportScreen } from '@/components/WorkbookImportScreen';
import { clientsHref } from '@/utils/routes';

/** Import Clients (with their companies), full screen over the Clients tab. */
export function ImportClientsScreen() {
  return (
    <WorkbookImportScreen
      copy={CLIENT_IMPORT_COPY}
      io={useClientImport()}
      summarize={clientImportSummary}
      fallbackHref={clientsHref}
    />
  );
}
