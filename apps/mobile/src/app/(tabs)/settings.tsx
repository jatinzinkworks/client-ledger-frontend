import { errorMessage, usePaymentTerms } from '@cl/api';
import { paymentTermsFormDefaults } from '@cl/schemas';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { PaymentTermsForm } from '@/components/settings/PaymentTermsForm';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useThemeColors } from '@/theme/useThemeColors';

export default function SettingsScreen() {
  const terms = usePaymentTerms();
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
        <Card>
          <View className="gap-1">
            <CardTitle>Payment terms</CardTitle>
            <CardDescription>
              {terms.notConfigured
                ? 'Not configured yet — the defaults below apply until you save.'
                : 'Tenant-wide rules for invoicing, overdue marking and reminders.'}
            </CardDescription>
          </View>

          {terms.isLoading && <ActivityIndicator color={colors.mutedForeground} />}
          {terms.loadError && (
            <View className="gap-3">
              <Text className="text-sm text-destructive">{errorMessage(terms.loadError)}</Text>
              <Button variant="outline" label="Retry" onPress={() => terms.refetch()} />
            </View>
          )}
          {!terms.isLoading && !terms.loadError && (
            <PaymentTermsForm
              key={terms.stored?.updatedAt ?? 'defaults'}
              defaultValues={paymentTermsFormDefaults(terms.stored)}
              onSubmit={terms.save}
              saving={terms.saving}
            />
          )}
          {terms.saveError && <Text className="text-sm text-destructive">{errorMessage(terms.saveError)}</Text>}
          {terms.saved && <Text className="text-sm text-success">Payment terms saved</Text>}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
