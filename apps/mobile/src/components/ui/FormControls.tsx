import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { SelectField, type SelectOption } from './SelectField';
import { TextField } from './TextField';

type TextHints = Pick<TextInputProps, 'keyboardType' | 'multiline' | 'autoCapitalize' | 'autoComplete'>;

interface ControlProps<T extends FieldValues> {
  // The transformed (output) type is irrelevant to binding a field, so accept any.
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
}

/** A TextField bound to one react-hook-form field. */
export function TextControl<T extends FieldValues>({ control, name, label, ...hints }: ControlProps<T> & TextHints) {
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
  options,
  onPicked,
}: ControlProps<T> & { options: readonly SelectOption[]; onPicked?: (value: string) => void }) {
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
          onChange={(value) => {
            field.onChange(value);
            onPicked?.(value);
          }}
        />
      )}
    />
  );
}
