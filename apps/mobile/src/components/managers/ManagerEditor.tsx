import { ApiError, errorMessage, fieldErrors, type ManagerRequest, type ManagerResponse } from '@cl/api';
import {
  MANAGER_FIELD_LABELS,
  ROLE_OPTIONS,
  managerFieldFromApi,
  managerFormDefaults,
  managerFormSchema,
  managerName,
  toManagerRequest,
  type ManagerFormInput,
  type ManagerFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SelectControl, TextControl } from '@/components/ui/FormControls';

interface ManagerEditorProps {
  /** The manager being edited, or undefined to add one. */
  manager?: ManagerResponse;
  onSave: (request: ManagerRequest) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  saving: boolean;
  deleting: boolean;
  onDone: () => void;
}

// Same schema, defaults, request mapping and error handling as the web editor.
export function ManagerEditor({ manager, onSave, onDelete, saving, deleting, onDone }: ManagerEditorProps) {
  const isNew = !manager;
  const { control, handleSubmit, setError } = useForm<ManagerFormInput, unknown, ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: managerFormDefaults(manager),
  });
  const [formError, setFormError] = useState<string>();

  const submit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await onSave(toManagerRequest(values));
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: 'A Manager With This Email Already Exists.' });
        return;
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = managerFieldFromApi(path);
        return field ? [[field, message] as const] : [];
      });
      byField.forEach(([field, message]) => setError(field, { message }));
      if (!byField.length) setFormError(errorMessage(error));
    }
  });

  const confirmDelete = () =>
    Alert.alert(
      `Delete ${(manager && managerName(manager)) || 'Manager'}?`,
      'The Manager Is Removed From The Team. This Cannot Be Undone.',
      [
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
      ],
    );

  const label = MANAGER_FIELD_LABELS;
  return (
    <View className="gap-5">
      <TextControl control={control} name="firstName" label={label.firstName} autoCapitalize="words" />
      <TextControl control={control} name="lastName" label={label.lastName} autoCapitalize="words" />
      <TextControl
        control={control}
        name="email"
        label={label.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="off"
      />
      <SelectControl control={control} name="role" label={label.role} options={ROLE_OPTIONS} />
      <TextControl control={control} name="mobileNumber" label={label.mobileNumber} keyboardType="phone-pad" />
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button label={saving ? 'Saving…' : isNew ? 'Add Manager' : 'Save Changes'} disabled={saving} onPress={submit} />
      {!isNew && (
        <Button
          variant="destructive"
          label={deleting ? 'Deleting…' : 'Delete Manager'}
          disabled={deleting}
          onPress={confirmDelete}
        />
      )}
    </View>
  );
}
