import type { FirmDetailsRequest } from '@cl/api';
import {
  FIRM_DETAILS_FIELDS,
  firmDetailsFormSchema,
  toFirmDetailsRequest,
  type FirmDetailsField,
  type FirmDetailsFormInput,
  type FirmDetailsFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { applyFieldErrors } from '@/utils/applyFieldErrors';

type InputHints = Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'textContentType' | 'multiline'>;

// Keyboard and autofill hints per field; order follows the web layout, stacked for a phone.
const FIELDS: readonly ({ name: FirmDetailsField } & InputHints)[] = [
  { name: 'firmName', autoCapitalize: 'words', autoComplete: 'organization', textContentType: 'organizationName' },
  { name: 'gstin', autoCapitalize: 'characters' },
  { name: 'firmRegistrationNo', autoCapitalize: 'characters' },
  { name: 'email', keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email', textContentType: 'emailAddress' },
  { name: 'phone', keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber' },
  { name: 'address', multiline: true, autoCapitalize: 'words', autoComplete: 'street-address', textContentType: 'fullStreetAddress' },
];

interface FirmDetailsFormProps {
  defaultValues: FirmDetailsFormInput;
  onSubmit: (request: FirmDetailsRequest) => Promise<unknown>;
  saving: boolean;
}

// Same schema, labels and request mapping as the web form — only the rendering differs.
export function FirmDetailsForm({ defaultValues, onSubmit, saving }: FirmDetailsFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<FirmDetailsFormInput, unknown, FirmDetailsFormValues>({
    resolver: zodResolver(firmDetailsFormSchema),
    defaultValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toFirmDetailsRequest(values));
      reset(values);
    } catch (error) {
      applyFieldErrors(error, setError);
    }
  });

  return (
    <View className="gap-4">
      {FIELDS.map(({ name, ...hints }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <TextField
              label={FIRM_DETAILS_FIELDS[name].label}
              error={errors[name]?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              {...hints}
            />
          )}
        />
      ))}
      <Button label={saving ? 'Saving…' : 'Save Firm Details'} disabled={saving || !isDirty} onPress={submit} />
    </View>
  );
}
