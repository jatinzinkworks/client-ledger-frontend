import type { CompanyResponse } from '@cl/api'
import { DELETE_COMPANY_IN_USE } from '@cl/schemas'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { CompaniesTable } from './CompaniesTable'

const textiles: CompanyResponse = { id: 'co-1', companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: 'Plot 14', serviceCount: 2 }
const exports: CompanyResponse = { id: 'co-2', companyName: 'Mehta Exports LLP', companyType: 'LLP', address: 'Andheri', serviceCount: 0 }

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

  it('shows how many services each company has', () => {
    setup([textiles, exports, { ...exports, id: 'co-3', serviceCount: undefined }])
    expect(screen.getByRole('columnheader', { name: 'Services' })).toBeVisible()
    const counts = screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[2].textContent)
    expect(counts).toEqual(['2', '0', '—'])
  })

  it("won't delete a company that still has services", () => {
    setup([textiles, exports])
    expect(screen.getByRole('button', { name: 'Delete Company: Mehta Textiles Pvt Ltd' })).toBeDisabled()
    expect(screen.getByTitle(DELETE_COMPANY_IN_USE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Company: Mehta Exports LLP' })).toBeEnabled()
  })

  it('opens a company when its row is clicked', async () => {
    const { user } = setup([textiles, exports])
    await user.click(screen.getByText('LLP'))
    expect(screen.getByText('Company Page')).toBeVisible()
  })
})
