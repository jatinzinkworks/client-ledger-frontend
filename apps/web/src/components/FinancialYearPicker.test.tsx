import { currentFinancialYear, financialYearOptions } from '@cl/schemas'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { FinancialYearProvider } from '@/financialYear/FinancialYearProvider'
import { useFinancialYear } from '@/financialYear/useFinancialYear'

import { FinancialYearPicker } from './FinancialYearPicker'

/** Shows the year the rest of the app would read. */
function Reader() {
  const { financialYear } = useFinancialYear()
  return <p data-testid="selected">{financialYear}</p>
}

function setup() {
  render(
    <FinancialYearProvider>
      <FinancialYearPicker />
      <Reader />
    </FinancialYearProvider>,
  )
  return userEvent.setup()
}

describe('FinancialYearPicker', () => {
  it('starts at the current financial year and offers the last 5', () => {
    setup()
    const picker = screen.getByLabelText('Financial Year')
    expect(picker).toHaveValue(currentFinancialYear())
    const options = Array.from(picker.querySelectorAll('option')).map((o) => o.value)
    expect(options).toEqual(financialYearOptions().map((o) => o.value))
    expect(options).toHaveLength(5)
  })

  it('changes the financial year for the whole app', async () => {
    const user = setup()
    const previous = financialYearOptions()[1].value
    await user.selectOptions(screen.getByLabelText('Financial Year'), previous)
    expect(screen.getByTestId('selected')).toHaveTextContent(previous)
  })
})
