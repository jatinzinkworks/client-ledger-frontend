import { ApiError, type LedgerEntryResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { RecordPaymentForm, type PaymentCompany } from './RecordPaymentForm'

const textiles: PaymentCompany = { id: 'co-1', name: 'Mehta Textiles Pvt Ltd' }
const exports: PaymentCompany = { id: 'co-2', name: 'Mehta Exports LLP' }
const balances: Record<string, number> = { 'co-1': 52650, 'co-2': 0 }

function setup({
  companies = [textiles],
  pendingFor = (id: string): number | undefined => balances[id],
  onSave = vi.fn().mockResolvedValue(undefined),
  payment = undefined as LedgerEntryResponse | undefined,
} = {}) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <RecordPaymentForm
          clientName="Rajesh Mehta"
          companies={companies}
          pendingFor={pendingFor}
          onSave={onSave}
          saving={false}
          onDone={onDone}
          payment={payment}
        />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDone, user: userEvent.setup() }
}

const save = () => screen.getByRole('button', { name: 'Save Payment' })

describe('RecordPaymentForm', () => {
  it("shows one company fixed, with what it owes as the amount, today, by bank transfer", () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Record Payment' })).toBeVisible()
    expect(screen.getByLabelText('Client')).toHaveTextContent('Rajesh Mehta')
    expect(screen.getByLabelText('Company')).toHaveTextContent('Mehta Textiles Pvt Ltd')
    expect(screen.getByText('Pending For This Company')).toBeVisible()
    expect(screen.getByText('₹52,650')).toBeVisible()
    expect(screen.getByLabelText('Amount Received')).toHaveValue(52650)
    expect(screen.getByLabelText('Date Received')).not.toHaveValue('')
    expect(screen.getByLabelText('Method')).toHaveValue('BANK_TRANSFER')
    expect(save()).toBeEnabled()
  })

  it('hides the pending strip while the balance is unknown', () => {
    setup({ pendingFor: () => undefined })
    expect(screen.queryByText('Pending For This Company')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Amount Received')).toHaveValue(null)
    expect(save()).toBeDisabled()
  })

  it("offers a choice of companies, suggesting the chosen one's balance", async () => {
    const { onSave, user } = setup({ companies: [textiles, exports] })
    expect(screen.queryByText('Pending For This Company')).not.toBeInTheDocument()
    expect(save()).toBeDisabled()

    await user.selectOptions(screen.getByLabelText('Company'), 'co-1')
    expect(screen.getByText('₹52,650')).toBeVisible()
    expect(screen.getByLabelText('Amount Received')).toHaveValue(52650)

    await user.selectOptions(screen.getByLabelText('Company'), 'co-2')
    expect(screen.getByText('₹0')).toBeVisible()
    expect(screen.getByLabelText('Amount Received')).toHaveValue(null)

    await user.type(screen.getByLabelText('Amount Received'), '1000')
    await user.click(save())
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith('co-2', expect.objectContaining({ amountReceived: 1000 }))
  })

  it('keeps a typed amount when the company changes', async () => {
    const { user } = setup({ companies: [textiles, exports] })
    await user.type(screen.getByLabelText('Amount Received'), '750')
    await user.selectOptions(screen.getByLabelText('Company'), 'co-1')
    expect(screen.getByLabelText('Amount Received')).toHaveValue(750)
  })

  it('records a payment for the company, omitting a blank comment', async () => {
    const { onSave, onDone, user } = setup()
    await user.selectOptions(screen.getByLabelText('Method'), 'UPI')
    await user.type(screen.getByLabelText('Reference'), 'UTR123')
    await user.click(save())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith('co-1', {
      amountReceived: 52650,
      dateReceived: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      method: 'UPI',
      reference: 'UTR123',
    })
  })

  it('rejects a payment dated in the future', async () => {
    const { onSave, user } = setup()
    await user.clear(screen.getByLabelText('Date Received'))
    await user.type(screen.getByLabelText('Date Received'), '2999-01-01')
    await user.click(save())

    expect(await screen.findByText('The Date Received Cannot Be In The Future.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows a backend field error on its field and stays open', async () => {
    const rejection = new ApiError(400, { status: 400, errors: [{ field: 'dateReceived', message: 'Rejected By Server' }] })
    const { onDone, user } = setup({ onSave: vi.fn().mockRejectedValue(rejection) })
    await user.click(save())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('offers only the methods the backend accepts', () => {
    setup()
    const methods = Array.from(screen.getByLabelText('Method').querySelectorAll('option')).map((o) => o.textContent)
    expect(methods).toEqual(['Bank Transfer', 'UPI', 'Cheque', 'Cash'])
  })

  describe('editing a payment', () => {
    const payment: LedgerEntryResponse = {
      id: 'p-1',
      companyId: 'co-1',
      entryType: 'PAYMENT',
      totalAmount: -30000,
      dueDate: '2026-08-28',
      paymentMethod: 'CHEQUE',
      paymentReference: '000123',
      comment: 'Part payment',
    }

    it('starts from the payment, without the pending strip, and saves only once changed', () => {
      setup({ payment })
      expect(screen.getByRole('heading', { name: 'Edit Payment' })).toBeVisible()
      expect(screen.getByLabelText('Amount Received')).toHaveValue(30000)
      expect(screen.getByLabelText('Date Received')).toHaveValue('2026-08-28')
      expect(screen.getByLabelText('Method')).toHaveValue('CHEQUE')
      expect(screen.getByLabelText('Reference')).toHaveValue('000123')
      expect(screen.getByLabelText('Comment')).toHaveValue('Part payment')
      expect(screen.queryByText('Pending For This Company')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    })

    it('saves every detail, clearing a blanked comment', async () => {
      const { onSave, onDone, user } = setup({ payment })
      await user.clear(screen.getByLabelText('Amount Received'))
      await user.type(screen.getByLabelText('Amount Received'), '32000')
      await user.clear(screen.getByLabelText('Comment'))
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => expect(onDone).toHaveBeenCalled())
      expect(onSave).toHaveBeenCalledWith('co-1', {
        amountReceived: 32000,
        dateReceived: '2026-08-28',
        method: 'CHEQUE',
        reference: '000123',
      })
    })
  })
})
