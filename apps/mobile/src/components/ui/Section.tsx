import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

interface SectionProps {
  title: string;
  /** A line under the title. */
  hint?: string;
  /** Controls on the right of the title (a small button). */
  action?: ReactNode;
  /** Drop the body padding, for lists that run edge to edge with their own row padding. */
  flush?: boolean;
  className?: string;
  children?: ReactNode;
}

/** A titled card holding one part of a screen (Companies, Ledger, Who Owes Most…). */
export function Section({ title, hint, action, flush, className, children }: SectionProps) {
  return (
    <View className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <View className="flex-row items-start justify-between gap-3 px-4 pt-4 pb-3">
        <View className="flex-1 gap-0.5">
          <Text className="text-lg font-bold text-card-foreground">{title}</Text>
          {hint ? <Text className="text-sm text-muted-foreground">{hint}</Text> : null}
        </View>
        {action}
      </View>
      <View className={cn(!flush && 'px-4 pb-4')}>{children}</View>
    </View>
  );
}
