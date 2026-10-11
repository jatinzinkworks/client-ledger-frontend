import type { CompanyRequest, CompanyResponse } from '@cl/api'
import { companyFormDefaults } from '@cl/schemas'

import { CompanyForm } from './CompanyForm'

interface EditCompanyFormProps {
  company: CompanyResponse
  onSave: (request: CompanyRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
}

/** The Edit Company side sheet: the company's name, type, address and discount. */
export function EditCompanyForm({ company, onSave, saving, onDone }: EditCompanyFormProps) {
  return (
    <CompanyForm
      title="Edit Company"
      description={`Edit ${company.companyName ?? 'this company'}`}
      submitLabel="Save Changes"
      defaults={companyFormDefaults(company)}
      onSave={onSave}
      saving={saving}
      onDone={onDone}
      requireChange
    />
  )
}
