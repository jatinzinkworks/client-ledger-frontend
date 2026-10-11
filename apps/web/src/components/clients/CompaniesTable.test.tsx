import type { CompanyResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { CompaniesTable } from './CompaniesTable'

const textiles: CompanyResponse = { id: 'co-1', companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: 'Plot 14' }
const exports: CompanyResponse = { id: 'co-2', companyName: 'Mehta Exports LLP', companyType: 'LLP', address: 'Andheri' }

function setup(companies: CompanyResponse[], onDeleteCompany = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter initialEntries={['/clients/c-1']}>
      <Routes>
        <Route
          path="/clients/c-1"
          element={<CompaniesTable clientId="c-1" companies={companies} onDeleteCompany={onDeleteCompany} deletingCompany={false} />}
        />
        <Route path="/clients/c-1/companies/:companyId" element={<p>Company Page</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onDeleteCompany, user: userEvent.setup() }
}

describe('CompaniesTable', () => {
  it("won't delete a client's only company", () => {
    setup([textiles])
    expect(screen.getByRole('button', { name: 'Delete Company: Mehta Textiles Pvt Ltd' })).toBeDisabled()
  })

  it('deletes a company after confirmation, without opening it', async () => {
    const { onDeleteCompany, user } = setup([textiles, exports])
    await user.click(screen.getByRole('button', { name: 'Delete Company: Mehta Exports LLP' }))
    expect(screen.getByRole('heading', { name: 'Delete Mehta Exports LLP?' })).toBeVisible()
    expect(onDeleteCompany).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete Company' }))
    await waitFor(() => expect(onDeleteCompany).toHaveBeenCalledWith('co-2'))
    expect(screen.queryByText('Company Page')).not.toBeInTheDocument()
  })

  it('opens a company when its row is clicked', async () => {
    const { user } = setup([textiles, exports])
    await user.click(screen.getByText('LLP'))
    expect(screen.getByText('Company Page')).toBeVisible()
  })
})
