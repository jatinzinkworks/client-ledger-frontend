import { cn } from '@/lib/utils'

/** Pill colours; semantic tokens, so each works in both themes. */
export type StatusTone = 'danger' | 'success' | 'brand' | 'warning'

const TONES: Readonly<Record<StatusTone, string>> = {
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  brand: 'bg-brand/10 text-brand',
  warning: 'bg-warning/15 text-warning',
}

/** A small upper-case status pill, e.g. OVERDUE or SETTLED. */
export function StatusPill({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full px-3 py-1 text-[11px] font-black tracking-wide whitespace-nowrap uppercase',
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
