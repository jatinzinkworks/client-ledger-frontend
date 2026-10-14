import { useClient } from '@cl/api';
import { TOO_MANY_COMPANIES, addCompanyTitle, companiesLeft, emptyCompany } from '@cl/schemas';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { ClientGate } from '@/components/clients/ClientGate';
import { CompanyForm } from '@/components/clients/CompanyForm';
import { FormScreen } from '@/components/ui/FormScreen';

/** Add Company: one new company for an existing client (at most 50 per client). */
export default function AddCompanyScreen() {
  const { clientId = '' } = useLocalSearchParams<{ clientId: string }>();
  const page = useClient(clientId);
  const full = companiesLeft(page.companies.length) === 0;
  return (
    <FormScreen title={page.client ? addCompanyTitle(page.client) : 'Add Company'}>
      <ClientGate page={page}>
        <CompanyForm
          submitLabel="Add Company"
          defaults={emptyCompany()}
          onSave={page.addCompany}
          saving={page.addingCompany}
          onDone={() => router.back()}
          conflictMessage={TOO_MANY_COMPANIES}
          unavailable={full ? <Text className="text-sm text-muted-foreground">{TOO_MANY_COMPANIES}</Text> : undefined}
        />
      </ClientGate>
    </FormScreen>
  );
}
