import type { PaymentTermsRequest } from '@cl/api';
import {
  PAYMENT_TERMS_DAY_FIELDS,
  REMINDER_OFF,
  paymentDueExample,
  paymentTermsFormSchema,
  reminderOptions,
  toPaymentTermsRequest,
  type PaymentTermsDayField,
  type PaymentTermsFormInput,
  type PaymentTermsFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DaysField } from '@/components/ui/DaysField';
import { SelectField } from '@/components/ui/SelectField';
import { applyFieldErrors } from '@/utils/applyFieldErrors';

const DAY_FIELDS = ['paymentDueAfterDays', 'markOverdueAfterDays'] as const;

interface PaymentTermsFormProps {
  defaultValues: PaymentTermsFormInput;
  onSubmit: (request: PaymentTermsRequest) => Promise<unknown>;
  saving: boolean;
}

// Same schema, defaults, labels and reminder presets as the web form — only the rendering differs.
export function PaymentTermsForm({ defaultValues, onSubmit, saving }: PaymentTermsFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentTermsFormInput, unknown, PaymentTermsFormValues>({
    resolver: zodResolver(paymentTermsFormSchema),
    defaultValues,
  });
  const [dueDays, remindersOn, reminderDays] = useWatch({
    control,
    name: ['paymentDueAfterDays', 'paymentReminderEnabled', 'paymentReminderDays'],
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toPaymentTermsRequest(values));
      reset(values);
    } catch (error) {
      applyFieldErrors(error, setError);
    }
  });

  const hintFor = (name: PaymentTermsDayField) => {
    const due = Number(dueDays);
    return name === 'paymentDueAfterDays' && Number.isInteger(due) && due > 0
      ? paymentDueExample(due)
      : PAYMENT_TERMS_DAY_FIELDS[name].hint;
  };

  // One picker drives two API fields: "off" disables reminders, a number enables them.
  const reminderValue = remindersOn && reminderDays != null ? String(reminderDays) : REMINDER_OFF;
  const onReminderChange = (value: string) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    setValue('paymentReminderEnabled', value !== REMINDER_OFF, opts);
    if (value !== REMINDER_OFF) setValue('paymentReminderDays', Number(value), opts);
  };

  return (
    <View className="gap-5">
      {DAY_FIELDS.map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <DaysField
              label={PAYMENT_TERMS_DAY_FIELDS[name].label}
              hint={hintFor(name)}
              error={errors[name]?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      ))}

      <SelectField
        label={PAYMENT_TERMS_DAY_FIELDS.paymentReminderDays.label}
        value={reminderValue}
        options={reminderOptions(typeof reminderDays === 'number' ? reminderDays : undefined)}
        onChange={onReminderChange}
        error={errors.paymentReminderDays?.message}
      />

      <Button label={saving ? 'Saving…' : 'Save Payment Terms'} disabled={saving || !isDirty} onPress={submit} />
    </View>
  );
}
