import { useLocalSearchParams } from 'expo-router';

import { ManagerEditorScreen } from '@/components/managers/ManagerEditorScreen';

export default function EditManagerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ManagerEditorScreen id={id} />;
}
