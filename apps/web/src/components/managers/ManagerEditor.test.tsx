import { ApiError, type ManagerResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { ManagerEditor } from './ManagerEditor'

const neha: ManagerResponse = {
  id: 'm-1',
  firstName: 'Neha',
  lastName: 'Kulkarni',
  email: 'neha@pranaysinghal.in',
  role: 'SENIOR_MANAGER',
  mobileNumber: '+91 98201 55610',
}

function setup({ manager = undefined as ManagerResponse | undefined, onSave = vi.fn().mockResolvedValue(undefined) } = {}) {
  const onDone = vi.fn()
  // The editor uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <ManagerEditor
          manager={manager}
          onSave={onSave}
          onDelete={vi.fn().mockResolvedValue(undefined)}
          saving={false}
          deleting={false}
          onDone={onDone}
        />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDone, user: userEvent.setup() }
}

describe('ManagerEditor', () => {
  it('loads an existing manager', () => {
    setup({ manager: neha })
    expect(screen.getByRole('heading', { name: 'Edit Manager' })).toBeVisible()
    expect(screen.getByLabelText('First Name')).toHaveValue('Neha')
    expect(screen.getByLabelText('Role')).toHaveValue('SENIOR_MANAGER')
    expect(screen.getByRole('button', { name: 'Delete Manager' })).toBeEnabled()
  })

  it('adds a manager', async () => {
    const { onSave, onDone, user } = setup()
    await user.type(screen.getByLabelText('First Name'), 'Arjun')
    await user.type(screen.getByLabelText('Last Name'), 'Iyer')
    await user.type(screen.getByLabelText('Email'), 'arjun@pranaysinghal.in')
    await user.selectOptions(screen.getByLabelText('Role'), 'Manager')
    await user.type(screen.getByLabelText('Phone'), '+91 98335 20418')
    await user.click(screen.getByRole('button', { name: 'Add Manager' }))

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Arjun',
      lastName: 'Iyer',
      email: 'arjun@pranaysinghal.in',
      role: 'MANAGER',
      mobileNumber: '+91 98335 20418',
    })
  })

  it('blocks saving until required fields are filled', async () => {
    const { onSave, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Add Manager' }))
    expect(await screen.findByText('Enter The First Name.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows a duplicate email on the email field', async () => {
    const onSave = vi.fn().mockRejectedValue(new ApiError(409, { status: 409, code: 'RESOURCE_ALREADY_EXISTS' }))
    const { onDone, user } = setup({ manager: neha, onSave })
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(await screen.findByText('A Manager With This Email Already Exists.')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })
})
