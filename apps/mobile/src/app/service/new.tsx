import { useLocalSearchParams } from 'expo-router';

import { ServiceEditorScreen } from '@/components/services/ServiceEditorScreen';

export default function NewServiceScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  return <ServiceEditorScreen category={category} />;
}
