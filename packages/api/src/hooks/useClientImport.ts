import { getDownloadTemplate1Url, getListClientsQueryKey, importClients } from '../generated/clients/clients';
import { getListManagersQueryKey } from '../generated/manager-catalog/manager-catalog';
import { refreshOverview } from './useOverview';
import { useWorkbookImport } from './useWorkbookImport';

/**
 * Import Clients: the template (GET /clients/import/template) and the import (POST
 * /clients/import, all or nothing: clients with their companies). On success the client list,
 * the managers' client counts and the Overview's book counts refresh.
 */
export const useClientImport = () =>
  useWorkbookImport({
    templateUrl: getDownloadTemplate1Url(),
    upload: (file) => importClients({ file }),
    refresh: (queryClient) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListManagersQueryKey() }),
        refreshOverview(queryClient),
      ]),
  });
