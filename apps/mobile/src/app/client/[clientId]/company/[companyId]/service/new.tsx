import { useLocalSearchParams } from 'expo-router';

import { ServiceAssignmentScreen } from '@/components/company/ServiceAssignmentScreen';

export default function AddServiceRoute() {
  const { clientId, companyId } = useLocalSearchParams<{ clientId: string; companyId: string }>();
  return <ServiceAssignmentScreen clientId={clientId} companyId={companyId} />;
}
