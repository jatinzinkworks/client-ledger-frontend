// Public surface of @cl/api. Everything under ./generated is produced by orval from
// openapi.json — regenerate with `pnpm api:generate`, never edit it by hand.
export * from './generated';
export * from './generated/model';
export { ApiError, apiDownload, apiFetch, configureApi, fileNameFrom, type ApiConfig, type DownloadedFile } from './fetcher';
export { errorMessage, fieldErrors, isNotFound } from './errors';

// Hand-written hooks composing the generated ones — shared screen logic for both apps.
export { useBirthdays } from './hooks/useBirthdays';
export { useClient } from './hooks/useClient';
export {
  useClientLedgerExport,
  useClientLedgerPdf,
  useCompanyLedgerExport,
  useCompanyLedgerPdf,
  type LedgerFileDownload,
} from './hooks/useLedgerExport';
export { useClientLedgerEmail, useCompanyLedgerEmail } from './hooks/useLedgerEmail';
export { useClientLedgerSummary } from './hooks/useClientLedgerSummary';
export { useClientPayments } from './hooks/useClientPayments';
export { useClientYearBalances } from './hooks/useClientYearBalances';
export { useCompany } from './hooks/useCompany';
export { LEDGER_PAGE_SIZE, useCompanyLedger } from './hooks/useCompanyLedger';
export { useClients } from './hooks/useClients';
export { useFirmDetails } from './hooks/useFirmDetails';
export { useManagerCatalog } from './hooks/useManagerCatalog';
export { useManagerClients } from './hooks/useManagerClients';
export { useReassignClients, type ReassignOutcome } from './hooks/useReassignClients';
export {
  CATEGORY_TOP_SERVICES,
  PENDING_RANKING_LIMITS,
  RANKING_LIMIT,
  RECENT_PAYMENTS_LIMIT,
  useBillingByCategory,
  useFirmOverview,
  useLatestPayments,
  useOverviewMonthly,
  useOverviewRanking,
  useReceivablesAgeing,
  useRefreshOverview,
  type RankEntry,
  type RankMeasure,
  type RankSubject,
} from './hooks/useOverview';
export { usePaymentTerms } from './hooks/usePaymentTerms';
export { useServiceCategories } from './hooks/useServiceCategories';
export { useServiceImport } from './hooks/useServiceImport';
export { useClientImport } from './hooks/useClientImport';
export { useWorkbookImport, type WorkbookImport, type WorkbookUpload } from './hooks/useWorkbookImport';
export { useServiceCatalog } from './hooks/useServiceCatalog';
