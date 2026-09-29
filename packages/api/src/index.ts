// Public surface of @cl/api. Everything under ./generated is produced by orval from
// openapi.json — regenerate with `pnpm api:generate`, never edit it by hand.
export * from './generated';
export * from './generated/model';
export { ApiError, apiFetch, configureApi, type ApiConfig } from './fetcher';
export { errorMessage, fieldErrors, isNotFound } from './errors';

// Hand-written hooks composing the generated ones — shared screen logic for both apps.
export { useFirmDetails } from './hooks/useFirmDetails';
export { usePaymentTerms } from './hooks/usePaymentTerms';
