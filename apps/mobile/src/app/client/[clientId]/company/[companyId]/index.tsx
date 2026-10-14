import { useLocalSearchParams } from 'expo-router';

import { CompanyScreen } from '@/components/company/CompanyScreen';

export default function CompanyRoute() {
  const { clientId, companyId } = useLocalSearchParams<{ clientId: string; companyId: string }>();
  // Keyed, so another company starts afresh: no page number or data carried over.
  return <CompanyScreen key={`${clientId}/${companyId}`} clientId={clientId} companyId={companyId} />;
}
