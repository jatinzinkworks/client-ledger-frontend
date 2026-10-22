import { useMutation } from '@tanstack/react-query';

import { apiDownload, type DownloadedFile } from '../fetcher';
import { getExportClientUrl, getExportCompanyUrl } from '../generated/ledger/ledger';
import {
  getDownloadClientLedgerSummaryPdfUrl,
  getDownloadLedgerSummaryPdfUrl,
} from '../generated/notifications/notifications';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF = 'application/pdf';

/** A ledger file download for a client or company page; saving or sharing it is left to each app. */
export interface LedgerFileDownload {
  /** The file for a financial year and the backend's name for it. */
  exportLedger: (financialYear: string) => Promise<DownloadedFile>;
  exporting: boolean;
  error: Error | null;
  clearError: () => void;
}

/** Downloads a file from the URL built for a financial year. */
function useLedgerFile(urlFor: (financialYear: string) => string, accept: string): LedgerFileDownload {
  const download = useMutation({ mutationFn: (financialYear: string) => apiDownload(urlFor(financialYear), accept) });
  return {
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
  useLedgerFile((financialYear) => getExportClientUrl(encodeURIComponent(clientId), { financialYear }), XLSX);

/**
 * One company's ledger for one financial year as an Excel workbook, laid out like the client's
 * (e.g. Mehta_Textiles_Pvt_Ltd_Ledger_FY2026-27.xlsx).
 */
export const useCompanyLedgerExport = (clientId: string, companyId: string) =>
  useLedgerFile(
    (financialYear) => getExportCompanyUrl(encodeURIComponent(clientId), encodeURIComponent(companyId), { financialYear }),
    XLSX,
  );

/**
 * A client's ledger summary for one financial year as a PDF, across all of their companies:
 * the statement the summary email attaches, without sending anything
 * (e.g. Rohan_Mehta_Ledger_FY2026-27.pdf).
 */
export const useClientLedgerPdf = (clientId: string) =>
  useLedgerFile(
    (financialYear) => getDownloadClientLedgerSummaryPdfUrl(encodeURIComponent(clientId), { financialYear }),
    PDF,
  );

/** One company's ledger summary for one financial year as a PDF, as its summary email attaches. */
export const useCompanyLedgerPdf = (clientId: string, companyId: string) =>
  useLedgerFile(
    (financialYear) =>
      getDownloadLedgerSummaryPdfUrl(encodeURIComponent(clientId), encodeURIComponent(companyId), { financialYear }),
    PDF,
  );
