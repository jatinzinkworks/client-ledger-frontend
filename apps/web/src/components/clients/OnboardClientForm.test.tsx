import { ApiError, type ManagerResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { OnboardClientForm } from './OnboardClientForm'

const managers: ManagerResponse[] = [{ id: 'm-1', firstName: 'Neha', lastName: 'Kulkarni' }]

function setup({ onSave = vi.fn().mockResolvedValue(undefined), managerList = managers } = {}) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close) and a router link, so render inside both.
  render(
    <MemoryRouter>
      <Sheet open>
        <SheetContent>
          <OnboardClientForm managers={managerList} managersLoading={false} onSave={onSave} saving={false} onDone={onDone} />
        </SheetContent>
      </Sheet>
    </MemoryRouter>,
  )
  return { onSave, onDone, user: userEvent.setup() }
}

const submit = () => screen.getByRole('button', { name: 'Onboard Client' })

async function fillClient(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First Name'), 'Rajesh')
  await user.type(screen.getByLabelText('Last Name'), 'Mehta')
  await user.type(screen.getByLabelText('Phone'), '+91 98200 12345')
  await user.type(screen.getByLabelText('Email'), 'rajesh@mehtatextiles.in')
  await user.selectOptions(screen.getByLabelText('Manager Assigned'), 'Neha Kulkarni')
}

describe('OnboardClientForm', () => {
  it('onboards a client with two companies', async () => {
    const { onSave, onDone, user } = setup()
    await fillClient(user)
    const [name] = screen.getAllByLabelText('Company Name')
    await user.type(name, 'Mehta Textiles Pvt Ltd')
    await user.type(screen.getAllByLabelText('Address')[0], '12 MG Road')

    await user.click(screen.getByRole('button', { name: 'Add Another Company' }))
    await user.type(screen.getAllByLabelText('Company Name')[1], 'Mehta Exports')
    await user.selectOptions(screen.getAllByLabelText('Company Type')[1], 'LLP')
    await user.type(screen.getAllByLabelText('Address')[1], '14 MG Road')
    await user.type(screen.getAllByLabelText('Company Discount % (Optional)')[1], '5')
    await user.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Rajesh',
      lastName: 'Mehta',
      phone: '+91 98200 12345',
      email: 'rajesh@mehtatextiles.in',
      managerId: 'm-1',
      companies: [
        { companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: '12 MG Road' },
        { companyName: 'Mehta Exports', companyType: 'LLP', address: '14 MG Road', discountPercent: 5 },
      ],
    })
  })

  it('keeps Onboard Client disabled until every mandatory field is filled', async () => {
    const { onSave, user } = setup()
    expect(submit()).toBeDisabled()
    await fillClient(user)
    await user.type(screen.getByLabelText('Company Name'), 'Mehta Textiles')
    expect(submit()).toBeDisabled() // address still blank
    await user.type(screen.getByLabelText('Address'), '12 MG Road')
    expect(submit()).toBeEnabled() // the discount is optional

    await user.click(screen.getByRole('button', { name: 'Add Another Company' }))
    expect(submit()).toBeDisabled() // the new company is blank
    expect(onSave).not.toHaveBeenCalled()
  })

  it('sends the discount when one is given, and checks its range', async () => {
    const { onSave, onDone, user } = setup()
    await fillClient(user)
    await user.type(screen.getByLabelText('Company Name'), 'Mehta Textiles')
    await user.type(screen.getByLabelText('Address'), '12 MG Road')
    await user.type(screen.getByLabelText('Discount % (Optional)'), '150')
    await user.click(submit())
    expect(await screen.findByText('Enter A Discount From 0 To 100%.')).toBeVisible()

    await user.clear(screen.getByLabelText('Discount % (Optional)'))
    await user.type(screen.getByLabelText('Discount % (Optional)'), '10')
    await user.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ discountPercent: 10 }))
  })

  it('keeps the only company, but lets an added one be removed', async () => {
    const { user } = setup()
    expect(screen.queryByRole('button', { name: /Remove Company/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Another Company' }))
    await user.click(screen.getByRole('button', { name: 'Remove Company 2' }))
    expect(screen.getAllByLabelText('Company Name')).toHaveLength(1)
  })

  it('shows backend field errors against the company field', async () => {
    const rejection = new ApiError(400, {
      status: 400,
      errors: [{ field: 'companies[0].address', message: 'Rejected By Server' }],
    })
    const { onDone, user } = setup({ onSave: vi.fn().mockRejectedValue(rejection) })
    await fillClient(user)
    await user.type(screen.getByLabelText('Company Name'), 'Mehta Textiles')
    await user.type(screen.getByLabelText('Address'), '12 MG Road')
    await user.click(submit())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('points to Managers when there are none to assign', () => {
    setup({ managerList: [] })
    expect(screen.getByRole('link', { name: 'Add A Manager' })).toHaveAttribute('href', '/managers')
    expect(submit()).toBeDisabled()
  })
})
