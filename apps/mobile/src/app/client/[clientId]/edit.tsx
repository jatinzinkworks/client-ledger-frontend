import { useClient, useManagerCatalog } from '@cl/api';
import { router, useLocalSearchParams } from 'expo-router';

import { ClientGate, goToClientList } from '@/components/clients/ClientGate';
import { EditClientForm } from '@/components/clients/EditClientForm';
import { FormScreen } from '@/components/ui/FormScreen';

/** Edit Client: the client's own details, and Delete Client (then back to the list). */
export default function EditClientScreen() {
  const { clientId = '' } = useLocalSearchParams<{ clientId: string }>();
  const page = useClient(clientId);
  const managers = useManagerCatalog();
  return (
    <FormScreen title="Edit Client">
      <ClientGate page={page}>
        {page.client && (
          <EditClientForm
            client={page.client}
            managers={managers.managers}
            managersLoading={managers.isLoading}
            onSave={page.update}
            saving={page.saving}
            onDelete={page.remove}
            deleting={page.deleting}
            onDone={() => router.back()}
            onDeleted={goToClientList}
          />
        )}
      </ClientGate>
    </FormScreen>
  );
}
