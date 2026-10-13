import { ApiError, errorMessage, type LedgerEntryResponse } from '@cl/api'
import { noLedgerEntries } from '@cl/schemas'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CompanyLedger } from './CompanyLedger'

const entry: LedgerEntryResponse = {
  id: 'e-1',
  serviceName: 'GST Return Filing',
  dueDate: '2026-10-07',
  financialYear: '2026-27',
  entryDate: '2026-10-13',
  serviceFee: 5000,
  discountPercent: 5,
  discountAmount: 250,
  taxableAmount: 4750,
  gstRatePercent: 18,
  gstAmount: 855,
  totalAmount: 5605,
}

const payment: LedgerEntryResponse = {
  id: 'p-1',
  entryType: 'PAYMENT',
  dueDate: '2026-09-27',
  financialYear: '2026-27',
  entryDate: '2026-09-27',
  totalAmount: -52650,
  paymentMethod: 'BANK_TRANSFER',
  paymentReference: 'UTR123',
}

function setup(overrides: Partial<Parameters<typeof CompanyLedger>[0]> = {}) {
  const props = {
    entries: [entry],
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
    page: 0,
    pageSize: 20,
    pageCount: 3,
    totalEntries: 45,
    onPageChange: vi.fn(),
    onGenerate: vi.fn().mockResolvedValue([entry, entry]),
    generating: false,
    onEdit: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
    deleting: false,
    ...overrides,
  }
  render(<CompanyLedger {...props} />)
  return { ...props, user: userEvent.setup() }
}

describe('CompanyLedger', () => {
  it('shows each entry with its amounts, and no totals', () => {
    setup()
    const cells = within(screen.getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(cells).toEqual([
      '7 Oct 2026',
      'GST Return Filing',
      '2026-27',
      '13 Oct 2026',
      '₹5,000',
      '₹2505%',
      '₹4,750',
      '₹85518%',
      '₹5,605',
      '',
    ])
    expect(screen.queryByLabelText('Ledger Totals')).not.toBeInTheDocument()
    expect(screen.getByText('45 Entries')).toBeVisible()
  })

  it('names the financial year shown', () => {
    setup({ financialYear: '2026-27' })
    expect(screen.getByText('45 Entries · FY 2026–27')).toBeVisible()
  })

  it('opens Edit Ledger Entry from the service name or anywhere on the row', async () => {
    const { onEdit, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit GST Return Filing · Due 7 Oct 2026' }))
    await user.click(screen.getByText('2026-27'))
    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenCalledWith(entry)
  })

  it('deletes an entry after confirmation, without opening it', async () => {
    const { onDelete, onEdit, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete Entry: GST Return Filing · Due 7 Oct 2026' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Not Billed Again For This Date')
    await user.click(screen.getByRole('button', { name: 'Delete Entry' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('e-1'))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('shows a payment as an amount received, with no rates, and opens it to edit', async () => {
    const { onEdit, user } = setup({ entries: [payment] })
    const cells = within(screen.getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(cells).toEqual([
      '27 Sep 2026',
      'PaymentBank Transfer · UTR123',
      '2026-27',
      '27 Sep 2026',
      '—',
      '—',
      '—',
      '—',
      '− ₹52,650',
      '',
    ])
    await user.click(screen.getByRole('button', { name: 'Edit Payment · 27 Sep 2026' }))
    await user.click(screen.getByText('UTR123', { exact: false }))
    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenCalledWith(payment)
  })

  it('warns that a deleted payment counts as owed again', async () => {
    const { onDelete, user } = setup({ entries: [payment] })
    await user.click(screen.getByRole('button', { name: 'Delete Entry: Payment · 27 Sep 2026' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Counts As Owed Again')
    await user.click(screen.getByRole('button', { name: 'Delete Entry' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('p-1'))
  })

  it('pages through the entries', async () => {
    const { onPageChange, user } = setup()
    expect(screen.getByText('Showing 1–20 Of 45')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('stops at the last page', () => {
    setup({ page: 2 })
    expect(screen.getByText('Showing 41–45 Of 45')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('generates service entries and says how many were created', async () => {
    const { onGenerate, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Generate Service Entries' }))
    expect(onGenerate).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('2 Entries Generated.')).toBeVisible()
  })

  it('says when nothing was due', async () => {
    const { user } = setup({ onGenerate: vi.fn().mockResolvedValue([]) })
    await user.click(screen.getByRole('button', { name: 'Generate Service Entries' }))
    expect(await screen.findByText('Nothing Is Due Yet, So No New Entries Were Generated.')).toBeVisible()
  })

  it('shows why generating failed', async () => {
    const error = new ApiError(500, { status: 500, message: 'Something Went Wrong' })
    const { user } = setup({ onGenerate: vi.fn().mockRejectedValue(error) })
    await user.click(screen.getByRole('button', { name: 'Generate Service Entries' }))
    expect(await screen.findByText(errorMessage(error))).toBeVisible()
  })

  it('invites generating before any entry exists', () => {
    setup({ entries: [], totalEntries: 0, pageCount: 0, financialYear: '2026-27' })
    expect(screen.getByText(noLedgerEntries('2026-27'))).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Ledger Pages' })).not.toBeInTheDocument()
  })
})
