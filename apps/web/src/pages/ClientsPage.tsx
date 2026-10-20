import { useClients, useManagerCatalog } from '@cl/api'
import { ALL_MANAGERS, IMPORT_CLIENTS_LABEL, clientCountLabel, filterClients } from '@cl/schemas'
import { FileSpreadsheet, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ClientCard } from '@/components/clients/ClientCard'
import { ClientFilters } from '@/components/clients/ClientFilters'
import { ImportClientsForm } from '@/components/clients/ImportClientsForm'
import { OnboardClientForm } from '@/components/clients/OnboardClientForm'
import { LoadError } from '@/components/LoadError'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export function ClientsPage() {
  const clients = useClients()
  const managers = useManagerCatalog()
  const [query, setQuery] = useState('')
  const [managerId, setManagerId] = useState(ALL_MANAGERS)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  const [importing, setImporting] = useState(false)

  const visible = useMemo(
    () => filterClients(clients.clients, query, managerId, overdueOnly),
    [clients.clients, query, managerId, overdueOnly],
  )
  const count = clients.clients.length
  const onboard = () => setOnboarding(true)
  // Managers too: the onboarding form lists them, and one may have been added meanwhile.
  const refresh = () => {
    void clients.refetch()
    void managers.refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={clients.isLoading ? undefined : clientCountLabel(clients.clients)}
        title="Clients"
        actions={
          <>
            <RefreshButton onRefresh={refresh} refreshing={clients.isRefreshing || managers.isRefreshing} />
            <Button variant="outline" size="touch" className="border-primary/50 bg-card" onClick={() => setImporting(true)}>
              <FileSpreadsheet /> {IMPORT_CLIENTS_LABEL}
            </Button>
            <Button size="touch" onClick={onboard}>
              <Plus /> Onboard Client
            </Button>
          </>
        }
      />

      <ClientFilters
        query={query}
        onQueryChange={setQuery}
        managerId={managerId}
        onManagerChange={setManagerId}
        managers={managers.managers}
        overdueOnly={overdueOnly}
        onOverdueOnlyChange={setOverdueOnly}
      />

      {clients.isLoading && <Spinner />}
      {clients.loadError && <LoadError error={clients.loadError} onRetry={() => clients.refetch()} />}

      {!clients.isLoading && !clients.loadError && (
        visible.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {visible.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-lg font-bold">{count ? 'No Clients Match Your Search' : 'No Clients Yet'}</p>
            <p className="text-sm text-muted-foreground">
              {count ? 'Try A Different Name, Email, Company, Manager Or Status.' : 'Onboard The People Your Firm Works For, With Their Companies.'}
            </p>
            {!count && (
              <Button size="touch" onClick={onboard}>
                <Plus /> Onboard Client
              </Button>
            )}
          </div>
        )
      )}

      <Sheet open={onboarding} onOpenChange={setOnboarding}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
          {onboarding && (
            <OnboardClientForm
              managers={managers.managers}
              managersLoading={managers.isLoading}
              onSave={clients.create}
              saving={clients.creating}
              onDone={() => setOnboarding(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={importing} onOpenChange={setImporting}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
          {importing && <ImportClientsForm />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
