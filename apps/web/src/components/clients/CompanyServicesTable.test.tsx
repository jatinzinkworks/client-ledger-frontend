import type { ServiceAssignmentResponse } from '@cl/api'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CompanyServicesTable } from './CompanyServicesTable'

const services: ServiceAssignmentResponse[] = [
  {
    id: 'a-1',
    serviceName: 'GST Return Filing',
    serviceType: 'MONTHLY',
    serviceFee: 3500,
    gstRatePercent: 18,
    deliveryDate: '2026-10-11',
    nextDueDate: '2026-11-05',
    discountPercent: 5,
  },
]

describe('CompanyServicesTable', () => {
  it('shows the billing cycle, dates, fee, net charge, GST rate and total in their own columns', () => {
    render(
      <CompanyServicesTable
        services={services}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deleting={false}
      />,
    )

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual([
      'Service',
      'Billing',
      'Delivery Date',
      'Next Due Date',
      'Comment',
      'Fee',
      'Discount',
      'Net Charge',
      'GST',
      'Total',
      'Delete',
    ])

    const cells = within(screen.getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(cells).toEqual(['GST Return Filing', 'Monthly', '11 Oct 2026', '5 Nov 2026', '—', '₹3,500', '5%', '₹3,325', '18%', '₹3,923.5', ''])
  })

  it('opens Edit Service from the name or anywhere on the row', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(
      <CompanyServicesTable
        services={services}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        deleting={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit GST Return Filing' }))
    await user.click(screen.getByText('5 Nov 2026'))
    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenCalledWith(services[0])
  })

  it('deletes a service after confirmation, without opening it', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(
      <CompanyServicesTable
        services={services}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        deleting={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete Service: GST Return Filing' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete GST Return Filing?')
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete Service' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('a-1'))
    expect(onEdit).not.toHaveBeenCalled()
  })
})
