import { errorMessage } from '@cl/api';
import { ActivityIndicator, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

import { Button } from './Button';

/** The spinner shown while a screen or section waits for its data. */
export function Loading({ className }: { className?: string }) {
  const colors = useThemeColors();
  return <ActivityIndicator color={colors.mutedForeground} className={cn('py-6', className)} />;
}

/** A failed load: the backend's message and a Retry. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View className="gap-3 py-2">
      <Text className="text-sm text-destructive">{errorMessage(error)}</Text>
      <Button variant="outline" label="Retry" onPress={onRetry} />
    </View>
  );
}

/** Nothing to list: a dashed box with a title and an optional line under it. */
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View className="items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-10">
      <Text className="text-center text-lg font-bold text-card-foreground">{title}</Text>
      {description ? <Text className="text-center text-sm text-muted-foreground">{description}</Text> : null}
    </View>
  );
}
