import { ApiError, errorMessage, type ErrorResponse } from '@cl/api';

// Importing from an Excel workbook (services, clients): download the template, fill it in, upload
// it. Every import is all or nothing; a rejected workbook comes back as 400 SPREADSHEET_INVALID
// with each cell at fault, e.g. "Services!G3". What is generic lives here; each import adds its
// own copy (`ImportCopy`) and a summary of what it created (`ImportSummary`).

export const DOWNLOAD_TEMPLATE_LABEL = 'Download Template';
export const CHOOSE_WORKBOOK_LABEL = 'Choose Workbook';
export const IMPORT_LABEL = 'Import';
export const NOTHING_IMPORTED = 'Nothing Was Imported';

/** The workbook type, for file inputs and pickers. */
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_ACCEPT = `.xlsx,${XLSX_MIME}`;

/** Whether a picked file looks like an .xlsx workbook (the backend checks properly). */
export const isWorkbookName = (name: string) => /\.xlsx$/i.test(name.trim());
export const NOT_A_WORKBOOK = 'Choose An Excel Workbook (.xlsx).';

/** What one import screen says: its title, the two steps, and the template's fallback file name. */
export interface ImportCopy {
  title: string;
  /** Screen-reader description of the web sheet. */
  description: string;
  steps: { template: { title: string; body: string }; upload: { title: string; body: string } };
  /** Used when the backend does not name the template. */
  templateFileName: string;
}

/** What an import created, for the result: a heading and a line per record. */
export interface ImportSummary {
  title: string;
  items: { key: string; name: string; detail: string }[];
}

export interface ImportCellError {
  /** The cell reference, e.g. "Services!G3"; empty for an error about the whole file. */
  cell: string;
  message: string;
}

/** Sort key for "Sheet!G3": sheet, then row, then column, so errors read top to bottom. */
const cellOrder = (cell: string) => {
  const match = /^(?:(.*)!)?([A-Z]+)(\d+)$/i.exec(cell);
  if (!match) return [cell, 0, ''] as const;
  return [match[1] ?? '', Number(match[3]), match[2]!.toUpperCase().padStart(3, ' ')] as const;
};

const compareCells = (a: ImportCellError, b: ImportCellError) => {
  const [sa, ra, ca] = cellOrder(a.cell);
  const [sb, rb, cb] = cellOrder(b.cell);
  return sa.localeCompare(sb) || ra - rb || ca.localeCompare(cb);
};

/**
 * Why an import failed, for the screen: the backend's message (or a plainer one for a file too
 * large, 413), and each cell at fault in reading order when the workbook had invalid cells.
 */
export function importFailure(error: unknown): { message: string; cells: ImportCellError[] } {
  if (error instanceof ApiError && error.status === 413) {
    return { message: 'The File Is Too Large To Upload. Import Fewer Rows At Once.', cells: [] };
  }
  const cells =
    error instanceof ApiError
      ? ((error.body as ErrorResponse | undefined)?.errors ?? [])
          .map((e) => ({ cell: e.field ?? '', message: e.message ?? '' }))
          .sort(compareCells)
      : [];
  return { message: errorMessage(error), cells };
}
