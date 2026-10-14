import { useClients, useManagerCatalog } from '@cl/api';
import { router } from 'expo-router';

import { OnboardClientForm } from '@/components/clients/OnboardClientForm';
import { FormScreen } from '@/components/ui/FormScreen';
import { clientHref } from '@/utils/routes';

/** Onboard Client: the client's details, their manager and one or more companies. */
export default function OnboardClientScreen() {
  const clients = useClients();
  const managers = useManagerCatalog();
  return (
    <FormScreen title="Onboard Client">
      <OnboardClientForm
        managers={managers.managers}
        managersLoading={managers.isLoading}
        onSave={clients.create}
        saving={clients.creating}
        // Straight on to the new client, in place of this form.
        onDone={(client) => (client.id ? router.replace(clientHref(client.id)) : router.back())}
      />
    </FormScreen>
  );
}
