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
  className?: string;
}

export function Button({ label, variant = 'primary', disabled, className, ...props }: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn('items-center rounded-md px-4 py-3 active:opacity-80', v.container, disabled && 'opacity-50', className)}
      {...props}
    >
      <Text className={cn('font-bold', v.label)}>{label}</Text>
    </Pressable>
  );
}
