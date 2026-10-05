import { COMPANY_FIELDS, COMPANY_TYPE_OPTIONS, type ClientFormInput } from '@cl/schemas'
import { X } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'

interface CompanyFieldsProps {
  index: number
  /** Omitted for the only company — a client must keep at least one. */
  onRemove?: () => void
}

/** One company block of the onboarding form; must render inside the client form's FormProvider. */
export function CompanyFields({ index, onRemove }: CompanyFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ClientFormInput>()
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
    </fieldset>
  )
}
