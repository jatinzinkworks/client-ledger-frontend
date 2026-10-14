import { createContext, useContext } from 'react';

interface FinancialYearContextValue {
  /** The financial year year-based data is filtered by, e.g. "2026-27". */
  financialYear: string;
  setFinancialYear: (financialYear: string) => void;
}

export const FinancialYearContext = createContext<FinancialYearContextValue | null>(null);

/** The app-wide financial year, as on web: chosen in the header, shared by every screen. */
export function useFinancialYear(): FinancialYearContextValue {
  const ctx = useContext(FinancialYearContext);
  if (!ctx) throw new Error('useFinancialYear must be used inside <FinancialYearProvider>');
  return ctx;
}
