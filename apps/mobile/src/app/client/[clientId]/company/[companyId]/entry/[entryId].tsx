import { useLocalSearchParams } from 'expo-router';

import { LedgerEntryScreen } from '@/components/company/LedgerEntryScreen';

export default function LedgerEntryRoute() {
  const { clientId, companyId, entryId } = useLocalSearchParams<{ clientId: string; companyId: string; entryId: string }>();
  return <LedgerEntryScreen key={entryId} clientId={clientId} companyId={companyId} entryId={entryId} />;
}
