import { FileSpreadsheet } from 'lucide-react'

import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'

interface ExportLedgerButtonProps {
  onExport: () => void
  exporting: boolean
}

/** "Export Ledger" in a client or company page header: the selected year's ledger as an Excel workbook. */
export function ExportLedgerButton({ onExport, exporting }: ExportLedgerButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      className="border-primary/50 bg-card"
      onClick={onExport}
      disabled={exporting}
      title="Download The Selected Financial Year's Ledger As An Excel Workbook"
    >
      {exporting ? <Spinner className="size-4" label="Exporting" /> : <FileSpreadsheet />}
      {exporting ? 'Exporting…' : 'Export Ledger'}
    </Button>
  )
}
