import type { DownloadedFile } from '@cl/api';
import { ledgerExportFileName } from '@cl/schemas';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
 * Hands a downloaded workbook to the user: on a phone it is written to the app's cache and the
 * share sheet opens (save to Files, send by WhatsApp or email…); in the browser it downloads.
 */
export async function shareFile(blob: Blob, fileName: string) {
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
  await Sharing.shareAsync(file.uri, { mimeType: XLSX, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: fileName });
}

/**
 * Downloads the year's ledger workbook (from `useClientLedgerExport` / `useCompanyLedgerExport`)
 * and shares it under the backend's file name, or one built from `name` when it sends none.
 * A failed download is left in the export hook's `error`; a failed share is thrown.
 */
export async function shareLedgerExport(
  exportLedger: (financialYear: string) => Promise<DownloadedFile>,
  name: string,
  financialYear: string,
) {
  let file: DownloadedFile;
  try {
    file = await exportLedger(financialYear);
  } catch {
    return; // Held in the export hook's error.
  }
  await shareFile(file.blob, file.fileName ?? ledgerExportFileName(name, financialYear));
}
