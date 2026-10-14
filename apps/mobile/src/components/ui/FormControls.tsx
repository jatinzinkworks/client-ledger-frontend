import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { DateField } from './DateField';
import { SelectField, type SelectOption } from './SelectField';
import { TextField } from './TextField';

type TextHints = Pick<TextInputProps, 'keyboardType' | 'multiline' | 'autoCapitalize' | 'autoComplete' | 'placeholder'>;

interface ControlProps<T extends FieldValues> {
  // The transformed (output) type is irrelevant to binding a field, so accept any.
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  /** A line under the field (hidden while it shows an error), e.g. what a blank value means. */
  hint?: string;
}

/** A TextField bound to one react-hook-form field. */
export function TextControl<T extends FieldValues>({ control, name, label, hint, ...hints }: ControlProps<T> & TextHints) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          hint={hint}
          {...hints}
        />
      )}
    />
  );
}

/** A SelectField bound to one react-hook-form field; `onPicked` runs after the value changes. */
export function SelectControl<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  options,
  onPicked,
  disabled,
  placeholder,
}: ControlProps<T> & {
  options: readonly SelectOption[];
  onPicked?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          label={label}
          value={field.value}
          options={options}
          error={fieldState.error?.message}
          hint={hint}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(value) => {
            field.onChange(value);
            onPicked?.(value);
          }}
        />
      )}
    />
  );
}

/** A DateField bound to one react-hook-form field holding an API date ("2026-10-15"). */
export function DateControl<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  maximumDate,
}: ControlProps<T> & { maximumDate?: Date }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          label={label}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
          hint={hint}
          maximumDate={maximumDate}
        />
      )}
    />
  );
}
