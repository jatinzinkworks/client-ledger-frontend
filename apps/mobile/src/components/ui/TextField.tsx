import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

type PassThrough = Pick<
  TextInputProps,
  'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'textContentType' | 'multiline' | 'placeholder'
>;

interface TextFieldProps extends PassThrough {
  label: string;
  error?: string;
  value: unknown;
  onChangeText: (text: string) => void;
  onBlur: () => void;
}

/** A labelled text input with its validation message underneath. */
export function TextField({ label, error, value, onChangeText, onBlur, multiline, ...inputProps }: TextFieldProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        onBlur={onBlur}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.mutedForeground}
        className={cn(
          'rounded-md border bg-background px-3 py-2.5 text-base text-foreground',
          multiline && 'min-h-24',
          error ? 'border-destructive' : 'border-input',
        )}
        {...inputProps}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  );
}
