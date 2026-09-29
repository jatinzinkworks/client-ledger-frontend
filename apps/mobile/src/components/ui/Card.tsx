import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <View className={cn('gap-4 rounded-lg border border-border bg-card p-4', className)}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text className="text-lg font-bold text-card-foreground">{children}</Text>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-muted-foreground">{children}</Text>;
}
