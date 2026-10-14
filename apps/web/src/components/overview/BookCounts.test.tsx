import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { BookCounts } from './BookCounts'

const overview = {
  totalBilled: 200000,
  totalPaymentReceived: 150000,
  pending: 50000,
  totalClients: 4,
  totalCompanies: 10,
  totalServices: 30,
}

describe('BookCounts', () => {
  it('counts clients (linked), companies and services', () => {
    render(
      <MemoryRouter>
        <BookCounts overview={overview} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '4' })).toHaveAttribute('href', '/clients')
    expect(screen.getByText('10')).toBeVisible()
    expect(screen.getByText('30')).toBeVisible()
    expect(screen.getByText('2.5 Companies Per Client')).toBeVisible()
  })
})
