import { useClientImport } from '@cl/api'
import { CLIENT_IMPORT_COPY, clientImportSummary } from '@cl/schemas'

import { WorkbookImportForm } from '@/components/WorkbookImportForm'

/** Import Clients (with their companies), in the Clients page's side sheet. */
export function ImportClientsForm() {
  return <WorkbookImportForm copy={CLIENT_IMPORT_COPY} io={useClientImport()} summarize={clientImportSummary} />
}
