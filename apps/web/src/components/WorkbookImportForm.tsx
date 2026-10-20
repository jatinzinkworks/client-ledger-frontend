import type { WorkbookImport } from '@cl/api'
import {
  CHOOSE_WORKBOOK_LABEL,
  DOWNLOAD_TEMPLATE_LABEL,
  IMPORT_LABEL,
  NOTHING_IMPORTED,
  NOT_A_WORKBOOK,
  XLSX_ACCEPT,
  importFailure,
  isWorkbookName,
  type ImportCopy,
  type ImportSummary,
} from '@cl/schemas'
import { CircleCheck, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { FIELD_ERROR } from '@/components/form/fieldStyles'
import { Spinner } from '@/components/Spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { saveFile } from '@/utils/download'

interface WorkbookImportFormProps<TResult> {
  copy: ImportCopy
  /** From `useServiceImport` / `useClientImport`. */
  io: WorkbookImport<TResult>
  /** What the import created, as a heading and a line per record. */
  summarize: (result: TResult) => ImportSummary
}

/**
 * An import from an Excel workbook, in a side sheet: download the template, choose the filled-in
 * workbook, import. Afterwards it lists what was created (the lists behind have refreshed), or why
 * nothing was — each cell at fault, in reading order — so the user can fix the file and retry.
 * Import Services and Import Clients are thin wrappers.
 */
export function WorkbookImportForm<TResult>({ copy, io, summarize }: WorkbookImportFormProps<TResult>) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [fileError, setFileError] = useState<string>()

  const downloadTemplate = async () => {
    try {
      const template = await io.downloadTemplate()
      saveFile(template.blob, template.fileName ?? copy.templateFileName)
    } catch {
      // Shown from templateError.
    }
  }

  const choose = (picked: File | undefined) => {
    io.resetImport()
    setFileError(picked && !isWorkbookName(picked.name) ? NOT_A_WORKBOOK : undefined)
    setFile(picked && isWorkbookName(picked.name) ? picked : undefined)
  }

  const runImport = async () => {
    if (!file) return
    try {
      await io.importWorkbook(file)
    } catch {
      // Shown from importError.
    }
  }

  const failure = io.importError ? importFailure(io.importError) : undefined
  const summary = io.imported !== undefined ? summarize(io.imported) : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <SheetTitle className="text-2xl font-bold">{copy.title}</SheetTitle>
        <SheetDescription className="sr-only">{copy.description}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {summary ? (
          <section aria-live="polite" className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-xl font-bold">
              <CircleCheck aria-hidden className="size-6 text-success" />
              {summary.title}
            </p>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
              {summary.items.map((item) => (
                <li key={item.key} className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">{copy.steps.template.title}</h3>
              <p className="text-sm text-muted-foreground">{copy.steps.template.body}</p>
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="self-start border-primary/50 bg-card"
                onClick={downloadTemplate}
                disabled={io.downloadingTemplate}
              >
                {io.downloadingTemplate ? <Spinner className="size-4" /> : <Download />} {DOWNLOAD_TEMPLATE_LABEL}
              </Button>
              {io.templateError && <p className={FIELD_ERROR}>{io.templateError.message}</p>}
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">{copy.steps.upload.title}</h3>
              <p className="text-sm text-muted-foreground">{copy.steps.upload.body}</p>
              <input
                ref={fileInput}
                type="file"
                accept={XLSX_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  choose(e.target.files?.[0])
                  // Clear it so choosing the same (fixed) file again still fires a change.
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="self-start border-primary/50 bg-card"
                onClick={() => fileInput.current?.click()}
                disabled={io.importing}
              >
                <FileSpreadsheet /> {CHOOSE_WORKBOOK_LABEL}
              </Button>
              {file && <p className="text-sm font-bold break-all">{file.name}</p>}
              {fileError && <p className={FIELD_ERROR}>{fileError}</p>}
            </section>

            {failure && (
              <Alert variant="destructive" aria-live="polite">
                <AlertTitle>{NOTHING_IMPORTED}</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>{failure.message}</p>
                  {failure.cells.length > 0 && (
                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                      {failure.cells.map((c, i) => (
                        <li key={`${c.cell}-${i}`}>
                          {c.cell && <span className="font-bold">{c.cell}: </span>}
                          {c.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      <SheetFooter className="flex-row items-center justify-end gap-3 border-t border-border p-6">
        <SheetClose asChild>
          <Button
            type="button"
            variant={summary ? 'default' : 'outline'}
            size="touch"
            className={summary ? undefined : 'border-primary/50 bg-card'}
          >
            {summary ? 'Done' : 'Cancel'}
          </Button>
        </SheetClose>
        {!summary && (
          <Button type="button" size="touch" onClick={runImport} disabled={!file || io.importing}>
            {io.importing ? <Spinner className="size-4" /> : <Upload />} {io.importing ? 'Importing…' : IMPORT_LABEL}
          </Button>
        )}
      </SheetFooter>
    </div>
  )
}
