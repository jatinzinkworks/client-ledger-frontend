import type { LedgerEntryResponse, LedgerEntryUpdateRequest } from '@cl/api';
import {
  LEDGER_ENTRY_FIELDS,
  chargeBreakdown,
  deleteEntryWarning,
  formatApiDate,
  gstRateOptions,
  ledgerEntryDefaults,
  ledgerEntryFieldFromApi,
  ledgerEntryFormSchema,
  ledgerEntryName,
  toLedgerEntryUpdateRequest,
  type LedgerEntryFormInput,
  type LedgerEntryFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SelectControl, TextControl } from '@/components/ui/FormControls';
import { ReadOnlyField } from '@/components/ui/ReadOnlyField';

import { ChargeSummary } from './ChargeSummary';
import { confirmDelete, mapSaveError } from './formHelpers';

interface EditLedgerEntryFormProps {
  entry: LedgerEntryResponse;
  onSave: (request: LedgerEntryUpdateRequest) => Promise<unknown>;
  saving: boolean;
  onDelete: () => Promise<unknown>;
  deleting: boolean;
  onDone: () => void;
}

/**
 * Edit Ledger Entry: correct a service charge's fee, discount and GST rate (what it bills and
 * when are shown, not changed), and Delete Entry — as on web.
 */
export function EditLedgerEntryForm({ entry, onSave, saving, onDelete, deleting, onDone }: EditLedgerEntryFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useForm<LedgerEntryFormInput, unknown, LedgerEntryFormValues>({
    resolver: zodResolver(ledgerEntryFormSchema),
    defaultValues: ledgerEntryDefaults(entry),
  });
  const values = useWatch({ control });
  const [formError, setFormError] = useState<string>();
  // Preview the amounts the backend will work out, while the entries are valid.
  const parsed = ledgerEntryFormSchema.safeParse(values);
  const charge = parsed.success
    ? chargeBreakdown(parsed.data.serviceFee, parsed.data.discountPercent, parsed.data.gstRatePercent)
    : undefined;

  const submit = handleSubmit(async (v) => {
    setFormError(undefined);
    try {
      await onSave(toLedgerEntryUpdateRequest(v));
      onDone();
    } catch (error) {
      setFormError(mapSaveError(error, ledgerEntryFieldFromApi, setError));
    }
  });

  const field = LEDGER_ENTRY_FIELDS;
  return (
    <View className="gap-5">
      <ReadOnlyField label="Service" value={entry.serviceName ?? ''} />
      <View className="flex-row gap-4">
        <View className="flex-1">
          <ReadOnlyField label="Due Date" value={formatApiDate(entry.dueDate)} />
        </View>
        <View className="flex-1">
          <ReadOnlyField label="Financial Year" value={entry.financialYear ?? ''} />
        </View>
      </View>
      <TextControl
        control={control}
        name="serviceFee"
        label={field.serviceFee.label}
        hint={field.serviceFee.hint}
        keyboardType="decimal-pad"
      />
      <TextControl control={control} name="discountPercent" label={field.discountPercent.label} keyboardType="decimal-pad" />
      <SelectControl
        control={control}
        name="gstRatePercent"
        label={field.gstRatePercent.label}
        options={gstRateOptions(entry.gstRatePercent)}
      />
      {charge && <ChargeSummary {...charge} />}
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button label={saving ? 'Saving…' : 'Save Changes'} disabled={saving || !isDirty} onPress={submit} />
      <Button
        variant="destructive"
        label={deleting ? 'Deleting…' : 'Delete Entry'}
        disabled={deleting}
        onPress={() =>
          confirmDelete({
            label: 'Delete Entry',
            itemName: ledgerEntryName(entry),
            warning: deleteEntryWarning(entry),
            onDelete,
            onDone,
          })
        }
      />
    </View>
  );
}
