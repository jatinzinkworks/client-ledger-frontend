import { errorMessage, type DownloadedFile } from '@cl/api';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { shareLedgerExport } from '@/utils/download';

interface ExportLedgerButtonProps {
  /** From `useClientLedgerExport` / `useCompanyLedgerExport`. */
  ledgerExport: {
    exportLedger: (financialYear: string) => Promise<DownloadedFile>;
    exporting: boolean;
    error: Error | null;
    clearError: () => void;
  };
  /** The client's or company's name, for the file name when the backend sends none. */
  name: string;
  className?: string;
}

/** Export Ledger: the selected year's workbook, opened in the share sheet; a failure shows underneath. */
export function ExportLedgerButton({ ledgerExport, name, className }: ExportLedgerButtonProps) {
  const { financialYear } = useFinancialYear();
  const [shareError, setShareError] = useState<unknown>();
  const error = ledgerExport.error ?? shareError;
  const run = async () => {
    ledgerExport.clearError();
    setShareError(undefined);
    try {
      await shareLedgerExport(ledgerExport.exportLedger, name, financialYear);
    } catch (e) {
      setShareError(e);
    }
  };
  return (
    <View className={className}>
      <Button
        variant="outline"
        label={ledgerExport.exporting ? 'Exporting…' : 'Export Ledger'}
        disabled={ledgerExport.exporting}
        onPress={run}
      />
      {error ? <Text className="pt-1.5 text-sm text-destructive">{errorMessage(error)}</Text> : null}
    </View>
  );
}
