import { useLocalSearchParams } from 'expo-router';

import { ServiceEditorScreen } from '@/components/services/ServiceEditorScreen';

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ServiceEditorScreen id={id} />;
}
