import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onRefresh: () => void
  refreshing: boolean
  /** Why refreshing is not allowed right now; disables the button and shows as its tooltip. */
  disabledReason?: string
}

/** "Refresh" in a page header: fetches the page's data again, spinning while it does. */
export function RefreshButton({ onRefresh, refreshing, disabledReason }: RefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      className="border-primary/50 bg-card"
      onClick={onRefresh}
      disabled={refreshing || !!disabledReason}
      title={disabledReason}
    >
      <RefreshCw className={cn(refreshing && 'animate-spin')} />
      {refreshing ? 'Refreshing…' : 'Refresh'}
    </Button>
  )
}
