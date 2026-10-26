import type { ManagerResponse } from '@cl/api';
import { CLIENT_FIELDS, managerOptions, type ClientDetailsInput, type ClientField } from '@cl/schemas';
import { router } from 'expo-router';
import { useFormContext } from 'react-hook-form';
import { Text, type TextInputProps } from 'react-native';

import { DateControl, SelectControl, TextControl } from '@/components/ui/FormControls';

interface ClientDetailsFieldsProps {
  managers: readonly ManagerResponse[];
  managersLoading: boolean;
  /** Overrides the discount hint (editing words it differently from onboarding). */
  discountHint?: string;
}

// The client id is Onboard Client's alone (it cannot be edited), so OnboardClientForm renders it.
type TextFieldName = Exclude<ClientField, 'managerId' | 'birthday' | 'clientId'>;

// Keyboard and capitalisation per field — the web's input types.
const INPUT_HINTS: Readonly<Record<TextFieldName, Pick<TextInputProps, 'keyboardType' | 'autoCapitalize'>>> = {
  firstName: { autoCapitalize: 'words' },
  lastName: { autoCapitalize: 'words' },
  phone: { keyboardType: 'phone-pad' },
  email: { keyboardType: 'email-address', autoCapitalize: 'none' },
  discountPercent: { keyboardType: 'decimal-pad' },
};

/**
 * The client's own fields — name, phone, email, manager, birthday and discount — shared by Onboard Client
 * and Edit Client. Must render inside a FormProvider whose values include these fields.
 */
export function ClientDetailsFields({ managers, managersLoading, discountHint }: ClientDetailsFieldsProps) {
  const { control } = useFormContext<ClientDetailsInput>();

  const textField = (field: TextFieldName, hint = CLIENT_FIELDS[field].hint) => (
    <TextControl
      control={control}
      name={field}
      label={CLIENT_FIELDS[field].label}
      placeholder={CLIENT_FIELDS[field].placeholder}
      hint={hint}
      autoComplete="off"
      {...INPUT_HINTS[field]}
    />
  );

  return (
    <>
      {textField('firstName')}
      {textField('lastName')}
      {textField('phone')}
      {textField('email')}
      <SelectControl
        control={control}
        name="managerId"
        label={CLIENT_FIELDS.managerId.label}
        placeholder={managersLoading ? 'Loading Managers…' : CLIENT_FIELDS.managerId.placeholder}
        options={managerOptions(managers, { withRole: true })}
        hint={CLIENT_FIELDS.managerId.hint}
        disabled={managersLoading}
      />
      {!managersLoading && managers.length === 0 && (
        <Text className="text-sm text-muted-foreground">
          No Managers Yet.{' '}
          <Text accessibilityRole="link" className="font-bold text-brand" onPress={() => router.navigate('/managers')}>
            Add A Manager
          </Text>{' '}
          To Assign One.
        </Text>
      )}
      <DateControl control={control} name="birthday" label={CLIENT_FIELDS.birthday.label} maximumDate={new Date()} />
      {textField('discountPercent', discountHint ?? CLIENT_FIELDS.discountPercent.hint)}
    </>
  );
}
