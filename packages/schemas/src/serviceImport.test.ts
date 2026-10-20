import { ApiError } from '@cl/api';
import { describe, expect, it } from 'vitest';

import { importedServiceDetail, importedTitle } from './serviceImport';
import { importFailure, isWorkbookName } from './workbookImport';

describe('Import Services', () => {
  it('accepts only .xlsx workbooks', () => {
    expect(isWorkbookName('Services.XLSX')).toBe(true);
    expect(isWorkbookName('services.csv')).toBe(false);
  });

  it('summarises what was imported', () => {
    expect(importedTitle(1)).toBe('1 Service Imported');
    expect(importedTitle(12)).toBe('12 Services Imported');
    expect(importedServiceDetail({ category: 'TAX', standardFee: 5000 })).toBe('Tax · ₹5,000');
  });

  it('lists the cells at fault in reading order', () => {
    const error = new ApiError(400, {
      code: 'SPREADSHEET_INVALID',
      message: 'The workbook has invalid cells',
      errors: [
        { field: 'Services!G10', message: 'Must be a number' },
        { field: 'Services!B3', message: 'Required' },
        { field: 'Services!AA3', message: 'Unknown column value' },
      ],
    });
    const failure = importFailure(error);
    expect(failure.message).toBe('The workbook has invalid cells');
    expect(failure.cells.map((c) => c.cell)).toEqual(['Services!B3', 'Services!AA3', 'Services!G10']);
  });

  it('explains a file that is too large', () => {
    expect(importFailure(new ApiError(413)).message).toMatch(/Too Large/);
  });
});
