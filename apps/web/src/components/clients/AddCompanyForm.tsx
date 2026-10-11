import type { ClientResponse, CompanyRequest } from '@cl/api'
import { TOO_MANY_COMPANIES, addCompanyTitle, companiesLeft, emptyCompany } from '@cl/schemas'

import { CompanyForm } from './CompanyForm'

interface AddCompanyFormProps {
  client: ClientResponse
  onAdd: (request: CompanyRequest) => Promise<unknown>
  saving: boolean
  onDone: () => void
}

/** The Add Company side sheet: one new company for an existing client (at most 50 per client). */
export function AddCompanyForm({ client, onAdd, saving, onDone }: AddCompanyFormProps) {
  const full = companiesLeft(client.companies?.length ?? 0) === 0
  return (
    <CompanyForm
      title={addCompanyTitle(client)}
      description="Add a company to this client"
      submitLabel="Add Company"
      defaults={emptyCompany()}
      onSave={onAdd}
      saving={saving}
      onDone={onDone}
      conflictMessage={TOO_MANY_COMPANIES}
      unavailable={full ? <p className="text-sm text-muted-foreground">{TOO_MANY_COMPANIES}</p> : undefined}
    />
  )
}
