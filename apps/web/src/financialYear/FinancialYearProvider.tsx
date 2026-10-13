import { currentFinancialYear } from '@cl/schemas'
import { useMemo, useState, type ReactNode } from 'react'

import { FinancialYearContext } from './useFinancialYear'

/**
 * The app-wide financial year filter. It starts at the current Indian financial year on every
 * visit, so a stale choice from an earlier session never hides this year's figures.
 */
export function FinancialYearProvider({ children }: { children: ReactNode }) {
  const [financialYear, setFinancialYear] = useState(() => currentFinancialYear())
  const value = useMemo(() => ({ financialYear, setFinancialYear }), [financialYear])
  return <FinancialYearContext.Provider value={value}>{children}</FinancialYearContext.Provider>
}
