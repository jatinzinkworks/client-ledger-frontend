import { ApiError, type CatalogServiceResponse } from '@cl/api'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { AdjustPricesForm } from './AdjustPricesForm'

const services: CatalogServiceResponse[] = [
  { id: 'a', serviceName: 'GST return filing', category: 'COMPLIANCE', standardFee: 3500 },
  { id: 'b', serviceName: 'Tax audit', category: 'AUDIT', standardFee: 35000 },
]

function setup(onApply = vi.fn().mockResolvedValue([])) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <AdjustPricesForm services={services} onApply={onApply} applying={false} onDone={onDone} />
      </SheetContent>
    </Sheet>,
  )
  return { onApply, onDone, user: userEvent.setup() }
}

const rowFor = (name: string) => screen.getByText(name).closest('tr') as HTMLElement

describe('AdjustPricesForm', () => {
  it('previews +10% rounded to 100 for every service', () => {
    setup()
    expect(within(rowFor('GST return filing')).getByText('₹3,900')).toBeVisible()
    expect(within(rowFor('Tax audit')).getByText('₹38,500')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Apply +10% To 2' })).toBeEnabled()
  })

  it('follows the change typed and the category chosen', async () => {
    const { user } = setup()
    await user.clear(screen.getByLabelText('Change By (%)'))
    await user.type(screen.getByLabelText('Change By (%)'), '-10')
    await user.click(screen.getByRole('button', { name: 'Audit' }))
    expect(screen.queryByText('GST return filing')).not.toBeInTheDocument()
    expect(within(rowFor('Tax audit')).getByText('₹31,500')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Apply −10% To 1' })).toBeEnabled()
  })

  it('saves the new fee of each service and closes', async () => {
    const { onApply, onDone, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Apply +10% To 2' }))
    expect(onApply).toHaveBeenCalledWith({
      updates: [
        { serviceId: 'a', standardFee: 3900 },
        { serviceId: 'b', standardFee: 38500 },
      ],
    })
    expect(onDone).toHaveBeenCalled()
  })

  it('stays open with the reason when saving fails', async () => {
    const { onDone, user } = setup(vi.fn().mockRejectedValue(new ApiError(404, undefined, 'Unknown service: a')))
    await user.click(screen.getByRole('button', { name: 'Apply +10% To 2' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown service: a')
    expect(onDone).not.toHaveBeenCalled()
  })
})
