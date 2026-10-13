import type { ClientLedgerStatusResponse } from '@cl/api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { YearBalances } from './YearBalances'

const status: ClientLedgerStatusResponse = {
  clientSince: '2019-04-01',
  yearCount: 2,
  years: [
    {
      financialYear: '2026-27',
      current: true,
      companyCount: 1,
      billed: 184500,
      discount: 6350,
      received: 80000,
      closingBalance: 98150,
      status: 'PENDING',
      companies: [{ companyId: 'a', companyName: 'Mehta Textiles Pvt Ltd', billed: 184500, discount: 6350, received: 80000, closingBalance: 98150, status: 'PENDING' }],
    },
    {
      financialYear: '2025-26',
      current: false,
      closedOn: '2026-03-31',
      companyCount: 1,
      billed: 10000,
      discount: 0,
      received: 3000,
      closingBalance: 7000,
      status: 'CARRIED',
      companies: [{ companyId: 'a', companyName: 'Mehta Textiles Pvt Ltd', billed: 10000, discount: 0, received: 3000, closingBalance: 7000, status: 'CARRIED' }],
    },
  ],
}

const setup = () => {
  render(<YearBalances status={status} isLoading={false} error={null} onRetry={vi.fn()} />)
  return userEvent.setup()
}

describe('YearBalances', () => {
  it('lists each year with its figures and status, as in the mock', () => {
    setup()
    for (const text of ['Client Since Apr 2019 · 2 Years. Click A Year To Open It.', 'FY 2026–27', 'Current Year · To Date', '₹98,150', 'Pending', '1 Company · Closed 31 Mar 2026', 'Carried']) {
      expect(screen.getByText(text)).toBeVisible()
    }
    expect(screen.queryByText('Mehta Textiles Pvt Ltd')).not.toBeInTheDocument()
  })

  it('opens a year to its companies, and closes it again', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'FY 2025–26' }))
    expect(screen.getAllByText('Mehta Textiles Pvt Ltd')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'FY 2025–26' }))
    expect(screen.queryByText('Mehta Textiles Pvt Ltd')).not.toBeInTheDocument()
  })
})
