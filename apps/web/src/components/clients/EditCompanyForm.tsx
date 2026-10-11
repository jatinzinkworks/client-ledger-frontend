import type { CompanyRequest, CompanyResponse } from '@cl/api'
import { DELETE_COMPANY_IN_USE, DELETE_COMPANY_WARNING, LAST_COMPANY_REASON, companyFormDefaults } from '@cl/schemas'

import { DeleteButton } from '@/components/DeleteButton'

import { CompanyForm } from './CompanyForm'

interface EditCompanyFormProps {
  company: CompanyResponse
  onSave: (request: CompanyRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
  onDelete: () => Promise<unknown>
  deleting: boolean
  /** After a delete; the page leaves the deleted company. */
  onDeleted: () => void
  /** The client's only company cannot be deleted (the backend refuses). */
  onlyCompany: boolean
  /** Nor can one with services assigned. */
  hasServices: boolean
}

/** The Edit Company side sheet: the company's name, type, address and discount, and Delete Company. */
export function EditCompanyForm({
  company,
  onSave,
  saving,
  onDone,
  onDelete,
  deleting,
  onDeleted,
  onlyCompany,
  hasServices,
}: EditCompanyFormProps) {
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
      footerStart={
        <DeleteButton
          label="Delete Company"
          itemName={company.companyName ?? 'This Company'}
          description={DELETE_COMPANY_WARNING}
          disabledReason={onlyCompany ? LAST_COMPANY_REASON : hasServices ? DELETE_COMPANY_IN_USE : undefined}
          conflictMessage={DELETE_COMPANY_IN_USE}
          onDelete={async () => {
            await onDelete()
            onDeleted()
          }}
          deleting={deleting}
        />
      }
    />
  )
}
