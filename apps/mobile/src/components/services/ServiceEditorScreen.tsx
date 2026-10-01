import { useServiceCatalog } from '@cl/api';
import { CATEGORIES, type Category } from '@cl/schemas';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

import { ServiceEditor } from './ServiceEditor';

interface ServiceEditorScreenProps {
  /** Service to edit; omit to create one. */
  id?: string;
  /** Category a new service starts in (from the list's active filter). */
  category?: string;
}

/** Full-screen create / edit, pushed over the tabs. Reads the service from the cached catalog list. */
export function ServiceEditorScreen({ id, category }: ServiceEditorScreenProps) {
  const catalog = useServiceCatalog();
  const colors = useThemeColors();
  const service = id ? catalog.services.find((s) => s.id === id) : undefined;
  const defaultCategory = CATEGORIES.includes(category as Category) ? (category as Category) : undefined;
  const title = id ? 'Edit Service' : 'New Service';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/services'));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        {id && catalog.isLoading ? (
          <ActivityIndicator color={colors.mutedForeground} className="py-8" />
        ) : id && !service ? (
          <Text className="py-8 text-center text-sm text-muted-foreground">This Service No Longer Exists.</Text>
        ) : (
          <ServiceEditor
            key={service?.id ?? 'new'}
            service={service}
            defaultCategory={defaultCategory}
            onSave={(request) => (service?.id ? catalog.update(service.id, request) : catalog.create(request))}
            onDelete={() => catalog.remove(service!.id!)}
            saving={catalog.saving}
            deleting={catalog.deleting}
            onDone={close}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
