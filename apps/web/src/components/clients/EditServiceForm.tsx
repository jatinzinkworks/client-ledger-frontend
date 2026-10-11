import type { ServiceAssignmentResponse, ServiceAssignmentUpdateRequest } from '@cl/api'
import { DELETE_SERVICE_WARNING, serviceAssignmentDefaults, toServiceUpdateRequest } from '@cl/schemas'

import { DeleteButton } from '@/components/DeleteButton'

import { ServiceAssignmentForm, type ServiceAssignmentFormProps } from './ServiceAssignmentForm'

interface EditServiceFormProps extends ServiceAssignmentFormProps {
  assignment: ServiceAssignmentResponse
  onSave: (request: ServiceAssignmentUpdateRequest) => Promise<unknown>
  onDelete: () => Promise<unknown>
  deleting: boolean
}

/**
 * The Edit Service side sheet: a delivered service's date, discount and note (not the service),
 * and Delete Service.
 */
export function EditServiceForm({ assignment, onSave, onDelete, deleting, ...props }: EditServiceFormProps) {
  return (
    <ServiceAssignmentForm
      {...props}
      assignment={assignment}
      title="Edit Service"
      description={`Edit ${assignment.serviceName ?? 'this service'} for this company`}
      submitLabel="Save Changes"
      defaults={serviceAssignmentDefaults(assignment)}
      onSave={(values) => onSave(toServiceUpdateRequest(values))}
      footerStart={
        <DeleteButton
          label="Delete Service"
          itemName={assignment.serviceName ?? 'This Service'}
          description={DELETE_SERVICE_WARNING}
          onDelete={async () => {
            await onDelete()
            props.onDone()
          }}
          deleting={deleting}
        />
      }
    />
  )
}
