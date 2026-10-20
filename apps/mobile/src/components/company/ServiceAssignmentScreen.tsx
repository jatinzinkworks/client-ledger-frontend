import { useCompany, useServiceCatalog } from '@cl/api';
import {
  addServiceTitle,
  assignServiceDefaults,
  serviceAssignmentDefaults,
  toAssignServiceRequest,
  toServiceUpdateRequest,
} from '@cl/schemas';
import { useState } from 'react';

import { FormScreen } from '@/components/ui/FormScreen';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { companyHref } from '@/utils/routes';

import { goBack } from './formHelpers';
import { ServiceAssignmentForm } from './ServiceAssignmentForm';

interface ServiceAssignmentScreenProps {
  clientId: string;
  companyId: string;
  /** The delivered service to edit; Add Service when omitted. */
  assignmentId?: string;
}

/** Add Service (assign a catalog service) or Edit Service, full screen over the company page. */
export function ServiceAssignmentScreen({ clientId, companyId, assignmentId }: ServiceAssignmentScreenProps) {
  const page = useCompany(clientId, companyId);
  const { financialYear } = useFinancialYear();
  const catalog = useServiceCatalog(financialYear);
  const { company } = page;
  const editing = !!assignmentId;
  const assignment = editing ? page.services.find((s) => s.id === assignmentId) : undefined;
  // Set once Delete Service is confirmed, so the refreshed list does not flash "Service Not Found"
  // before the screen closes.
  const [deleted, setDeleted] = useState(false);
  const close = () => goBack(companyHref(clientId, companyId));
  const title = editing ? 'Edit Service' : company ? addServiceTitle(company) : 'Add Service';

  const body = () => {
    if (page.isLoading || (editing && page.servicesLoading)) return <Loading />;
    if (page.loadError) return <LoadError error={page.loadError} onRetry={() => page.refetch()} />;
    if (editing && page.servicesError) return <LoadError error={page.servicesError} onRetry={() => page.refetch()} />;
    if (!company) return <EmptyState title="Company Not Found" description="This Company May Have Been Removed." />;
    if (editing && !assignment && deleted) return <Loading />;
    if (editing && !assignment) {
      return <EmptyState title="Service Not Found" description="This Service May Have Been Removed From The Company." />;
    }
    const shared = {
      company,
      catalog: catalog.services,
      catalogLoading: catalog.isLoading,
      catalogError: catalog.loadError,
      onRetryCatalog: () => catalog.refetch(),
      onDone: close,
    };
    return assignment ? (
      <ServiceAssignmentForm
        key={assignment.id}
        {...shared}
        assignment={assignment}
        submitLabel="Save Changes"
        defaults={serviceAssignmentDefaults(assignment)}
        onSave={(values) => page.updateService(assignment.id ?? '', toServiceUpdateRequest(values))}
        saving={page.updatingService}
        onDelete={async () => {
          // Before the call: its success refreshes the list (without the service) before it resolves.
          setDeleted(true);
          try {
            await page.deleteService(assignment.id ?? '');
          } catch (error) {
            setDeleted(false);
            throw error;
          }
        }}
        deleting={page.deletingService}
      />
    ) : (
      <ServiceAssignmentForm
        {...shared}
        submitLabel="Add Service"
        defaults={assignServiceDefaults()}
        onSave={(values) => page.addService(toAssignServiceRequest(values))}
        saving={page.addingService}
      />
    );
  };

  return <FormScreen title={title}>{body()}</FormScreen>;
}
