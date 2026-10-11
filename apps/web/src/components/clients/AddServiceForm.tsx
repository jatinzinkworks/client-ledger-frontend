import type { ServiceAssignmentRequest } from '@cl/api'
import { addServiceTitle, assignServiceDefaults, toAssignServiceRequest } from '@cl/schemas'

import { ServiceAssignmentForm, type ServiceAssignmentFormProps } from './ServiceAssignmentForm'

interface AddServiceFormProps extends ServiceAssignmentFormProps {
  onAdd: (request: ServiceAssignmentRequest) => Promise<unknown>
}

/** The Add Service side sheet: deliver a catalog service to one company. */
export function AddServiceForm({ onAdd, ...props }: AddServiceFormProps) {
  return (
    <ServiceAssignmentForm
      {...props}
      title={addServiceTitle(props.company)}
      description="Record a service delivered to this company"
      submitLabel="Add Service"
      defaults={assignServiceDefaults()}
      onSave={(values) => onAdd(toAssignServiceRequest(values))}
    />
  )
}
