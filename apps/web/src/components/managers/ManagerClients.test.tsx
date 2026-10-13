import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { ManagerClients } from './ManagerClients'

const renderList = (props: Partial<Parameters<typeof ManagerClients>[0]> = {}) =>
  render(
    <MemoryRouter>
      <ManagerClients clients={[]} isLoading={false} error={null} onRetry={vi.fn()} {...props} />
    </MemoryRouter>,
  )

describe('ManagerClients', () => {
  it('lists each client with their companies, what they owe and their status', () => {
    renderList({
      clients: [
        { id: 'c1', firstName: 'Rohan', lastName: 'Mehta', companyNames: ['Mehta Textiles Pvt Ltd'], totalPending: 19630 },
        { id: 'c2', firstName: 'Priya', lastName: 'Nair', companyNames: ['Nair Studio'], totalPending: 0 },
      ],
    })
    expect(screen.getByRole('link', { name: 'Rohan Mehta' })).toHaveAttribute('href', '/clients/c1')
    for (const text of ['Mehta Textiles Pvt Ltd', '₹19,630', 'Overdue', 'Settled']) {
      expect(screen.getByText(text)).toBeVisible()
    }
  })

  it('says when the manager has no clients', () => {
    renderList()
    expect(screen.getByText('No Clients Yet.')).toBeVisible()
  })
})
