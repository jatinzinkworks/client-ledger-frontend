import { useManagerCatalog } from '@cl/api';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

import { ManagerEditor } from './ManagerEditor';

/** Full-screen add / edit, pushed over the tabs. Reads the manager from the cached list. */
export function ManagerEditorScreen({ id }: { id?: string }) {
  const catalog = useManagerCatalog();
  const colors = useThemeColors();
  const manager = id ? catalog.managers.find((m) => m.id === id) : undefined;
  const title = id ? 'Edit Manager' : 'Add Manager';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/managers'));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        {id && catalog.isLoading ? (
          <ActivityIndicator color={colors.mutedForeground} className="py-8" />
        ) : id && !manager ? (
          <Text className="py-8 text-center text-sm text-muted-foreground">This Manager No Longer Exists.</Text>
        ) : (
          <ManagerEditor
            key={manager?.id ?? 'new'}
            manager={manager}
            onSave={(request) => (manager?.id ? catalog.update(manager.id, request) : catalog.create(request))}
            onDelete={() => catalog.remove(manager!.id!)}
            saving={catalog.saving}
            deleting={catalog.deleting}
            onDone={close}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
