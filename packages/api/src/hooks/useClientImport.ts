import { getListBirthdaysQueryKey } from '../generated/birthdays/birthdays';
import { getDownloadTemplate1Url, importClients } from '../generated/clients/clients';
import { getListManagersQueryKey } from '../generated/manager-catalog/manager-catalog';
import { refreshOverview } from './useOverview';
import { useWorkbookImport } from './useWorkbookImport';

/**
 * Import Clients: the template (GET /clients/import/template) and the import (POST
 * /clients/import, all or nothing: new clients with their companies, and companies added to clients
 * already on file, matched by Client ID). On success every client query refreshes — the list and
 * each client already on file, whose companies and pending may have grown — plus the managers'
 * client counts, the Birthdays lists and the Overview.
 */
export const useClientImport = () =>
  useWorkbookImport({
    templateUrl: getDownloadTemplate1Url(),
    upload: (file) => importClients({ file }),
    refresh: (queryClient) =>
      Promise.all([
        queryClient.invalidateQueries({
          predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/psc/cl/v1/clients'),
        }),
        queryClient.invalidateQueries({ queryKey: getListManagersQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListBirthdaysQueryKey() }),
        refreshOverview(queryClient),
      ]),
  });
