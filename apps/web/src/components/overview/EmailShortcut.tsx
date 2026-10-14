import { useClientLedgerEmail, useCompanyLedgerEmail, type RankEntry, type RankSubject } from '@cl/api'
import { clientLedgerEmailDescription, companyLedgerEmailDescription } from '@cl/schemas'

import { EmailLedgerButton } from '@/components/clients/EmailLedgerButton'

// One component per endpoint, so each row keeps the same hooks whichever list it is in.

function ClientEmailShortcut({ entry }: { entry: RankEntry }) {
  const email = useClientLedgerEmail(entry.id)
  return (
    <EmailLedgerButton
      iconOnly
      itemName={entry.name}
      description={clientLedgerEmailDescription(entry.name)}
      tooltip={`Email ${entry.name} Their Ledger Summary`}
      onSend={email.send}
      sending={email.sending}
    />
  )
}

function CompanyEmailShortcut({ entry, clientId, companyId }: { entry: RankEntry; clientId: string; companyId: string }) {
  const email = useCompanyLedgerEmail(clientId, companyId)
  return (
    <EmailLedgerButton
      iconOnly
      itemName={entry.name}
      description={companyLedgerEmailDescription(entry.name)}
      tooltip={`Email ${entry.name}'s Ledger Summary To The Client`}
      onSend={email.send}
      sending={email.sending}
    />
  )
}

/**
 * A mail icon beside a ranked client or company: emails their ledger summary for the current
 * year (the client-wide or the company endpoint) after the usual confirmation. Managers have none.
 */
export function EmailShortcut({ subject, entry }: { subject: RankSubject; entry: RankEntry }) {
  if (subject === 'clients') return <ClientEmailShortcut entry={entry} />
  if (subject === 'companies' && entry.clientId && entry.companyId) {
    return <CompanyEmailShortcut entry={entry} clientId={entry.clientId} companyId={entry.companyId} />
  }
  return null
}
