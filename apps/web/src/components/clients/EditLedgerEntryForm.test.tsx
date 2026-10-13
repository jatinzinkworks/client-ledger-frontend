import { ApiError, type LedgerEntryResponse } from '@cl/api'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { EditLedgerEntryForm } from './EditLedgerEntryForm'

const entry: LedgerEntryResponse = {
  id: 'e-1',
  serviceName: 'GST Return Filing',
  dueDate: '2026-10-07',
  financialYear: '2026-27',
  serviceFee: 5000,
  discountPercent: 5,
  gstRatePercent: 18,
}

function setup({
  onSave = vi.fn().mockResolvedValue(undefined),
  onDelete = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <EditLedgerEntryForm
          entry={entry}
          onSave={onSave}
          saving={false}
          onDelete={onDelete}
          deleting={false}
          onDone={onDone}
        />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDelete, onDone, user: userEvent.setup() }
}

const saveChanges = () => screen.getByRole('button', { name: 'Save Changes' })

describe('EditLedgerEntryForm', () => {
  it('shows what the entry bills, fixed, and starts from its rates', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Edit Ledger Entry' })).toBeVisible()
    expect(screen.getByLabelText('Service')).toHaveTextContent('GST Return Filing')
    expect(screen.getByLabelText('Due Date')).toHaveTextContent('7 Oct 2026')
    expect(screen.getByLabelText('Financial Year')).toHaveTextContent('2026-27')
    expect(screen.getByLabelText('Service Fee')).toHaveValue(5000)
    expect(screen.getByLabelText('Discount %')).toHaveValue(5)
    expect(screen.getByLabelText('GST Rate')).toHaveValue('18')
    expect(saveChanges()).toBeDisabled()
  })

  it('previews the amounts as the rates change, then saves them', async () => {
    const { onSave, onDone, user } = setup()
    const summary = within(screen.getByLabelText('Charge Summary'))
    expect(summary.getByText('₹5,605')).toBeVisible()

    await user.clear(screen.getByLabelText('Discount %'))
    await user.type(screen.getByLabelText('Discount %'), '10')
    await user.selectOptions(screen.getByLabelText('GST Rate'), '12')
    expect(summary.getByText('₹5,040')).toBeVisible()

    await user.click(saveChanges())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({ serviceFee: 5000, discountPercent: 10, gstRatePercent: 12 })
  })

  it('shows a backend field error on its field', async () => {
    const rejection = new ApiError(400, { status: 400, errors: [{ field: 'serviceFee', message: 'Rejected By Server' }] })
    const { onDone, user } = setup({ onSave: vi.fn().mockRejectedValue(rejection) })
    await user.clear(screen.getByLabelText('Service Fee'))
    await user.type(screen.getByLabelText('Service Fee'), '4000')
    await user.click(saveChanges())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('deletes the entry after confirmation', async () => {
    const { onDelete, onDone, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete Entry' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete GST Return Filing · Due 7 Oct 2026?')
    await user.click(screen.getByRole('button', { name: 'Delete Entry' }))

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
