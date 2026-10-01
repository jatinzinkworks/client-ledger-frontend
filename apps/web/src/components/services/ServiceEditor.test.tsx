import { ApiError, type CatalogServiceResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { ServiceEditor } from './ServiceEditor'

const incomeTax: CatalogServiceResponse = {
  id: 'svc-1',
  serviceName: 'Income tax return — individual',
  description: 'ITR preparation and e-filing',
  category: 'TAX',
  billingFrequency: 'ANNUAL',
  standardFee: 5000,
  gstRatePercent: 18,
  invoiceSchedule: { dayOfMonth: 15, month: 'JULY' },
  usedByCompanies: 1,
}

function setup({ service = undefined as CatalogServiceResponse | undefined, onSave = vi.fn().mockResolvedValue(undefined) } = {}) {
  const onDone = vi.fn()
  const onDelete = vi.fn().mockResolvedValue(undefined)
  // The editor uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <Sheet open>
      <SheetContent>
        <ServiceEditor
          service={service}
          onSave={onSave}
          onDelete={onDelete}
          saving={false}
          deleting={false}
          onDone={onDone}
        />
      </SheetContent>
    </Sheet>,
  )
  return { onSave, onDone, onDelete, user: userEvent.setup() }
}

describe('ServiceEditor', () => {
  it('loads an existing service, its schedule and usage', () => {
    setup({ service: incomeTax })
    expect(screen.getByRole('heading', { name: 'Edit Service' })).toBeVisible()
    expect(screen.getByLabelText('Service Name')).toHaveValue('Income tax return — individual')
    expect(screen.getByLabelText('Billing')).toHaveValue('ANNUAL')
    expect(screen.getByLabelText('Invoice Month')).toHaveValue('JULY')
    expect(screen.getByLabelText('Day')).toHaveValue('15')
    expect(screen.getByText('Used By 1 Company')).toBeVisible()
    // Delete is blocked while a company still subscribes.
    expect(screen.getByRole('button', { name: 'Delete Service' })).toBeDisabled()
  })

  it('creates a quarterly service, pre-filling the month it needs', async () => {
    const { onSave, onDone, user } = setup()
    await user.type(screen.getByLabelText('Service Name'), 'TDS return')
    await user.type(screen.getByLabelText('Standard Fee'), '4000')
    await user.selectOptions(screen.getByLabelText('Billing'), 'Quarterly')
    await user.selectOptions(screen.getByLabelText('Day'), '15th')
    expect(screen.getByLabelText('Invoice Month')).toHaveValue('FIRST_MONTH')
    await user.click(screen.getByRole('button', { name: 'Add Service' }))

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        serviceName: 'TDS return',
        category: 'COMPLIANCE',
        billingFrequency: 'QUARTERLY',
        standardFee: 4000,
        gstRatePercent: 18,
        invoiceSchedule: { dayOfMonth: 15, monthOfQuarter: 'FIRST_MONTH' },
      }),
    )
    expect(onDone).toHaveBeenCalled()
  })

  it('hides the schedule for one-off billing and sends none', async () => {
    const { onSave, user } = setup()
    await user.type(screen.getByLabelText('Service Name'), 'Company incorporation')
    await user.type(screen.getByLabelText('Standard Fee'), '15000')
    await user.selectOptions(screen.getByLabelText('Billing'), 'One-Off')
    expect(screen.queryByLabelText('Day')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Service' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('invoiceSchedule')
  })

  it('validates before saving', async () => {
    const { onSave, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Add Service' }))
    expect(await screen.findByText('Enter The Service Name.')).toBeVisible()
    expect(screen.getByText('Enter The Standard Fee.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('reports a duplicate name against the name field', async () => {
    const conflict = new ApiError(409, { status: 409, code: 'RESOURCE_ALREADY_EXISTS', message: 'exists' }, 'exists')
    const { onDone, user } = setup({ service: incomeTax, onSave: vi.fn().mockRejectedValue(conflict) })
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('A Service With This Name Already Exists.')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('maps nested schedule errors from the backend onto the right field', async () => {
    const invalid = new ApiError(400, {
      status: 400,
      errors: [{ field: 'invoiceSchedule.dayOfMonth', message: 'Rejected By Server' }],
    })
    const { user } = setup({ service: incomeTax, onSave: vi.fn().mockRejectedValue(invalid) })
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(await screen.findByText('Rejected By Server')).toBeVisible()
  })
})
