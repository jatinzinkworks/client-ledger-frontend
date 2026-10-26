import { ApiError, type ClientResponse, type ManagerResponse } from '@cl/api'
import { DELETE_CLIENT_IN_USE } from '@cl/schemas'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { EditClientForm } from './EditClientForm'

const managers: ManagerResponse[] = [
  { id: 'm-1', firstName: 'Neha', lastName: 'Kulkarni', role: 'SENIOR_MANAGER' },
  { id: 'm-2', firstName: 'Arjun', lastName: 'Iyer', role: 'MANAGER' },
]

const client: ClientResponse = {
  id: 'c-1',
  firstName: 'Rajesh',
  lastName: 'Mehta',
  phone: '+91 98200 41177',
  email: 'rajesh@mehtatextiles.in',
  managerId: 'm-1',
  discountPercent: 0,
  companies: [{ id: 'co-1', companyName: 'Mehta Textiles Pvt Ltd', companyType: 'PRIVATE_LIMITED', address: 'Plot 14', discountPercent: 5 }],
}

function setup(onSave = vi.fn().mockResolvedValue(undefined), onDelete = vi.fn().mockResolvedValue(undefined)) {
  const onDone = vi.fn()
  const onDeleted = vi.fn()
  // The form uses Sheet parts (title, close) and a router link, so render inside both.
  render(
    <MemoryRouter>
      <Sheet open>
        <SheetContent>
          <EditClientForm
            client={client}
            managers={managers}
            managersLoading={false}
            onSave={onSave}
            saving={false}
            onDelete={onDelete}
            deleting={false}
            onDone={onDone}
            onDeleted={onDeleted}
          />
        </SheetContent>
      </Sheet>
    </MemoryRouter>,
  )
  return { onSave, onDone, onDelete, onDeleted, user: userEvent.setup() }
}

const save = () => screen.getByRole('button', { name: 'Save Changes' })

describe('EditClientForm', () => {
  it('loads the client and waits for a change before saving', async () => {
    const { user } = setup()
    expect(screen.getByLabelText('First Name')).toHaveValue('Rajesh')
    expect(screen.getByLabelText('Manager Assigned')).toHaveValue('m-1')
    expect(screen.getByRole('option', { name: 'Neha Kulkarni · Senior Manager' })).toBeInTheDocument()
    expect(save()).toBeDisabled()

    await user.clear(screen.getByLabelText('Email'))
    expect(save()).toBeDisabled() // a mandatory field is blank
    await user.type(screen.getByLabelText('Email'), 'rajesh@mehta.in')
    expect(save()).toBeEnabled()
  })

  it("saves the client's new details", async () => {
    const { onSave, onDone, user } = setup()
    await user.selectOptions(screen.getByLabelText('Manager Assigned'), 'Arjun Iyer · Manager')
    await user.type(screen.getByLabelText('Discount % (Optional)'), '10')
    await user.click(save())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Rajesh',
      lastName: 'Mehta',
      phone: '+91 98200 41177',
      email: 'rajesh@mehtatextiles.in',
      managerId: 'm-2',
      discountPercent: 10,
    })
  })

  it('shows a backend rejection against its field', async () => {
    const rejection = new ApiError(400, { status: 400, errors: [{ field: 'phone', message: 'Rejected By Server' }] })
    const { onDone, user } = setup(vi.fn().mockRejectedValue(rejection))
    await user.clear(screen.getByLabelText('Phone'))
    await user.type(screen.getByLabelText('Phone'), '+91 98200 00000')
    await user.click(save())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('deletes the client only after the warning is confirmed', async () => {
    const { onDelete, onDeleted, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete Client' }))
    expect(screen.getByRole('heading', { name: 'Delete Rajesh Mehta?' })).toBeVisible()
    expect(screen.getByText('Their Company Is Deleted Too. This Cannot Be Undone.')).toBeVisible()
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete Client' }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('explains a refusal that gives no reason', async () => {
    const inUse = new ApiError(409, { status: 409, code: 'RESOURCE_IN_USE' })
    const { onDeleted, user } = setup(undefined, vi.fn().mockRejectedValue(inUse))
    await user.click(screen.getByRole('button', { name: 'Delete Client' }))
    await user.click(screen.getByRole('button', { name: 'Delete Client' }))

    expect(await screen.findByText(DELETE_CLIENT_IN_USE)).toBeVisible()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
