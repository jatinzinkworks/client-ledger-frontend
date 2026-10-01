import {
  DAY_OPTIONS,
  MONTH_OF_QUARTER_OPTIONS,
  MONTH_OPTIONS,
  SERVICE_FIELD_LABELS,
  formatDate,
  nextInvoiceDate,
  serviceFormSchema,
  type ServiceFormInput,
} from '@cl/schemas'
import { useFormContext, useWatch } from 'react-hook-form'

import { SelectField } from '@/components/form/SelectField'

/** The schedule panel: which month (quarterly / annual) and day invoices are raised, plus a preview. */
export function InvoiceScheduleFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ServiceFormInput>()
  const values = useWatch({ control })
  const billing = values.billingFrequency

  if (billing === 'ONE_OFF') {
    return (
      <p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
        One-Off Services Are Billed Once, So There Is No Invoice Schedule.
      </p>
    )
  }

  // Preview from whatever is currently valid; nothing until the schedule is complete.
  const parsed = serviceFormSchema.safeParse(values)
  const next = parsed.success
    ? nextInvoiceDate(parsed.data.billingFrequency, {
        dayOfMonth: parsed.data.dayOfMonth,
        monthOfQuarter: parsed.data.monthOfQuarter,
        month: parsed.data.month,
      })
    : undefined

  const monthField =
    billing === 'QUARTERLY'
      ? { name: 'monthOfQuarter' as const, options: MONTH_OF_QUARTER_OPTIONS }
      : billing === 'ANNUAL'
        ? { name: 'month' as const, options: MONTH_OPTIONS }
        : undefined

  return (
    <div className="flex flex-col gap-4 rounded-md bg-muted p-4">
      <span className="font-mono text-[11px] tracking-[0.08em] text-brand uppercase">Invoice Schedule</span>
      <div className="grid grid-cols-2 gap-4">
        {monthField && (
          <SelectField
            id={`service-${monthField.name}`}
            label={SERVICE_FIELD_LABELS[monthField.name]}
            options={monthField.options}
            placeholder="Choose…"
            error={errors[monthField.name]?.message}
            registration={register(monthField.name)}
          />
        )}
        <div className={monthField ? undefined : 'col-span-2'}>
          <SelectField
            id="service-dayOfMonth"
            label={SERVICE_FIELD_LABELS.dayOfMonth}
            options={DAY_OPTIONS}
            placeholder="Choose…"
            error={errors.dayOfMonth?.message}
            registration={register('dayOfMonth')}
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Next Invoice</span>
        <span className="font-bold">{next ? formatDate(next) : '—'}</span>
      </div>
    </div>
  )
}
