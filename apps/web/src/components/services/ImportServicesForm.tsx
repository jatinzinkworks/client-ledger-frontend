import { useServiceImport } from '@cl/api'
import { SERVICE_IMPORT_COPY, serviceImportSummary } from '@cl/schemas'

import { WorkbookImportForm } from '@/components/WorkbookImportForm'

/** Import Services, in the Services page's side sheet. */
export function ImportServicesForm() {
  return <WorkbookImportForm copy={SERVICE_IMPORT_COPY} io={useServiceImport()} summarize={serviceImportSummary} />
}
