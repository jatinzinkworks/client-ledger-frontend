import type { DownloadedFile } from '@cl/api'
import { ledgerExportFileName, type LedgerFileFormat } from '@cl/schemas'

/** Hands a downloaded file to the browser to save, under the given name. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Revoke after the click has been handled, or some browsers cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Downloads the year's ledger file — the workbook (`useClientLedgerExport` / `useCompanyLedgerExport`)
 * or the PDF summary (`useClientLedgerPdf` / `useCompanyLedgerPdf`, with `format` 'pdf') — and
 * saves it under the backend's file name, or one built from `name` when it sends none.
 * A failure is left in the hook's `error`, for the page to show.
 */
export const saveLedgerExport =
  (
    exportLedger: (financialYear: string) => Promise<DownloadedFile>,
    name: string,
    financialYear: string,
    format: LedgerFileFormat = 'xlsx',
  ) =>
  async () => {
    try {
      const file = await exportLedger(financialYear)
      saveFile(file.blob, file.fileName ?? ledgerExportFileName(name, financialYear, format))
    } catch {
      // Held in the export hook's error.
    }
  }
