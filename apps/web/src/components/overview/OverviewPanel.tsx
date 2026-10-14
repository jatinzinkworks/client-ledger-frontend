import type { ReactNode } from 'react'

import { LoadError } from '@/components/LoadError'
import { Spinner } from '@/components/Spinner'
import { cn } from '@/lib/utils'

interface OverviewPanelProps {
  title: string
  /** A line under the title. */
  hint?: ReactNode
  /** Controls on the right of the title (view toggles). */
  actions?: ReactNode
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  className?: string
  children?: ReactNode
}

/** A titled card on the Overview, showing a spinner or a Retry while its data is not ready. */
export function OverviewPanel({ title, hint, actions, isLoading, error, onRetry, className, children }: OverviewPanelProps) {
  return (
    <section aria-label={title} className={cn('flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {isLoading && (
        <div className="px-6 pb-6">
          <Spinner />
        </div>
      )}
      {error && (
        <div className="px-6 pb-6">
          <LoadError error={error} onRetry={onRetry} />
        </div>
      )}
      {!isLoading && !error && children}
    </section>
  )
}
