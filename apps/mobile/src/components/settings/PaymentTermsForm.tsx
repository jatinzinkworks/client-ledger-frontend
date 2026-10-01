import type { PaymentTermsRequest } from '@cl/api';
import {
  PAYMENT_TERMS_DAY_FIELDS,
  paymentTermsFormSchema,
  toPaymentTermsRequest,
  type PaymentTermsDayField,
  type PaymentTermsFormInput,
  type PaymentTermsFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DaysField } from '@/components/ui/DaysField';
import { useThemeColors } from '@/theme/useThemeColors';
import { applyFieldErrors } from '@/utils/applyFieldErrors';

interface PaymentTermsFormProps {
  defaultValues: PaymentTermsFormInput;
  onSubmit: (request: PaymentTermsRequest) => Promise<unknown>;
  saving: boolean;
}

// Same schema, defaults and labels as the web form — only the rendering differs.
export function PaymentTermsForm({ defaultValues, onSubmit, saving }: PaymentTermsFormProps) {
  const colors = useThemeColors();
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentTermsFormInput, unknown, PaymentTermsFormValues>({
    resolver: zodResolver(paymentTermsFormSchema),
    defaultValues,
  });
  const remindersOn = useWatch({ control, name: 'paymentReminderEnabled' });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toPaymentTermsRequest(values));
      reset(values);
    } catch (error) {
      applyFieldErrors(error, setError);
    }
  });

  const dayField = (name: PaymentTermsDayField) => (
    <Controller
      key={name}
      control={control}
      name={name}
      render={({ field }) => (
        <DaysField
          {...PAYMENT_TERMS_DAY_FIELDS[name]}
          error={errors[name]?.message}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );

  return (
    <View className="gap-5">
      {(['paymentDueAfterDays', 'markOverdueAfterDays'] as const).map(dayField)}

      <View className="flex-row items-center justify-between gap-4 rounded-md border border-border p-4">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-bold text-foreground">Payment Reminders</Text>
          <Text className="text-sm text-muted-foreground">Remind Clients About Outstanding Invoices</Text>
        </View>
        <Controller
          control={control}
          name="paymentReminderEnabled"
          render={({ field }) => (
            <Switch
              accessibilityLabel="Payment Reminders"
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary, false: colors.muted }}
            />
          )}
        />
      </View>
      {remindersOn && dayField('paymentReminderDays')}

      <Button label={saving ? 'Saving…' : 'Save Payment Terms'} disabled={saving || !isDirty} onPress={submit} />
    </View>
  );
}
