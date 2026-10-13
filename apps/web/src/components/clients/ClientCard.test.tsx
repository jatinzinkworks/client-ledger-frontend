import type { ClientSummaryResponse } from '@cl/api'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ClientCard } from './ClientCard'

const rajesh: ClientSummaryResponse = {
  id: 'c1',
  firstName: 'Rajesh',
  lastName: 'Mehta',
  email: 'rajesh@mehtatextiles.in',
  managerName: 'Neha Kulkarni',
  companyNames: ['Mehta Textiles Pvt Ltd', 'Mehta Exports LLP'],
  totalPending: 98150,
}

const renderCard = (client: ClientSummaryResponse) =>
  render(
    <MemoryRouter>
      <ClientCard client={client} />
    </MemoryRouter>,
  )

describe('ClientCard', () => {
  it('shows the client as in the mock, with what they still owe and their status', () => {
    renderCard(rajesh)
    for (const text of ['Rajesh Mehta', 'rajesh@mehtatextiles.in', 'Mehta Exports LLP', 'Pending', '₹98,150', 'Overdue', 'Neha Kulkarni']) {
      expect(screen.getByText(text)).toBeVisible()
    }
  })

  it('reads Settled at zero and In Credit when overpaid', () => {
    const { unmount } = renderCard({ ...rajesh, totalPending: 0 })
    expect(screen.getByText('Settled')).toBeVisible()
    unmount()
    renderCard({ ...rajesh, totalPending: -500 })
    expect(screen.getByText('In Credit')).toBeVisible()
  })

  it('leaves the figures out when the list does not carry them', () => {
    renderCard({ ...rajesh, totalPending: undefined })
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })
})
