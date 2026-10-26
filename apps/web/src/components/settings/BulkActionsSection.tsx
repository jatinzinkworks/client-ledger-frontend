import { useBulkActions } from '@cl/api'
import { BULK_ACTIONS_SECTION, bulkActionRuns, bulkActions } from '@cl/schemas'

import { BulkActionRow } from './BulkActionRow'
import { SettingsSection } from './SettingsSection'

/** Settings' Bulk Actions: payment reminders, every client's ledger summary, posting due services. */
export function BulkActionsSection() {
  const runs = bulkActionRuns(useBulkActions())
  return (
    <SettingsSection {...BULK_ACTIONS_SECTION}>
      {bulkActions().map((action) => (
        <BulkActionRow key={action.key} action={action} onRun={runs[action.key].run} running={runs[action.key].running} />
      ))}
    </SettingsSection>
  )
}
