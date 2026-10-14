import { useLocalSearchParams } from 'expo-router';

import { ServiceAssignmentScreen } from '@/components/company/ServiceAssignmentScreen';

export default function EditServiceRoute() {
  const { clientId, companyId, assignmentId } = useLocalSearchParams<{
    clientId: string;
    companyId: string;
    assignmentId: string;
  }>();
  return <ServiceAssignmentScreen clientId={clientId} companyId={companyId} assignmentId={assignmentId} />;
}
