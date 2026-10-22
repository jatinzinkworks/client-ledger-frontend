import type { DownloadedFile } from '@cl/api';
import { ledgerExportFileName, type LedgerFileFormat } from '@cl/schemas';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** The share sheet's file type per ledger file: Android reads the MIME type, iOS the UTI. */
const SHARE_TYPES: Readonly<Record<LedgerFileFormat, { mimeType: string; UTI: string }>> = {
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: 'org.openxmlformats.spreadsheetml.sheet' },
  pdf: { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' },
};

/** A blob's bytes as base64. React Native's Blob has no reliable arrayBuffer(), but FileReader works. */
const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could Not Read The File.'));
    // A data URL: "data:<type>;base64,<data>".
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });

/**
 * Hands a downloaded ledger file to the user: on a phone it is written to the app's cache and the
 * share sheet opens (save to Files, send by WhatsApp or email…); in the browser it downloads.
 */
export async function shareFile(blob: Blob, fileName: string, format: LedgerFileFormat = 'xlsx') {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(await toBase64(blob), { encoding: 'base64' });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing Is Not Available On This Device.');
  await Sharing.shareAsync(file.uri, { ...SHARE_TYPES[format], dialogTitle: fileName });
}

/**
 * Downloads the year's ledger file — the workbook (`useClientLedgerExport` / `useCompanyLedgerExport`)
 * or the PDF summary (`useClientLedgerPdf` / `useCompanyLedgerPdf`) — and shares it under the
 * backend's file name, or one built from `name` when it sends none.
 * A failed download is left in the hook's `error`; a failed share is thrown.
 */
export async function shareLedgerExport(
  exportLedger: (financialYear: string) => Promise<DownloadedFile>,
  name: string,
  financialYear: string,
  format: LedgerFileFormat = 'xlsx',
) {
  let file: DownloadedFile;
  try {
    file = await exportLedger(financialYear);
  } catch {
    return; // Held in the export hook's error.
  }
  await shareFile(file.blob, file.fileName ?? ledgerExportFileName(name, financialYear, format), format);
}
