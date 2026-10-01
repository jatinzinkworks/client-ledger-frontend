import { ApiError, errorMessage, fieldErrors, type CatalogServiceRequest, type CatalogServiceResponse } from '@cl/api';
import {
  BILLING_OPTIONS,
  CATEGORY_OPTIONS,
  DAY_OPTIONS,
  MONTH_OF_QUARTER_OPTIONS,
  MONTH_OPTIONS,
  SERVICE_FIELD_LABELS,
  formatDate,
  gstRateOptions,
  nextInvoiceDate,
  scheduleDefaultsFor,
  serviceFieldFromApi,
  serviceFormDefaults,
  serviceFormSchema,
  toServiceRequest,
  usageLabel,
  type BillingFrequency,
  type Category,
  type ServiceField,
  type ServiceFormInput,
  type ServiceFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { Alert, Text, View, type TextInputProps } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SelectField, type SelectOption } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';

type Form = Control<ServiceFormInput, unknown, ServiceFormValues>;
type TextHints = Pick<TextInputProps, 'keyboardType' | 'multiline' | 'autoCapitalize'>;

/** A TextField bound to one form field. */
function TextControl({ control, name, ...hints }: { control: Form; name: ServiceField } & TextHints) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={SERVICE_FIELD_LABELS[name]}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          {...hints}
        />
      )}
    />
  );
}

/** A SelectField bound to one form field; `onPicked` runs after the value changes. */
function SelectControl({
  control,
  name,
  options,
  onPicked,
}: {
  control: Form;
  name: ServiceField;
  options: readonly SelectOption[];
  onPicked?: (value: string) => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          label={SERVICE_FIELD_LABELS[name]}
          value={field.value}
          options={options}
          error={fieldState.error?.message}
          onChange={(value) => {
            field.onChange(value);
            onPicked?.(value);
          }}
        />
      )}
    />
  );
}

/** The schedule section: month (quarterly / annual) and day, with a next-invoice preview. */
function InvoiceScheduleFields({ control }: { control: Form }) {
  const values = useWatch({ control });
  const billing = values.billingFrequency;

  if (billing === 'ONE_OFF') {
    return (
      <Text className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
        One-Off Services Are Billed Once, So There Is No Invoice Schedule.
      </Text>
    );
  }

  const parsed = serviceFormSchema.safeParse(values);
  const next = parsed.success
    ? nextInvoiceDate(parsed.data.billingFrequency, {
        dayOfMonth: parsed.data.dayOfMonth,
        monthOfQuarter: parsed.data.monthOfQuarter,
        month: parsed.data.month,
      })
    : undefined;

  return (
    <View className="gap-4 rounded-md bg-muted p-4">
      <Text className="font-mono text-[11px] uppercase tracking-widest text-brand">Invoice Schedule</Text>
      {billing === 'QUARTERLY' && <SelectControl control={control} name="monthOfQuarter" options={MONTH_OF_QUARTER_OPTIONS} />}
      {billing === 'ANNUAL' && <SelectControl control={control} name="month" options={MONTH_OPTIONS} />}
      <SelectControl control={control} name="dayOfMonth" options={DAY_OPTIONS} />
      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-sm text-muted-foreground">Next Invoice</Text>
        <Text className="text-sm font-bold text-foreground">{next ? formatDate(next) : '—'}</Text>
      </View>
    </View>
  );
}

interface ServiceEditorProps {
  /** The service being edited, or undefined to create one. */
  service?: CatalogServiceResponse;
  defaultCategory?: Category;
  onSave: (request: CatalogServiceRequest) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  saving: boolean;
  deleting: boolean;
  onDone: () => void;
}

// Same schema, defaults, request mapping and error handling as the web editor.
export function ServiceEditor({ service, defaultCategory, onSave, onDelete, saving, deleting, onDone }: ServiceEditorProps) {
  const isNew = !service;
  const { control, handleSubmit, setError, setValue, getValues } = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: serviceFormDefaults(service, defaultCategory),
  });
  const [formError, setFormError] = useState<string>();

  const submit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await onSave(toServiceRequest(values));
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('serviceName', { message: 'A Service With This Name Already Exists.' });
        return;
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = serviceFieldFromApi(path);
        return field ? [[field, message] as const] : [];
      });
      byField.forEach(([field, message]) => setError(field, { message }));
      if (!byField.length) setFormError(errorMessage(error));
    }
  });

  // Switching billing pre-fills the schedule month it now needs, rather than leaving a blank.
  const onBillingPicked = (billing: string) => {
    const defaults = scheduleDefaultsFor(billing as BillingFrequency);
    if (!getValues('monthOfQuarter')) setValue('monthOfQuarter', defaults.monthOfQuarter);
    if (!getValues('month')) setValue('month', defaults.month);
  };

  const confirmDelete = () =>
    Alert.alert(`Delete ${service?.serviceName ?? 'Service'}?`, 'The Service Is Removed From The Catalog. This Cannot Be Undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
            onDone();
          } catch (error) {
            Alert.alert('Could Not Delete', errorMessage(error));
          }
        },
      },
    ]);

  const inUse = (service?.usedByCompanies ?? 0) > 0;

  return (
    <View className="gap-5">
      {!isNew && (
        <Text className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
          Used By {usageLabel(service.usedByCompanies).replace('Not Used Yet', 'No Companies Yet')}
        </Text>
      )}
      <TextControl control={control} name="serviceName" autoCapitalize="sentences" />
      <TextControl control={control} name="description" multiline autoCapitalize="sentences" />
      <SelectControl control={control} name="category" options={CATEGORY_OPTIONS} />
      <SelectControl control={control} name="billingFrequency" options={BILLING_OPTIONS} onPicked={onBillingPicked} />
      <TextControl control={control} name="standardFee" keyboardType="decimal-pad" />
      <SelectControl control={control} name="gstRatePercent" options={gstRateOptions(service?.gstRatePercent)} />
      <InvoiceScheduleFields control={control} />
      {!isNew && (
        <Text className="text-xs text-muted-foreground">
          Fee Changes Apply To New Charges Only. Past Charges Keep Their Original Amount.
        </Text>
      )}
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button label={saving ? 'Saving…' : isNew ? 'Add Service' : 'Save Changes'} disabled={saving} onPress={submit} />
      {!isNew && (
        <View className="gap-1">
          <Button
            variant="destructive"
            label={deleting ? 'Deleting…' : 'Delete Service'}
            disabled={inUse || deleting}
            onPress={confirmDelete}
          />
          {inUse && (
            <Text className="text-center text-xs text-muted-foreground">
              Companies Still Subscribe To This Service, So It Can't Be Deleted.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
