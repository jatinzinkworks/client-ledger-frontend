// Public surface of @cl/api. Everything under ./generated is produced by orval from
// openapi.json — regenerate with `pnpm api:generate`, never edit it by hand.
export * from './generated';
export * from './generated/model';
export { ApiError, apiDownload, apiFetch, configureApi, fileNameFrom, type ApiConfig, type DownloadedFile } from './fetcher';
export { errorMessage, fieldErrors, isNotFound } from './errors';

// Hand-written hooks composing the generated ones — shared screen logic for both apps.
export { useClient } from './hooks/useClient';
export { useClientLedgerExport, useCompanyLedgerExport } from './hooks/useLedgerExport';
export { useClientLedgerSummary } from './hooks/useClientLedgerSummary';
export { useClientPayments } from './hooks/useClientPayments';
export { useCompany } from './hooks/useCompany';
export { LEDGER_PAGE_SIZE, useCompanyLedger } from './hooks/useCompanyLedger';
export { useClients } from './hooks/useClients';
export { useFirmDetails } from './hooks/useFirmDetails';
export { useManagerCatalog } from './hooks/useManagerCatalog';
export { usePaymentTerms } from './hooks/usePaymentTerms';
export { useServiceCatalog } from './hooks/useServiceCatalog';
