import { COMPANY_FIELDS, COMPANY_TYPE_OPTIONS, EDIT_OPENING_BALANCE_HINTS, type AddCompanyFormInput } from '@cl/schemas';
import { X } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

import { DateControl, SelectControl, TextControl } from '@/components/ui/FormControls';
import { useThemeColors } from '@/theme/useThemeColors';
import { EYEBROW } from '@/utils/typography';

interface CompanyFieldsProps {
  index: number;
  /** Omitted for the only company — a client must keep at least one. */
  onRemove?: () => void;
  /** Shows "Company N" above the block (the onboarding list numbers its companies). */
  numbered?: boolean;
  /** Edit Company: the opening balance fields say that blank keeps the stored balance. */
  editing?: boolean;
}

/** iOS's decimal pad has no minus key, and an opening balance in credit is negative. */
const SIGNED_KEYBOARD = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

/**
 * One company block. Must render inside a FormProvider whose values hold a `companies` array —
 * Onboard Client, Add Company and Edit Company all do.
 */
export function CompanyFields({ index, onRemove, numbered = false, editing = false }: CompanyFieldsProps) {
  const { control } = useFormContext<AddCompanyFormInput>();
  const colors = useThemeColors();
  const name = <F extends keyof typeof COMPANY_FIELDS>(field: F) => `companies.${index}.${field}` as const;

  return (
    <View className="gap-4 rounded-md border border-border bg-muted p-4">
      {(numbered || onRemove) && (
        <View className="flex-row items-center justify-between">
          <Text className={EYEBROW}>Company {index + 1}</Text>
          {onRemove && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove Company ${index + 1}`}
              hitSlop={8}
              onPress={onRemove}
              className="h-8 w-8 items-center justify-center rounded-md active:opacity-60"
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      )}
      <TextControl
        control={control}
        name={name('companyName')}
        label={COMPANY_FIELDS.companyName.label}
        placeholder={COMPANY_FIELDS.companyName.placeholder}
        autoComplete="off"
        autoCapitalize="words"
      />
      <SelectControl
        control={control}
        name={name('companyType')}
        label={COMPANY_FIELDS.companyType.label}
        options={COMPANY_TYPE_OPTIONS}
      />
      <TextControl
        control={control}
        name={name('address')}
        label={COMPANY_FIELDS.address.label}
        placeholder={COMPANY_FIELDS.address.placeholder}
        multiline
      />
      <TextControl
        control={control}
        name={name('discountPercent')}
        label={COMPANY_FIELDS.discountPercent.label}
        hint={COMPANY_FIELDS.discountPercent.hint}
        keyboardType="decimal-pad"
      />
      <TextControl
        control={control}
        name={name('openingBalance')}
        label={COMPANY_FIELDS.openingBalance.label}
        placeholder={COMPANY_FIELDS.openingBalance.placeholder}
        hint={editing ? EDIT_OPENING_BALANCE_HINTS.openingBalance : COMPANY_FIELDS.openingBalance.hint}
        keyboardType={SIGNED_KEYBOARD}
      />
      <DateControl
        control={control}
        name={name('openingBalanceDate')}
        label={COMPANY_FIELDS.openingBalanceDate.label}
        hint={editing ? EDIT_OPENING_BALANCE_HINTS.openingBalanceDate : COMPANY_FIELDS.openingBalanceDate.hint}
        maximumDate={new Date()}
      />
    </View>
  );
}
