import type { CompanyRequest, CompanyResponse } from '@cl/api';
import { DELETE_COMPANY_IN_USE, DELETE_COMPANY_WARNING, LAST_COMPANY_REASON, companyFormDefaults } from '@cl/schemas';

import { CompanyForm } from './CompanyForm';
import { DeleteButton } from './DeleteButton';

interface EditCompanyFormProps {
  company: CompanyResponse;
  onSave: (request: CompanyRequest) => Promise<unknown>;
  saving: boolean;
  onDone: () => void;
  onDelete: () => Promise<unknown>;
  deleting: boolean;
  /** After a delete; the screen leaves the deleted company. */
  onDeleted: () => void;
  /** The client's only company cannot be deleted (the backend refuses). */
  onlyCompany: boolean;
  /** Nor can one with services assigned. */
  hasServices: boolean;
}

/** Edit Company, as on web: the company's name, type, address and discount, and Delete Company. */
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
      submitLabel="Save Changes"
      defaults={companyFormDefaults(company)}
      onSave={onSave}
      saving={saving}
      onDone={onDone}
      requireChange
      footer={
        <DeleteButton
          label="Delete Company"
          itemName={company.companyName ?? 'This Company'}
          description={DELETE_COMPANY_WARNING}
          disabledReason={onlyCompany ? LAST_COMPANY_REASON : hasServices ? DELETE_COMPANY_IN_USE : undefined}
          conflictMessage={DELETE_COMPANY_IN_USE}
          onDelete={async () => {
            await onDelete();
            onDeleted();
          }}
          deleting={deleting}
        />
      }
    />
  );
}
