import { errorMessage, fieldErrors, type ClientResponse, type ClientUpdateRequest, type ManagerResponse } from '@cl/api';
import {
  CLIENT_FIELDS,
  DELETE_CLIENT_IN_USE,
  EDIT_DISCOUNT_HINT,
  clientDetailsDefaults,
  clientDetailsSchema,
  clientName,
  deleteClientWarning,
  isClientDetailsComplete,
  toClientUpdateRequest,
  type ClientDetailsInput,
  type ClientDetailsValues,
  type ClientField,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { Button } from '@/components/ui/Button';

import { ClientDetailsFields } from './ClientDetailsFields';
import { DeleteButton } from './DeleteButton';

interface EditClientFormProps {
  client: ClientResponse;
  managers: readonly ManagerResponse[];
  managersLoading: boolean;
  onSave: (request: ClientUpdateRequest) => Promise<unknown>;
  saving: boolean;
  onDelete: () => Promise<unknown>;
  deleting: boolean;
  /** After a save. */
  onDone: () => void;
  /** After a delete; the client is gone, so the screen moves on. */
  onDeleted: () => void;
}

/** Edit Client: the client's own details only; companies are left as they are (as on web). */
export function EditClientForm({
  client,
  managers,
  managersLoading,
  onSave,
  saving,
  onDelete,
  deleting,
  onDone,
  onDeleted,
}: EditClientFormProps) {
  const form = useForm<ClientDetailsInput, unknown, ClientDetailsValues>({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: clientDetailsDefaults(client),
  });
  const {
    control,
    setError,
    formState: { isDirty },
  } = form;
  const complete = isClientDetailsComplete(useWatch({ control }));
  const [formError, setFormError] = useState<string>();

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await onSave(toClientUpdateRequest(values));
      onDone();
    } catch (error) {
      // Only the client's own fields are on this form; anything else is reported as a whole.
      const byField = Object.entries(fieldErrors(error)).filter(([path]) => path in CLIENT_FIELDS) as [ClientField, string][];
      byField.forEach(([field, message]) => setError(field, { message }));
      if (!byField.length) setFormError(errorMessage(error));
    }
  });

  return (
    <FormProvider {...form}>
      <ClientDetailsFields managers={managers} managersLoading={managersLoading} discountHint={EDIT_DISCOUNT_HINT} />
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button label={saving ? 'Saving…' : 'Save Changes'} disabled={saving || !isDirty || !complete} onPress={submit} />
      <DeleteButton
        label="Delete Client"
        itemName={clientName(client) || 'This Client'}
        description={deleteClientWarning(client)}
        conflictMessage={DELETE_CLIENT_IN_USE}
        onDelete={async () => {
          await onDelete();
          onDeleted();
        }}
        deleting={deleting}
      />
    </FormProvider>
  );
}
