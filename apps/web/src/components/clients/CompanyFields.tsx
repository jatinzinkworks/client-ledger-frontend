import { COMPANY_FIELDS, COMPANY_TYPE_OPTIONS, EDIT_OPENING_BALANCE_HINTS, type AddCompanyFormInput } from '@cl/schemas'
import { X } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'

interface CompanyFieldsProps {
  index: number
  /** Omitted for the only company — a client must keep at least one. */
  onRemove?: () => void
  /** Edit Company: the opening balance fields say that blank keeps the stored balance. */
  editing?: boolean
}

/**
 * One company block. Must render inside a FormProvider whose values hold a `companies` array —
 * Onboard Client and Add Company both do.
 */
export function CompanyFields({ index, onRemove, editing = false }: CompanyFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AddCompanyFormInput>()
  const fieldErrors = errors.companies?.[index]
  const id = (field: string) => `company-${index}-${field}`

  return (
    <fieldset className="relative flex flex-col gap-4 rounded-md bg-muted p-5">
      <legend className="sr-only">Company {index + 1}</legend>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove Company ${index + 1}`}
          className="absolute top-2 right-2 size-8 text-muted-foreground"
        >
          <X />
        </Button>
      )}
      <TextField
        id={id('companyName')}
        label={COMPANY_FIELDS.companyName.label}
        placeholder={COMPANY_FIELDS.companyName.placeholder}
        autoComplete="off"
        error={fieldErrors?.companyName?.message}
        registration={register(`companies.${index}.companyName`)}
      />
      <SelectField
        id={id('companyType')}
        label={COMPANY_FIELDS.companyType.label}
        options={COMPANY_TYPE_OPTIONS}
        error={fieldErrors?.companyType?.message}
        registration={register(`companies.${index}.companyType`)}
      />
      <TextField
        id={id('address')}
        label={COMPANY_FIELDS.address.label}
        placeholder={COMPANY_FIELDS.address.placeholder}
        multiline
        error={fieldErrors?.address?.message}
        registration={register(`companies.${index}.address`)}
      />
      <TextField
        id={id('discountPercent')}
        label={COMPANY_FIELDS.discountPercent.label}
        hint={COMPANY_FIELDS.discountPercent.hint}
        type="number"
        error={fieldErrors?.discountPercent?.message}
        registration={register(`companies.${index}.discountPercent`)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={id('openingBalance')}
          label={COMPANY_FIELDS.openingBalance.label}
          placeholder={COMPANY_FIELDS.openingBalance.placeholder}
          hint={editing ? EDIT_OPENING_BALANCE_HINTS.openingBalance : COMPANY_FIELDS.openingBalance.hint}
          type="number"
          error={fieldErrors?.openingBalance?.message}
          registration={register(`companies.${index}.openingBalance`)}
        />
        <TextField
          id={id('openingBalanceDate')}
          label={COMPANY_FIELDS.openingBalanceDate.label}
          hint={editing ? EDIT_OPENING_BALANCE_HINTS.openingBalanceDate : COMPANY_FIELDS.openingBalanceDate.hint}
          type="date"
          error={fieldErrors?.openingBalanceDate?.message}
          registration={register(`companies.${index}.openingBalanceDate`)}
        />
      </div>
    </fieldset>
  )
}
