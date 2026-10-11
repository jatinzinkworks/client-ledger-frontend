import { emptyCompany, type AddCompanyFormInput } from '@cl/schemas'
import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'

import { CompanyFields } from './CompanyFields'

interface CompanyListFieldsProps {
  /** Most company blocks the form may hold. */
  max: number
}

/**
 * The editable list of company blocks with "Add Another Company", shared by Onboard Client and
 * Add Company. The last remaining block cannot be removed. Must render inside a FormProvider
 * whose values hold a `companies` array.
 */
export function CompanyListFields({ max }: CompanyListFieldsProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<AddCompanyFormInput>()
  const companies = useFieldArray({ control, name: 'companies' })

  return (
    <>
      {companies.fields.map((company, index) => (
        <CompanyFields
          key={company.id}
          index={index}
          onRemove={companies.fields.length > 1 ? () => companies.remove(index) : undefined}
        />
      ))}
      {errors.companies?.root?.message && <p className="text-sm text-destructive">{errors.companies.root.message}</p>}
      {companies.fields.length < max && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => companies.append(emptyCompany())}
          className="self-start px-2 font-bold text-brand hover:text-brand"
        >
          <Plus /> Add Another Company
        </Button>
      )}
    </>
  )
}
