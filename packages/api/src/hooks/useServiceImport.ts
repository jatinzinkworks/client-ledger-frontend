import {
  getDownloadTemplateUrl,
  getListServicesQueryKey,
  importServices,
} from '../generated/service-catalog/service-catalog';
import { useWorkbookImport } from './useWorkbookImport';

/**
 * Import Services: the template (GET /services/import/template) and the import (POST
 * /services/import, all or nothing). On success the catalog list (every year's copy) refreshes.
 */
export const useServiceImport = () =>
  useWorkbookImport({
    templateUrl: getDownloadTemplateUrl(),
    upload: (file) => importServices({ file }),
    refresh: (queryClient) => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() }),
  });
