import type { ReactNode } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/utils/cn';

type Variant = 'primary' | 'outline' | 'destructive';

const VARIANTS: Record<Variant, { container: string; label: string }> = {
  primary: { container: 'bg-primary', label: 'text-primary-foreground' },
  outline: { container: 'border border-border bg-card', label: 'text-foreground' },
  destructive: { container: 'border border-destructive bg-card', label: 'text-destructive' },
};

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  /** An icon before the label, e.g. a Lucide icon with its `color`. */
  icon?: ReactNode;
  className?: string;
}

export function Button({ label, variant = 'primary', icon, disabled, className, ...props }: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-md px-4 py-3 active:opacity-80',
        v.container,
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {icon}
      <Text className={cn('font-bold', v.label)}>{label}</Text>
    </Pressable>
  );
}
