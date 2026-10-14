import { currentFinancialYear } from '@cl/schemas';
import { useMemo, useState, type ReactNode } from 'react';

import { FinancialYearContext } from './useFinancialYear';

/**
 * The app-wide financial year filter. It starts at the current Indian financial year every time
 * the app opens, so a stale choice never hides this year's figures (the same rule as on web).
 */
export function FinancialYearProvider({ children }: { children: ReactNode }) {
  const [financialYear, setFinancialYear] = useState(() => currentFinancialYear());
  const value = useMemo(() => ({ financialYear, setFinancialYear }), [financialYear]);
  return <FinancialYearContext.Provider value={value}>{children}</FinancialYearContext.Provider>;
}
