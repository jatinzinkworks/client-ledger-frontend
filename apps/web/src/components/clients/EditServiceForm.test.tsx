import type { CatalogServiceResponse, CompanyResponse, ServiceAssignmentResponse } from '@cl/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { EditServiceForm } from './EditServiceForm'

const company: CompanyResponse = {
  id: 'co-1',
  companyName: 'Mehta Textiles Pvt Ltd',
  discountPercent: 5,
}

const catalog: CatalogServiceResponse[] = [
  {
    id: 'svc-gst',
    serviceName: 'GST Return Filing',
    standardFee: 3500,
    billingFrequency: 'MONTHLY',
    gstRatePercent: 18,
    invoiceSchedule: { dayOfMonth: 7 },
  },
]

const assignment: ServiceAssignmentResponse = {
  id: 'a-1',
  serviceId: 'svc-gst',
  serviceName: 'GST Return Filing',
  serviceType: 'MONTHLY',
  serviceFee: 3500,
  deliveryDate: '2026-10-15',
  discountPercent: 0,
  comment: 'Sep 2026',
}

function setup(onSave = vi.fn().mockResolvedValue(undefined), onDelete = vi.fn().mockResolvedValue(undefined)) {
  const onDone = vi.fn()
  render(
    <MemoryRouter>
      <Sheet open>
        <SheetContent>
          <EditServiceForm
            company={company}
            assignment={assignment}
            catalog={catalog}
            catalogLoading={false}
            catalogError={null}
            onRetryCatalog={vi.fn()}
            onSave={onSave}
            saving={false}
            onDone={onDone}
            onDelete={onDelete}
            deleting={false}
          />
        </SheetContent>
      </Sheet>
    </MemoryRouter>,
  )
  return { onSave, onDone, onDelete, user: userEvent.setup() }
}

const save = () => screen.getByRole('button', { name: 'Save Changes' })

describe('EditServiceForm', () => {
  it('shows the service fixed, the stored values, and waits for a change', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Edit Service' })).toBeVisible()
    expect(screen.queryByRole('combobox', { name: 'Service' })).not.toBeInTheDocument()
    expect(screen.getByText('GST Return Filing')).toBeVisible()
    expect(screen.getByLabelText('Date Delivered')).toHaveValue('2026-10-15')
    expect(screen.getByLabelText('Discount % (Optional)')).toHaveValue(0)
    expect(screen.getByLabelText('Period Or Note (Optional)')).toHaveValue('Sep 2026')
    expect(save()).toBeDisabled()
  })

  it('sends the date, discount and note only', async () => {
    const { onSave, onDone, user } = setup()
    await user.clear(screen.getByLabelText('Date Delivered'))
    await user.type(screen.getByLabelText('Date Delivered'), '2026-10-20')
    await user.click(save())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      deliveryDate: '2026-10-20',
      discountPercent: 0,
      comment: 'Sep 2026',
    })
  })

  it('omits a cleared note, which clears it', async () => {
    const { onSave, user } = setup()
    await user.clear(screen.getByLabelText('Period Or Note (Optional)'))
    await user.click(save())

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('comment')
  })

  it('deletes the service after confirmation and closes', async () => {
    const { onDelete, onDone, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete Service' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete GST Return Filing?')
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete Service' }))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
