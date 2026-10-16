import { useServiceCatalog, type CatalogServiceResponse } from '@cl/api'
import { filterServices, servicesEyebrow, type CategoryFilter } from '@cl/schemas'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LoadError } from '@/components/LoadError'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { AdjustPricesForm } from '@/components/services/AdjustPricesForm'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceEditor } from '@/components/services/ServiceEditor'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useFinancialYear } from '@/financialYear/useFinancialYear'

/** What the side sheet is showing: nothing, a new service, an existing one, or Adjust Prices. */
type Editing = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; service: CatalogServiceResponse } | { kind: 'adjust' }

export function ServicesPage() {
  const { financialYear } = useFinancialYear()
  // Each card's billed amount is for the selected year.
  const catalog = useServiceCatalog(financialYear)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [editing, setEditing] = useState<Editing>({ kind: 'closed' })

  const visible = useMemo(() => filterServices(catalog.services, query, category), [catalog.services, query, category])
  const count = catalog.services.length
  const close = () => setEditing({ kind: 'closed' })
  const editingService = editing.kind === 'edit' ? editing.service : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={catalog.isLoading ? undefined : servicesEyebrow(count, financialYear)}
        title="Services"
        actions={
          <>
            <RefreshButton onRefresh={() => catalog.refetch()} refreshing={catalog.isRefreshing} />
            <Button
              variant="outline"
              size="touch"
              className="border-primary/50 bg-card"
              onClick={() => setEditing({ kind: 'adjust' })}
              disabled={!count}
            >
              <SlidersHorizontal /> Adjust Prices
            </Button>
            <Button size="touch" onClick={() => setEditing({ kind: 'new' })}>
              <Plus /> New Service
            </Button>
          </>
        }
      />

      <ServiceFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />

      {catalog.isLoading && <Spinner />}
      {catalog.loadError && <LoadError error={catalog.loadError} onRetry={() => catalog.refetch()} />}

      {!catalog.isLoading && !catalog.loadError && (
        visible.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {visible.map((service) => (
              <ServiceCard key={service.id} service={service} onSelect={(s) => setEditing({ kind: 'edit', service: s })} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-lg font-bold">{count ? 'No Services Match Your Search' : 'No Services Yet'}</p>
            <p className="text-sm text-muted-foreground">
              {count ? 'Try A Different Name Or Category.' : 'Add The Services Your Firm Offers, With Their Fees And Billing Schedules.'}
            </p>
            {!count && (
              <Button size="touch" onClick={() => setEditing({ kind: 'new' })}>
                <Plus /> New Service
              </Button>
            )}
          </div>
        )
      )}

      <Sheet open={editing.kind !== 'closed'} onOpenChange={(open) => !open && close()}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
          {editing.kind === 'adjust' && (
            <AdjustPricesForm
              services={catalog.services}
              defaultScope={category}
              onApply={catalog.updateFees}
              applying={catalog.updatingFees}
              onDone={close}
            />
          )}
          {(editing.kind === 'new' || editing.kind === 'edit') && (
            <ServiceEditor
              key={editingService?.id ?? 'new'}
              service={editingService}
              defaultCategory={category === 'ALL' ? undefined : category}
              onSave={(request) => (editingService?.id ? catalog.update(editingService.id, request) : catalog.create(request))}
              onDelete={() => catalog.remove(editingService!.id!)}
              saving={catalog.saving}
              deleting={catalog.deleting}
              onDone={close}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
