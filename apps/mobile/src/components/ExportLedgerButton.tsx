import { errorMessage, type LedgerFileDownload } from '@cl/api';
import { LEDGER_FILE_COPY, type LedgerFileFormat } from '@cl/schemas';
import { FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { useThemeColors } from '@/theme/useThemeColors';
import { shareLedgerExport } from '@/utils/download';

/** Each file's icon in its familiar colour — Excel green, PDF red — as on web. */
const ICONS: Readonly<Record<LedgerFileFormat, { icon: LucideIcon; color: 'success' | 'destructive' }>> = {
  xlsx: { icon: FileSpreadsheet, color: 'success' },
  pdf: { icon: FileText, color: 'destructive' },
};

interface ExportLedgerButtonProps {
  /** From `useClientLedgerExport` / `useCompanyLedgerExport`, or the `…LedgerPdf` hooks with `format` 'pdf'. */
  ledgerExport: LedgerFileDownload;
  /** The client's or company's name, for the file name when the backend sends none. */
  name: string;
  /** The Excel workbook ("Download Excel", the default) or the PDF summary ("Share PDF"). */
  format?: LedgerFileFormat;
  className?: string;
}

/**
 * Downloads the selected year's ledger file and opens the share sheet (WhatsApp, email, Files…);
 * a failure shows underneath.
 */
export function ExportLedgerButton({ ledgerExport, name, format = 'xlsx', className }: ExportLedgerButtonProps) {
  const { financialYear } = useFinancialYear();
  const [shareError, setShareError] = useState<unknown>();
  const colors = useThemeColors();
  const copy = LEDGER_FILE_COPY[format];
  const { icon: Icon, color: iconColor } = ICONS[format];
  const error = ledgerExport.error ?? shareError;
  const run = async () => {
    ledgerExport.clearError();
    setShareError(undefined);
    try {
      await shareLedgerExport(ledgerExport.exportLedger, name, financialYear, format);
    } catch (e) {
      setShareError(e);
    }
  };
  return (
    <View className={className}>
      <Button
        variant="outline"
        icon={<Icon size={18} color={colors[iconColor]} />}
        label={ledgerExport.exporting ? copy.busyLabel : copy.shareLabel}
        disabled={ledgerExport.exporting}
        onPress={run}
      />
      {error ? <Text className="pt-1.5 text-sm text-destructive">{errorMessage(error)}</Text> : null}
    </View>
  );
}
