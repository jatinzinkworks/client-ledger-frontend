import { emptyCompany, type AddCompanyFormInput } from '@cl/schemas';
import { Plus } from 'lucide-react-native';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Pressable, Text } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

import { CompanyFields } from './CompanyFields';

/**
 * The editable list of company blocks with "Add Another Company", for Onboard Client. The last
 * remaining block cannot be removed. Must render inside a FormProvider whose values hold a
 * `companies` array.
 */
export function CompanyListFields({ max }: { max: number }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<AddCompanyFormInput>();
  const companies = useFieldArray({ control, name: 'companies' });
  const colors = useThemeColors();

  return (
    <>
      {companies.fields.map((company, index) => (
        <CompanyFields
          key={company.id}
          index={index}
          numbered
          onRemove={companies.fields.length > 1 ? () => companies.remove(index) : undefined}
        />
      ))}
      {errors.companies?.root?.message && (
        <Text className="text-sm text-destructive">{errors.companies.root.message}</Text>
      )}
      {companies.fields.length < max && (
        <Pressable
          accessibilityRole="button"
          onPress={() => companies.append(emptyCompany())}
          className="min-h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
        >
          <Plus size={18} color={colors.brand} />
          <Text className="font-bold text-brand">Add Another Company</Text>
        </Pressable>
      )}
    </>
  );
}
