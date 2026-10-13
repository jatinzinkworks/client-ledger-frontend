import { useMutation } from '@tanstack/react-query';

import { apiDownload } from '../fetcher';
import { getExportClientUrl, getExportCompanyUrl } from '../generated/ledger/ledger';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Downloads a workbook from the URL built for a financial year; saving the file is left to each app. */
function useWorkbookDownload(urlFor: (financialYear: string) => string) {
  const download = useMutation({ mutationFn: (financialYear: string) => apiDownload(urlFor(financialYear), XLSX) });
  return {
    /** The workbook and the backend's file name for it. */
    exportLedger: download.mutateAsync,
    exporting: download.isPending,
    error: download.error,
    clearError: download.reset,
  };
}

// orval interpolates path params as-is, so the ids are encoded here.

/**
 * A client's ledger for one financial year as an Excel workbook, across all of their companies:
 * a Summary sheet and a Ledger sheet of every charge and payment of the year
 * (e.g. Rohan_Mehta_Ledger_FY2026-27.xlsx).
 */
export const useClientLedgerExport = (clientId: string) =>
  useWorkbookDownload((financialYear) => getExportClientUrl(encodeURIComponent(clientId), { financialYear }));

/**
 * One company's ledger for one financial year as an Excel workbook, laid out like the client's
 * (e.g. Mehta_Textiles_Pvt_Ltd_Ledger_FY2026-27.xlsx).
 */
export const useCompanyLedgerExport = (clientId: string, companyId: string) =>
  useWorkbookDownload((financialYear) =>
    getExportCompanyUrl(encodeURIComponent(clientId), encodeURIComponent(companyId), { financialYear }),
  );
