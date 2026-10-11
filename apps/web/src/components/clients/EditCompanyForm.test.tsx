import type { CompanyResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function setup(onSave = vi.fn().mockResolvedValue(undefined)) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <EditCompanyForm company={company} onSave={onSave} saving={false} onDone={onDone} />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDone, user: userEvent.setup() }
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
})
