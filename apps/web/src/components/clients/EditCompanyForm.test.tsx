import type { CompanyResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@cl/api'
import { DELETE_COMPANY_IN_USE } from '@cl/schemas'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { EditCompanyForm } from './EditCompanyForm'

const company: CompanyResponse = {
  id: 'co-1',
  companyName: 'Mehta Textiles Pvt Ltd',
  companyType: 'PRIVATE_LIMITED',
  address: 'Plot 14, MIDC Andheri East',
  discountPercent: 0,
}

function setup({
  onSave = vi.fn().mockResolvedValue(undefined),
  onDelete = vi.fn().mockResolvedValue(undefined),
  onlyCompany = false,
  hasServices = false,
} = {}) {
  const onDone = vi.fn()
  const onDeleted = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <EditCompanyForm
          company={company}
          onSave={onSave}
          saving={false}
          onDone={onDone}
          onDelete={onDelete}
          deleting={false}
          onDeleted={onDeleted}
          onlyCompany={onlyCompany}
          hasServices={hasServices}
        />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDone, onDelete, onDeleted, user: userEvent.setup() }
}

const save = () => screen.getByRole('button', { name: 'Save Changes' })

describe('EditCompanyForm', () => {
  it('loads the company, keeping a zero discount, and waits for a change', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Edit Company' })).toBeVisible()
    expect(screen.getByLabelText('Company Name')).toHaveValue('Mehta Textiles Pvt Ltd')
    expect(screen.getByLabelText('Company Type')).toHaveValue('PRIVATE_LIMITED')
    expect(screen.getByLabelText('Company Discount % (Optional)')).toHaveValue(0)
    expect(save()).toBeDisabled()
  })

  it('sends every field, including the unchanged discount', async () => {
    const { onSave, onDone, user } = setup()
    await user.clear(screen.getByLabelText('Company Name'))
    await user.type(screen.getByLabelText('Company Name'), 'Mehta Textiles Ltd')
    await user.click(save())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      companyName: 'Mehta Textiles Ltd',
      companyType: 'PRIVATE_LIMITED',
      address: 'Plot 14, MIDC Andheri East',
      discountPercent: 0,
    })
  })

  it("omits a cleared discount, so the company takes the client's", async () => {
    const { onSave, onDone, user } = setup()
    await user.clear(screen.getByLabelText('Company Discount % (Optional)'))
    await user.click(save())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('discountPercent')
  })

  it('deletes the company after confirmation', async () => {
    const { onDelete, onDeleted, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete Company' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete Mehta Textiles Pvt Ltd?')
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete Company' }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('explains a 409 when the company still has services', async () => {
    const onDelete = vi.fn().mockRejectedValue(new ApiError(409, { status: 409, code: 'BUSINESS_RULE_VIOLATION' }))
    const { onDeleted, user } = setup({ onDelete })
    await user.click(screen.getByRole('button', { name: 'Delete Company' }))
    await user.click(screen.getByRole('button', { name: 'Delete Company' }))

    expect(await screen.findByText(DELETE_COMPANY_IN_USE)).toBeVisible()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("won't delete a company that still has services", () => {
    setup({ hasServices: true })
    expect(screen.getByRole('button', { name: 'Delete Company' })).toBeDisabled()
    expect(screen.getByTitle(DELETE_COMPANY_IN_USE)).toBeInTheDocument()
  })

  it("won't delete the client's only company", () => {
    setup({ onlyCompany: true })
    expect(screen.getByRole('button', { name: 'Delete Company' })).toBeDisabled()
  })
})
