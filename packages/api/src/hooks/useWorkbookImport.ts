import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { apiDownload, type DownloadedFile } from '../fetcher';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * A picked workbook to upload: a File / Blob on the web; on React Native `{ uri, name, type }`,
 * which its FormData sends as a file.
 */
export type WorkbookUpload = Blob;

/** What an import screen needs, whatever it imports. */
export interface WorkbookImport<TResult> {
  /** The template, with the backend's file name; saving it is left to each app. */
  downloadTemplate: () => Promise<DownloadedFile>;
  downloadingTemplate: boolean;
  templateError: Error | null;
  importWorkbook: (file: WorkbookUpload) => Promise<TResult>;
  importing: boolean;
  /** What the last import created. */
  imported: TResult | undefined;
  importError: Error | null;
  /** Clears the last import's result or error (choosing another file). */
  resetImport: () => void;
}

/**
 * Downloading a template and importing a filled-in workbook, for any import (services, clients).
 * The template is a file, which `apiFetch` (JSON) cannot read, so it goes through `apiDownload`;
 * the import is the generated multipart call. `refresh` runs after a successful import.
 */
export function useWorkbookImport<TResult>({
  templateUrl,
  upload,
  refresh,
}: {
  templateUrl: string;
  upload: (file: WorkbookUpload) => Promise<TResult>;
  refresh: (queryClient: QueryClient) => Promise<unknown>;
}): WorkbookImport<TResult> {
  const queryClient = useQueryClient();
  const template = useMutation({ mutationFn: () => apiDownload(templateUrl, XLSX) });
  const importing = useMutation({ mutationFn: upload, onSuccess: () => refresh(queryClient) });

  return {
    downloadTemplate: template.mutateAsync,
    downloadingTemplate: template.isPending,
    templateError: template.error as Error | null,
    importWorkbook: importing.mutateAsync,
    importing: importing.isPending,
    imported: importing.data,
    importError: importing.error as Error | null,
    resetImport: importing.reset,
  };
}
