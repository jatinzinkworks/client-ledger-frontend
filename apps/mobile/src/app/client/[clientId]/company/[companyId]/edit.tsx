import { useClient, useCompany } from '@cl/api';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EditCompanyForm } from '@/components/clients/EditCompanyForm';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { clientHref } from '@/utils/routes';

/** Edit Company: its name, type, address and discount, and Delete Company (then back to the client). */
export default function EditCompanyScreen() {
  const { clientId = '', companyId = '' } = useLocalSearchParams<{ clientId: string; companyId: string }>();
  const page = useCompany(clientId, companyId);
  // The client's companies, for Delete Company (a client must keep one) and the delete itself.
  const owner = useClient(clientId);
  const { company } = page;
  const backToClient = () => router.dismissTo(clientHref(clientId));

  return (
    <FormScreen title="Edit Company">
      {page.notFound ? (
        <View className="gap-3">
          <EmptyState title="Company Not Found" description="This Company May Have Been Removed." />
          <Button variant="outline" label="Back To Client" onPress={backToClient} />
        </View>
      ) : page.isLoading ? (
        <Loading className="py-8" />
      ) : page.loadError ? (
        <LoadError error={page.loadError} onRetry={() => page.refetch()} />
      ) : (
        company && (
          <EditCompanyForm
            company={company}
            onSave={page.update}
            saving={page.saving}
            onDone={() => router.back()}
            onDelete={() => owner.deleteCompany(companyId)}
            deleting={owner.deletingCompany}
            onDeleted={backToClient}
            onlyCompany={owner.companies.length <= 1}
            hasServices={page.services.length > 0}
          />
        )
      )}
    </FormScreen>
  );
}
