import { useManagerCatalog, type ManagerResponse } from '@cl/api'
import { managerCountLabel } from '@cl/schemas'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { LoadError } from '@/components/LoadError'
import { ManagerEditor } from '@/components/managers/ManagerEditor'
import { ManagersTable } from '@/components/managers/ManagersTable'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/** What the side sheet is showing: nothing, a new manager, or an existing one. */
type Editing = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; manager: ManagerResponse }

export function ManagersPage() {
  const catalog = useManagerCatalog()
  const [editing, setEditing] = useState<Editing>({ kind: 'closed' })

  const count = catalog.managers.length
  const close = () => setEditing({ kind: 'closed' })
  const add = () => setEditing({ kind: 'new' })
  const editingManager = editing.kind === 'edit' ? editing.manager : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={catalog.isLoading ? undefined : managerCountLabel(count)}
        title="Managers"
        actions={
          <Button size="touch" onClick={add}>
            <Plus /> Add Manager
          </Button>
        }
      />

      {catalog.isLoading && <Spinner />}
      {catalog.loadError && <LoadError error={catalog.loadError} onRetry={() => catalog.refetch()} />}

      {!catalog.isLoading && !catalog.loadError && (
        count ? (
          <ManagersTable managers={catalog.managers} onSelect={(manager) => setEditing({ kind: 'edit', manager })} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-lg font-bold">No Managers Yet</p>
            <p className="text-sm text-muted-foreground">Add The Staff Who Look After Your Clients.</p>
            <Button size="touch" onClick={add}>
              <Plus /> Add Manager
            </Button>
          </div>
        )
      )}

      <Sheet open={editing.kind !== 'closed'} onOpenChange={(open) => !open && close()}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]">
          {editing.kind !== 'closed' && (
            <ManagerEditor
              key={editingManager?.id ?? 'new'}
              manager={editingManager}
              onSave={(request) => (editingManager?.id ? catalog.update(editingManager.id, request) : catalog.create(request))}
              onDelete={() => catalog.remove(editingManager!.id!)}
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
