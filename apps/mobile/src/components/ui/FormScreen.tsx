import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

/**
 * A full-screen form pushed over the tabs (the mobile form of a web side sheet): a header with
 * the title and a back button, and a scrolling body that stays clear of the keyboard.
 */
export function FormScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
