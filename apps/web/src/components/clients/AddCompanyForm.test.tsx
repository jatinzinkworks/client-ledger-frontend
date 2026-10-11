import { ApiError, type ClientResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { AddCompanyForm } from './AddCompanyForm'

const client: ClientResponse = {
  id: 'c-1',
  firstName: 'Rajesh',
  lastName: 'Mehta',
  companies: [{ id: 'co-1', companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: 'Plot 14' }],
}

function setup(onAdd = vi.fn().mockResolvedValue(undefined)) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <AddCompanyForm client={client} onAdd={onAdd} saving={false} onDone={onDone} />
      </SheetContent>
    </Sheet>,
  )
  return { onAdd, onDone, user: userEvent.setup() }
}

const submit = () => screen.getByRole('button', { name: 'Add Company' })

async function fillCompany(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Company Name'), 'Mehta Exports')
  await user.selectOptions(screen.getByLabelText('Company Type'), 'LLP')
  await user.type(screen.getByLabelText('Address'), '14 MG Road')
}

describe('AddCompanyForm', () => {
  it('adds one company, enabled only once it is filled in', async () => {
    const { onAdd, onDone, user } = setup()
    expect(screen.getByRole('heading', { name: 'Add Company For Rajesh Mehta' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /Add Another Company/ })).not.toBeInTheDocument()
    expect(submit()).toBeDisabled()

    await fillCompany(user)
    await user.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onAdd).toHaveBeenCalledWith({ companyName: 'Mehta Exports', companyType: 'LLP', address: '14 MG Road' })
  })

  it("sends the company's own discount when one is given", async () => {
    const { onAdd, onDone, user } = setup()
    await fillCompany(user)
    await user.type(screen.getByLabelText('Company Discount % (Optional)'), '12.5')
    await user.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onAdd).toHaveBeenCalledWith({ companyName: 'Mehta Exports', companyType: 'LLP', address: '14 MG Road', discountPercent: 12.5 })
  })

  it('shows a backend rejection against its field', async () => {
    const rejection = new ApiError(400, { status: 400, errors: [{ field: 'address', message: 'Rejected By Server' }] })
    const { onDone, user } = setup(vi.fn().mockRejectedValue(rejection))
    await fillCompany(user)
    await user.click(submit())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('explains when the client already holds the most companies allowed', async () => {
    const full = new ApiError(409, { status: 409, code: 'BUSINESS_RULE_VIOLATION' })
    const { user } = setup(vi.fn().mockRejectedValue(full))
    await fillCompany(user)
    await user.click(submit())

    expect(await screen.findByText('A Client Can Hold Up To 50 Companies.')).toBeVisible()
  })
})
