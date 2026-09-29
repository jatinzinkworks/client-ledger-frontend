import { ApiError, type FirmDetailsResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SettingsForm } from './SettingsForm'

const storedFirm: FirmDetailsResponse = {
  firmName: 'Pranay Singhal & Company',
  gstin: '27AAKFP4471M1ZS',
  firmRegistrationNo: 'FRN 0148290W',
  email: 'accounts@pranaysinghal.in',
  phone: '+91 22 4012 8890',
  address: '302, Hubtown Solaris, Mumbai 400069',
}

function setup({
  savePaymentTerms = vi.fn().mockResolvedValue(undefined),
  saveFirmDetails = vi.fn().mockResolvedValue(undefined),
  firm = undefined as FirmDetailsResponse | undefined,
} = {}) {
  render(<SettingsForm paymentTerms={{ save: savePaymentTerms }} firmDetails={{ stored: firm, save: saveFirmDetails }} />)
  return { savePaymentTerms, saveFirmDetails, user: userEvent.setup() }
}

const save = () => screen.getByRole('button', { name: 'Save Settings' })
const discard = () => screen.getByRole('button', { name: 'Discard Changes' })

async function retype(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = screen.getByLabelText(label)
  await user.clear(input)
  await user.type(input, value)
}

describe('SettingsForm', () => {
  it('keeps Save and Discard disabled until something changes', async () => {
    const { user } = setup()
    expect(save()).toBeDisabled()
    expect(discard()).toBeDisabled()

    await retype(user, 'Mark Overdue After', '45')
    expect(save()).toBeEnabled()
    expect(screen.getByText('Unsaved Changes')).toBeVisible()
  })

  it('shows the worked due-date example for the entered days', async () => {
    const { user } = setup()
    expect(screen.getByText(/An Invoice On 1 Oct Is Due On 16 Oct/)).toBeVisible()
    await retype(user, 'Payment Due After Invoice', '30')
    expect(screen.getByText(/An Invoice On 1 Oct Is Due On 31 Oct/)).toBeVisible()
  })

  it('saves only payment terms when firm details are untouched — even if never configured', async () => {
    const { savePaymentTerms, saveFirmDetails, user } = setup()
    await retype(user, 'Mark Overdue After', '45')
    await user.selectOptions(screen.getByLabelText('Payment Reminder'), '3 Days Before Due Date')
    await user.click(save())

    await waitFor(() =>
      expect(savePaymentTerms).toHaveBeenCalledWith({
        paymentDueAfterDays: 15,
        markOverdueAfterDays: 45,
        paymentReminderEnabled: true,
        paymentReminderDays: 3,
      }),
    )
    expect(saveFirmDetails).not.toHaveBeenCalled()
    expect(await screen.findByText(/Settings Saved/)).toBeVisible()
  })

  it('saves firm details, omitting blank optional fields', async () => {
    const { savePaymentTerms, saveFirmDetails, user } = setup({ firm: storedFirm })
    await user.clear(screen.getByLabelText('Phone'))
    await retype(user, 'Firm Name', 'PSC & Co')
    await user.click(save())

    await waitFor(() =>
      expect(saveFirmDetails).toHaveBeenCalledWith({
        firmName: 'PSC & Co',
        gstin: storedFirm.gstin,
        firmRegistrationNo: storedFirm.firmRegistrationNo,
        email: storedFirm.email,
        address: storedFirm.address,
      }),
    )
    expect(savePaymentTerms).not.toHaveBeenCalled()
  })

  it('saves nothing while any changed section is invalid', async () => {
    const { savePaymentTerms, saveFirmDetails, user } = setup({ firm: storedFirm })
    await retype(user, 'Mark Overdue After', '45')
    await retype(user, 'GSTIN', 'NOT-A-GSTIN')
    await user.click(save())

    expect(await screen.findByText('Enter A Valid 15-Character GSTIN.')).toBeVisible()
    expect(savePaymentTerms).not.toHaveBeenCalled()
    expect(saveFirmDetails).not.toHaveBeenCalled()
  })

  it('blocks saving a day count outside 1–365', async () => {
    const { savePaymentTerms, user } = setup()
    await retype(user, 'Mark Overdue After', '400')
    await user.click(save())

    expect(await screen.findByText('Enter Whole Days From 1 To 365.')).toBeVisible()
    expect(savePaymentTerms).not.toHaveBeenCalled()
  })

  it('discards edits in every section', async () => {
    const { user } = setup({ firm: storedFirm })
    await retype(user, 'Mark Overdue After', '45')
    await retype(user, 'Firm Name', 'Changed')
    await user.click(discard())

    expect(screen.getByLabelText('Mark Overdue After')).toHaveValue(60)
    expect(screen.getByLabelText('Firm Name')).toHaveValue(storedFirm.firmName)
    expect(save()).toBeDisabled()
  })

  it('shows backend field errors against their field', async () => {
    const rejection = new ApiError(400, {
      status: 400,
      message: 'One or more fields are invalid',
      errors: [{ field: 'gstin', message: 'Rejected By Server' }],
    })
    const { user } = setup({ firm: storedFirm, saveFirmDetails: vi.fn().mockRejectedValue(rejection) })
    await retype(user, 'Firm Name', 'PSC & Co')
    await user.click(save())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(screen.queryByText(/Settings Saved/)).not.toBeInTheDocument()
  })
})
