import { useServiceImport } from '@cl/api';
import { SERVICE_IMPORT_COPY, serviceImportSummary } from '@cl/schemas';

import { WorkbookImportScreen } from '@/components/WorkbookImportScreen';

/** Import Services, full screen over the Services tab. */
export function ImportServicesScreen() {
  return (
    <WorkbookImportScreen
      copy={SERVICE_IMPORT_COPY}
      io={useServiceImport()}
      summarize={serviceImportSummary}
      fallbackHref="/services"
    />
  );
}
