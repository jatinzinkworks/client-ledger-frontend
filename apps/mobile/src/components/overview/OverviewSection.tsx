import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { LoadError, Loading } from '@/components/ui/LoadState';
import { Section } from '@/components/ui/Section';

interface OverviewSectionProps {
  title: string;
  /** A line under the title. */
  hint?: string;
  /** View toggles under the title (segmented controls), shown even while loading. */
  controls?: ReactNode;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  children?: ReactNode;
}

/**
 * A titled card on the Overview: its toggles, then a spinner or a Retry while its data is not
 * ready, else the content. The body runs edge to edge, so content sets its own padding.
 */
export function OverviewSection({ title, hint, controls, isLoading, error, onRetry, children }: OverviewSectionProps) {
  return (
    <Section title={title} hint={hint} flush>
      {controls ? <View className="gap-2 px-4 pb-3">{controls}</View> : null}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <View className="px-4 pb-4">
          <LoadError error={error} onRetry={onRetry} />
        </View>
      ) : (
        children
      )}
    </Section>
  );
}

/** Nothing to show in a section: one centred line under a rule. */
export function SectionEmpty({ message }: { message: string }) {
  return (
    <Text className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">{message}</Text>
  );
}
