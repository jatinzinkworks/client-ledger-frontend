import type { LedgerEntryResponse, PaymentRequest } from '@cl/api';
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SETTLEMENT_NOTE,
  RECORD_PAYMENT_FIELDS,
  deleteEntryWarning,
  formatInr,
  isRecordPaymentComplete,
  ledgerEntryName,
  paymentFieldFromApi,
  paymentFormDefaults,
  recordPaymentDefaults,
  recordPaymentFormSchema,
  suggestedPaymentAmount,
  toPaymentRequest,
  type RecordPaymentFormInput,
  type RecordPaymentFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DateControl, SelectControl, TextControl } from '@/components/ui/FormControls';
import { ReadOnlyField } from '@/components/ui/ReadOnlyField';

import { confirmDelete, mapSaveError } from './formHelpers';

export interface PaymentCompany {
  id: string;
  name: string;
}

interface RecordPaymentFormProps {
  clientName: string;
  /** The companies a payment can be for: one is shown fixed, several are a choice. */
  companies: readonly PaymentCompany[];
  /** What a company still owes (negative when overpaid); undefined while unknown. */
  pendingFor: (companyId: string) => number | undefined;
  onSave: (companyId: string, request: PaymentRequest) => Promise<unknown>;
  saving: boolean;
  onDone: () => void;
  /** Editing: the payment's ledger entry. The form starts from it, saves only once changed, and can delete it. */
  payment?: LedgerEntryResponse;
  onDelete?: () => Promise<unknown>;
  deleting?: boolean;
}

/**
 * Record Payment — for one company (shown fixed) or a choice of the client's companies — or,
 * given a `payment`, Edit Payment. Same schema, defaults and request as the web form.
 */
export function RecordPaymentForm({
  clientName,
  companies,
  pendingFor,
  onSave,
  saving,
  onDone,
  payment,
  onDelete,
  deleting,
}: RecordPaymentFormProps) {
  const only = companies.length === 1 ? companies[0] : undefined;
  const initialCompany = only?.id ?? '';
  const {
    control,
    handleSubmit,
    setError,
    resetField,
    getFieldState,
    formState: { isDirty },
  } = useForm<RecordPaymentFormInput, unknown, RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: payment
      ? paymentFormDefaults(payment)
      : recordPaymentDefaults(initialCompany, initialCompany ? pendingFor(initialCompany) : undefined),
  });
  const values = useWatch({ control });
  const [formError, setFormError] = useState<string>();
  // What is pending already counts a payment being edited, so the strip is for new payments only.
  const pending = !payment && values.companyId ? pendingFor(values.companyId) : undefined;

  // The amount suggests the chosen company's balance — also once it arrives after the screen
  // opened — until it is typed in.
  useEffect(() => {
    // Made the field's default, so it stays not dirty and the next company can replace it too.
    if (!payment && !getFieldState('amountReceived').isDirty) {
      resetField('amountReceived', { defaultValue: suggestedPaymentAmount(pending) });
    }
  }, [payment, pending, getFieldState, resetField]);

  const submit = handleSubmit(async (v) => {
    setFormError(undefined);
    try {
      await onSave(v.companyId, toPaymentRequest(v));
      onDone();
    } catch (error) {
      setFormError(mapSaveError(error, paymentFieldFromApi, setError));
    }
  });

  const field = RECORD_PAYMENT_FIELDS;
  return (
    <View className="gap-5">
      <ReadOnlyField label="Client" value={clientName} />
      {only ? (
        <ReadOnlyField label={field.companyId.label} value={only.name} />
      ) : (
        <SelectControl
          control={control}
          name="companyId"
          label={field.companyId.label}
          placeholder={field.companyId.placeholder}
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
        />
      )}
      {pending != null && (
        <View className="flex-row items-center justify-between gap-4 rounded-md bg-muted px-4 py-3">
          <Text className="flex-1 text-muted-foreground">Pending For This Company</Text>
          <Text className="text-xl font-bold text-foreground">{formatInr(pending)}</Text>
        </View>
      )}
      <TextControl control={control} name="amountReceived" label={field.amountReceived.label} keyboardType="decimal-pad" />
      <DateControl control={control} name="dateReceived" label={field.dateReceived.label} maximumDate={new Date()} />
      <SelectControl control={control} name="method" label={field.method.label} options={PAYMENT_METHOD_OPTIONS} />
      <TextControl
        control={control}
        name="reference"
        label={field.reference.label}
        placeholder={field.reference.placeholder}
        autoComplete="off"
        autoCapitalize="characters"
      />
      <TextControl
        control={control}
        name="comment"
        label={field.comment.label}
        placeholder={field.comment.placeholder}
        hint={field.comment.hint}
        multiline
      />
      <Text className="text-sm text-muted-foreground">{PAYMENT_SETTLEMENT_NOTE}</Text>
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button
        label={saving ? 'Saving…' : payment ? 'Save Changes' : 'Save Payment'}
        disabled={saving || !isRecordPaymentComplete(values) || (!!payment && !isDirty)}
        onPress={submit}
      />
      {payment && onDelete && (
        <Button
          variant="destructive"
          label={deleting ? 'Deleting…' : 'Delete Payment'}
          disabled={deleting}
          onPress={() =>
            confirmDelete({
              label: 'Delete Payment',
              itemName: ledgerEntryName(payment),
              warning: deleteEntryWarning(payment),
              onDelete,
              onDone,
            })
          }
        />
      )}
    </View>
  );
}
