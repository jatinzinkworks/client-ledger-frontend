import { errorMessage, type CatalogServiceResponse, type ServiceFeeBulkUpdateRequest } from '@cl/api'
import {
  ADJUST_PRICES_HINT,
  ADJUST_PRICES_LABELS,
  ADJUST_PRICES_NOTE,
  PRICE_ROUNDING_OPTIONS,
  PRICE_SCOPE_OPTIONS,
  adjustPricesDefaults,
  adjustPricesFormSchema,
  applyPriceChangeLabel,
  formatInr,
  priceChangeBlocker,
  priceChangePreview,
  servicesCountLabel,
  toServiceFeeBulkUpdateRequest,
  type AdjustPricesFormInput,
  type AdjustPricesFormValues,
  type CategoryFilter,
} from '@cl/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { DataTable, type DataColumn } from '@/components/DataTable'
import { FIELD_HINT, FIELD_LABEL } from '@/components/form/fieldStyles'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { EYEBROW } from '@/utils/typography'

type Row = ReturnType<typeof priceChangePreview>[number]

const COLUMNS = (count: number): DataColumn<Row>[] => [
  { header: servicesCountLabel(count), render: (row) => <span className="font-bold">{row.name}</span> },
  { header: 'Current', align: 'right', render: (row) => <span className="text-muted-foreground">{formatInr(row.current)}</span> },
  {
    header: 'New',
    align: 'right',
    render: (row) => <span className="font-bold text-success">{row.next != null ? formatInr(row.next) : '—'}</span>,
  },
]

interface AdjustPricesFormProps {
  services: readonly CatalogServiceResponse[]
  /** The category the Services page is filtered to; the change starts out applying to it. */
  defaultScope?: CategoryFilter
  /** Saves the new fees of the services whose fee changes. */
  onApply: (request: ServiceFeeBulkUpdateRequest) => Promise<unknown>
  applying: boolean
  onDone: () => void
}

/**
 * Adjust Prices: change the standard fee of every service, or of one category, by a percentage,
 * with a live preview of each service's current and new fee.
 */
export function AdjustPricesForm({ services, defaultScope, onApply, applying, onDone }: AdjustPricesFormProps) {
  const form = useForm<AdjustPricesFormInput, unknown, AdjustPricesFormValues>({
    resolver: zodResolver(adjustPricesFormSchema),
    defaultValues: adjustPricesDefaults(defaultScope),
    mode: 'onChange',
  })
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form
  const values = useWatch({ control })
  // The preview follows what is typed, once it is a valid change.
  const parsed = adjustPricesFormSchema.safeParse(values)
  const scope = (values.scope ?? 'ALL') as CategoryFilter
  const rows = priceChangePreview(
    services,
    scope,
    parsed.success ? parsed.data.changePercent : undefined,
    parsed.success ? parsed.data.rounding : 'NONE',
  )

  const blocker = priceChangeBlocker(rows)
  const [formError, setFormError] = useState<string>()

  // The rows already hold the new fees for the values just validated.
  const submit = form.handleSubmit(async () => {
    setFormError(undefined)
    try {
      await onApply(toServiceFeeBulkUpdateRequest(rows))
      onDone()
    } catch (error) {
      setFormError(errorMessage(error))
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="gap-1 border-b border-border p-6">
        <span className={EYEBROW}>Bulk Edit</span>
        <SheetTitle className="text-2xl font-bold">Adjust Prices</SheetTitle>
        <SheetDescription className="sr-only">Change the standard fee of many services at once</SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        <div className="grid grid-cols-2 items-start gap-4">
          <TextField
            id="adjust-changePercent"
            label={ADJUST_PRICES_LABELS.changePercent}
            type="number"
            hint={ADJUST_PRICES_HINT}
            error={errors.changePercent?.message}
            registration={register('changePercent')}
          />
          <SelectField
            id="adjust-rounding"
            label={ADJUST_PRICES_LABELS.rounding}
            options={PRICE_ROUNDING_OPTIONS}
            registration={register('rounding')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id="adjust-scope-label" className={FIELD_LABEL}>
            {ADJUST_PRICES_LABELS.scope}
          </span>
          <div role="group" aria-labelledby="adjust-scope-label" className="flex flex-wrap gap-2">
            {PRICE_SCOPE_OPTIONS.map(({ value, label }) => {
              const active = value === scope
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue('scope', value as AdjustPricesFormInput['scope'])}
                  className={cn(
                    'h-10 cursor-pointer rounded-full border px-4 text-[15px] font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* shrink-0: in the scrolling column a clipped box may otherwise shrink and hide rows. */}
        <div className="shrink-0 overflow-hidden rounded-lg border border-border">
          {rows.length ? (
            <DataTable columns={COLUMNS(rows.length)} rows={rows} rowKey={(row) => row.id} />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No Services In This Category.</p>
          )}
        </div>

        <p className={FIELD_HINT}>{ADJUST_PRICES_NOTE}</p>
        {rows.length > 0 && blocker && <p className="text-sm text-muted-foreground">{blocker}</p>}
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
      </div>

      <SheetFooter className="flex-row items-center justify-end gap-3 border-t border-border p-6">
        <SheetClose asChild>
          <Button type="button" variant="outline" size="touch" className="border-primary/50 bg-card">
            Cancel
          </Button>
        </SheetClose>
        <Button
          type="submit"
          size="touch"
          disabled={applying || !parsed.success || !!blocker}
        >
          {applying ? 'Applying…' : applyPriceChangeLabel(parsed.success ? parsed.data.changePercent : undefined, rows.length)}
        </Button>
      </SheetFooter>
    </form>
  )
}
