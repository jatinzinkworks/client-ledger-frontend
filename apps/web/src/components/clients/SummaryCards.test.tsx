import { clientSummaryCards, ledgerSummaryCards } from '@cl/schemas'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SummaryCards } from './SummaryCards'

const companySummary = {
  totalBilled: 127000,
  totalPaymentReceived: 68000,
  pending: 52650,
  totalDiscount: 6350,
  lastPayment: { date: '2026-08-28', amount: 30000 },
}

const setup = (cards: Parameters<typeof SummaryCards>[0]['cards']) =>
  render(<SummaryCards label="Summary For FY 2026–27" cards={cards} isLoading={false} error={null} onRetry={vi.fn()} />)

describe('SummaryCards', () => {
  it("shows a company's year: billed, received, pending, last payment and discount amount", () => {
    setup(ledgerSummaryCards(companySummary, '2026-27'))
    const cards = within(screen.getByRole('region', { name: 'Summary For FY 2026–27' }))
    expect(cards.getByText('₹1,27,000')).toBeVisible()
    expect(cards.getByText('₹68,000')).toHaveClass('text-success')
    expect(cards.getByText('₹52,650')).toHaveClass('text-destructive')
    expect(cards.getByText('28 Aug 2026')).toBeVisible()
    expect(cards.getByText('₹30,000')).toBeVisible()
    expect(cards.getByText('₹6,350')).toBeVisible()
    expect(cards.getByText('Given In FY 2026–27')).toBeVisible()
    expect(cards.queryByText(/%/)).not.toBeInTheDocument()
  })

  it("shows a client's year with its notes, and the discount as an amount", () => {
    setup(clientSummaryCards({ totalBilled: 184500, totalPaymentReceived: 80000, pending: 98150, totalDiscount: 6350 }, '2026-27', 17))
    const cards = within(screen.getByRole('region', { name: 'Summary For FY 2026–27' }))
    expect(cards.getAllByRole('term').map((t) => t.textContent)).toEqual(['Billed', 'Received', 'Pending', 'Discount'])
    expect(cards.getByText('17 Services')).toBeVisible()
    expect(cards.getByText('43% Of Billed')).toBeVisible()
    expect(cards.getByText('₹6,350')).toBeVisible()
  })

  it('shows nothing until the summary arrives', () => {
    const { container } = setup(undefined)
    expect(container).toBeEmptyDOMElement()
  })
})
