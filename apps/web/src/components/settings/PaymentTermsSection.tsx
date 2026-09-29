import {
  PAYMENT_TERMS_DAY_FIELDS,
  PAYMENT_TERMS_SECTION,
  REMINDER_OFF,
  paymentDueExample,
  reminderOptions,
  type PaymentTermsFormInput,
} from '@cl/schemas'
import { useFormContext, useWatch } from 'react-hook-form'

import { FIELD_ERROR, FIELD_LABEL } from '@/components/form/fieldStyles'
import { NativeSelect } from '@/components/form/NativeSelect'

import { DaysInput } from './DaysInput'
import { SettingsSection } from './SettingsSection'

const DAY_FIELDS = ['paymentDueAfterDays', 'markOverdueAfterDays'] as const

/** Payment Terms fields; must render inside the settings form's FormProvider. */
export function PaymentTermsSection() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<PaymentTermsFormInput>()
  const [dueDays, remindersOn, reminderDays] = useWatch({
    control,
    name: ['paymentDueAfterDays', 'paymentReminderEnabled', 'paymentReminderDays'],
  })

  const hintFor = (name: (typeof DAY_FIELDS)[number]) => {
    const due = Number(dueDays)
    return name === 'paymentDueAfterDays' && Number.isInteger(due) && due > 0
      ? paymentDueExample(due)
      : PAYMENT_TERMS_DAY_FIELDS[name].hint
  }

  // One select drives two API fields: "off" disables reminders, a number enables them.
  const reminderValue = remindersOn && reminderDays != null ? String(reminderDays) : REMINDER_OFF
  const onReminderChange = (value: string) => {
    const opts = { shouldDirty: true, shouldValidate: true }
    setValue('paymentReminderEnabled', value !== REMINDER_OFF, opts)
    if (value !== REMINDER_OFF) setValue('paymentReminderDays', Number(value), opts)
  }
  const reminderError = errors.paymentReminderDays?.message

  return (
    <SettingsSection {...PAYMENT_TERMS_SECTION}>
      <div className="grid gap-4 sm:grid-cols-2">
        {DAY_FIELDS.map((name) => (
          <DaysInput
            key={name}
            id={name}
            label={PAYMENT_TERMS_DAY_FIELDS[name].label}
            hint={hintFor(name)}
            error={errors[name]?.message}
            registration={register(name, { valueAsNumber: true })}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="paymentReminder" className={FIELD_LABEL}>
          {PAYMENT_TERMS_DAY_FIELDS.paymentReminderDays.label}
        </label>
        <NativeSelect
          id="paymentReminder"
          value={reminderValue}
          onChange={(e) => onReminderChange(e.target.value)}
          options={reminderOptions(typeof reminderDays === 'number' ? reminderDays : undefined)}
          aria-invalid={!!reminderError}
        />
        {reminderError && <p className={FIELD_ERROR}>{reminderError}</p>}
      </div>
    </SettingsSection>
  )
}
