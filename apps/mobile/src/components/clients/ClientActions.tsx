import { useClientLedgerEmail, useClientLedgerExport, useClientLedgerPdf } from '@cl/api';
import { TOO_MANY_COMPANIES, clientLedgerEmailDescription, companiesLeft } from '@cl/schemas';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { EmailLedgerButton } from '@/components/EmailLedgerButton';
import { ExportLedgerButton } from '@/components/ExportLedgerButton';
import { Button } from '@/components/ui/Button';
import { newCompanyHref, recordPaymentHref } from '@/utils/routes';

interface ClientActionsProps {
  clientId: string;
  /** For the export's file name and the email confirmation. */
  name: string;
  /** How many companies the client holds; Add Company is unavailable at the limit. */
  companyCount: number;
}

/**
 * The client page's actions, as in the web header: Record Payment, Add Company, Download Excel,
 * Email Summary and Share PDF (the summary PDF in the share sheet, e.g. to send on WhatsApp).
 */
export function ClientActions({ clientId, name, companyCount }: ClientActionsProps) {
  const ledgerExport = useClientLedgerExport(clientId);
  const ledgerPdf = useClientLedgerPdf(clientId);
  const ledgerEmail = useClientLedgerEmail(clientId);
  const full = companiesLeft(companyCount) === 0;
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <Button label="Record Payment" className="flex-1" onPress={() => router.push(recordPaymentHref(clientId))} />
        <Button
          label="+ Add Company"
          className="flex-1"
          disabled={full}
          onPress={() => router.push(newCompanyHref(clientId))}
        />
      </View>
      {full && <Text className="text-sm text-muted-foreground">{TOO_MANY_COMPANIES}</Text>}
      <View className="flex-row items-start gap-2">
        <ExportLedgerButton ledgerExport={ledgerExport} name={name} className="flex-1" />
        <EmailLedgerButton
          description={clientLedgerEmailDescription(name)}
          onSend={ledgerEmail.send}
          sending={ledgerEmail.sending}
          className="flex-1"
        />
      </View>
      <ExportLedgerButton ledgerExport={ledgerPdf} name={name} format="pdf" />
    </View>
  );
}
