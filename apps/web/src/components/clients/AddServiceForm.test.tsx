import { ApiError, type CatalogServiceResponse, type CompanyResponse } from '@cl/api'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { AddServiceForm } from './AddServiceForm'

const company: CompanyResponse = {
  id: 'co-1',
  companyName: 'Mehta Textiles Pvt Ltd',
  companyType: 'PRIVATE_LIMITED',
  address: 'Plot 14, MIDC Andheri East',
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
  { id: 'svc-audit', serviceName: 'Audit', standardFee: 50000, billingFrequency: 'ANNUAL', gstRatePercent: 18 },
]

function setup({ onAdd = vi.fn().mockResolvedValue(undefined), services = catalog } = {}) {
  const onDone = vi.fn()
  // The form uses Sheet parts (title, close), so render it inside an open sheet.
  render(
    <MemoryRouter>
      <Sheet open>
        <SheetContent>
          <AddServiceForm
            company={company}
            catalog={services}
            catalogLoading={false}
            catalogError={null}
            onRetryCatalog={vi.fn()}
            onAdd={onAdd}
            saving={false}
            onDone={onDone}
          />
        </SheetContent>
      </Sheet>
    </MemoryRouter>,
  )
  return { onAdd, onDone, user: userEvent.setup() }
}

const add = () => screen.getByRole('button', { name: 'Add Service' })

describe('AddServiceForm', () => {
  it("names the company and waits for a service", () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Add Service To Mehta Textiles Pvt Ltd' })).toBeVisible()
    expect(screen.getByLabelText('Date Delivered')).not.toHaveValue('')
    expect(add()).toBeDisabled()
  })

  it("shows the standard fee and the net charge at the company's discount", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText('Service'), 'svc-gst')

    const billing = within(screen.getByTestId('service-billing'))
    expect(billing.getByText('Monthly')).toBeVisible()
    expect(billing.getByText('Standard Fee ₹3,500 · GST 18% Added On Invoice')).toBeVisible()
    const summary = within(screen.getByLabelText('Charge Summary'))
    expect(summary.getByText('− ₹175')).toBeVisible()
    expect(summary.getByText('₹3,325')).toBeVisible()
    expect(summary.getByText('GST (18%)')).toBeVisible()
    expect(summary.getByText('+ ₹598.5')).toBeVisible()
    expect(summary.getByText('₹3,923.5')).toBeVisible()

    await user.type(screen.getByLabelText('Discount % (Optional)'), '10')
    expect(summary.getByText('₹3,150')).toBeVisible()
    expect(summary.getByText('₹3,717')).toBeVisible()
  })

  it('lists the next 5 due dates from the delivery date, each at the total with GST', async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText('Service'), 'svc-gst')
    await user.clear(screen.getByLabelText('Date Delivered'))
    await user.type(screen.getByLabelText('Date Delivered'), '2026-10-08')

    const schedule = within(screen.getByRole('region', { name: 'Payment Schedule' }))
    expect(schedule.getByText('Next 5 Due Dates')).toBeVisible()
    const rows = schedule.getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      '17 Nov 2026₹3,923.5',
      '27 Dec 2026₹3,923.5',
      '37 Jan 2027₹3,923.5',
      '47 Feb 2027₹3,923.5',
      '57 Mar 2027₹3,923.5',
    ])
  })

  it('omits a blank discount and note, so the backend applies the company discount', async () => {
    const { onAdd, onDone, user } = setup()
    await user.selectOptions(screen.getByLabelText('Service'), 'svc-audit')
    await user.clear(screen.getByLabelText('Date Delivered'))
    await user.type(screen.getByLabelText('Date Delivered'), '2026-09-27')
    await user.click(add())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onAdd).toHaveBeenCalledWith({ serviceId: 'svc-audit', deliveryDate: '2026-09-27' })
  })

  it('sends the discount and note when given', async () => {
    const { onAdd, user } = setup()
    await user.selectOptions(screen.getByLabelText('Service'), 'svc-gst')
    await user.type(screen.getByLabelText('Discount % (Optional)'), '7.5')
    await user.type(screen.getByLabelText('Period Or Note (Optional)'), '  Aug 2026 ')
    await user.click(add())

    await waitFor(() => expect(onAdd).toHaveBeenCalled())
    expect(onAdd.mock.calls[0][0]).toMatchObject({ serviceId: 'svc-gst', discountPercent: 7.5, comment: 'Aug 2026' })
  })

  it('shows backend field errors on the matching field', async () => {
    const rejection = new ApiError(400, { status: 400, errors: [{ field: 'comment', message: 'Rejected By Server' }] })
    const { onDone, user } = setup({ onAdd: vi.fn().mockRejectedValue(rejection) })
    await user.selectOptions(screen.getByLabelText('Service'), 'svc-gst')
    await user.click(add())

    expect(await screen.findByText('Rejected By Server')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('points to the Services page when the catalog is empty', () => {
    setup({ services: [] })
    expect(screen.getByRole('link', { name: 'Add A Service' })).toHaveAttribute('href', '/services')
    expect(add()).toBeDisabled()
  })
})
