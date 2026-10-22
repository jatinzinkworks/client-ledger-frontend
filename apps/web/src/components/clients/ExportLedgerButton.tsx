import { LEDGER_FILE_COPY, type LedgerFileFormat } from '@cl/schemas'
import { FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react'

import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'

/** Each file's icon in its familiar colour — Excel green, PDF red — via tokens that suit both themes. */
const ICONS: Readonly<Record<LedgerFileFormat, { icon: LucideIcon; className: string }>> = {
  xlsx: { icon: FileSpreadsheet, className: 'text-success' },
  pdf: { icon: FileText, className: 'text-destructive' },
}

interface ExportLedgerButtonProps {
  onExport: () => void
  exporting: boolean
  /** The Excel workbook ("Download Excel", the default) or the PDF summary ("Download PDF"). */
  format?: LedgerFileFormat
}

/** A client or company page header button that downloads the selected year's ledger file. */
export function ExportLedgerButton({ onExport, exporting, format = 'xlsx' }: ExportLedgerButtonProps) {
  const copy = LEDGER_FILE_COPY[format]
  const { icon: Icon, className: iconClass } = ICONS[format]
  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      className="border-primary/50 bg-card"
      onClick={onExport}
      disabled={exporting}
      title={copy.tooltip}
    >
      {exporting ? <Spinner className="size-4" label={copy.busyLabel} /> : <Icon className={iconClass} />}
      {exporting ? copy.busyLabel : copy.label}
    </Button>
  )
}
