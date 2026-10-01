import { errorMessage } from '@cl/api';
import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useThemeColors } from '@/theme/useThemeColors';

/** The state a card needs from a singleton settings hook (usePaymentTerms, useFirmDetails, …). */
interface SettingState {
  isLoading: boolean;
  loadError: Error | null;
  notConfigured: boolean;
  refetch: () => unknown;
  saveError: Error | null;
  saved: boolean;
}

interface SettingsCardProps {
  title: string;
  description: string;
  setting: SettingState;
  /** Confirmation shown after a successful save. */
  savedMessage: string;
  /** The form — rendered once the setting has loaded (or is known not to exist yet). */
  children: ReactNode;
}

/** One settings section: header, then loading / error / form, then the save outcome. */
export function SettingsCard({ title, description, setting, savedMessage, children }: SettingsCardProps) {
  const colors = useThemeColors();
  const ready = !setting.isLoading && !setting.loadError;
  return (
    <Card>
      <View className="gap-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {setting.notConfigured && (
          <Text className="text-sm text-brand">Not Configured Yet — Save To Set It Up.</Text>
        )}
      </View>

      {setting.isLoading && <ActivityIndicator color={colors.mutedForeground} />}
      {setting.loadError && (
        <View className="gap-3">
          <Text className="text-sm text-destructive">{errorMessage(setting.loadError)}</Text>
          <Button variant="outline" label="Retry" onPress={() => setting.refetch()} />
        </View>
      )}
      {ready && children}
      {setting.saveError && <Text className="text-sm text-destructive">{errorMessage(setting.saveError)}</Text>}
      {setting.saved && <Text className="text-sm text-success">{savedMessage}</Text>}
    </Card>
  );
}
