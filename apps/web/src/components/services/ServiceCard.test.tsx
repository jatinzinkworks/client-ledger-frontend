import type { CatalogServiceResponse } from '@cl/api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ServiceCard } from './ServiceCard'

const gstFiling: CatalogServiceResponse = {
  id: 'b41e7a52-9c3d-4f16-8ad0-5e2b9c7f1d38',
  serviceName: 'GST return filing',
  description: 'GSTR-1 and GSTR-3B for the month',
  category: 'COMPLIANCE',
  billingFrequency: 'MONTHLY',
  standardFee: 3500,
  gstRatePercent: 18,
  invoiceSchedule: { dayOfMonth: 11 },
  usedByCompanies: 5,
}

describe('ServiceCard', () => {
  it('shows the catalog entry as in the mock', () => {
    render(<ServiceCard service={gstFiling} onSelect={vi.fn()} />)
    for (const text of [
      'Compliance',
      'Monthly',
      'GST return filing',
      'GSTR-1 and GSTR-3B for the month',
      '₹3,500',
      '+ GST 18%',
      '5 Companies',
      'Invoiced 11th Of Each Month',
    ]) {
      expect(screen.getByText(text)).toBeVisible()
    }
  })

  it('opens the editor for its service when clicked', async () => {
    const onSelect = vi.fn()
    render(<ServiceCard service={gstFiling} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit GST return filing' }))
    expect(onSelect).toHaveBeenCalledWith(gstFiling)
  })
})
