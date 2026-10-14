import { useLocalSearchParams } from 'expo-router';

import { RecordPaymentScreen } from '@/components/company/RecordPaymentScreen';

export default function RecordPaymentRoute() {
  const { clientId, companyId } = useLocalSearchParams<{ clientId: string; companyId?: string }>();
  return <RecordPaymentScreen clientId={clientId} companyId={companyId || undefined} />;
}
