import { useSendClientLedgerSummary, useSendLedgerSummary } from '../generated/notifications/notifications';

/**
 * Emails a client the ledger summary across all of their companies for the current financial
 * year, with each company's figures and the year's Excel ledger (a sheet per company) attached,
 * copying in their manager. A 502 means nothing was sent, as for a company.
 */
export function useClientLedgerEmail(clientId: string) {
  const email = useSendClientLedgerSummary();
  return {
    // orval interpolates path params as-is, so encode the id here.
    send: () => email.mutateAsync({ clientId: encodeURIComponent(clientId) }),
    sending: email.isPending,
    sent: email.data,
    error: email.error,
    reset: email.reset,
  };
}

/**
 * Emails a client the ledger summary of one of their companies for the current financial year,
 * with the year's Excel ledger attached, copying in their manager. The response names who it
 * went to; a 502 means email is not set up or the mail server refused it (nothing was sent).
 */
export function useCompanyLedgerEmail(clientId: string, companyId: string) {
  const email = useSendLedgerSummary();
  return {
    // orval interpolates path params as-is, so encode the ids here.
    send: () => email.mutateAsync({ clientId: encodeURIComponent(clientId), companyId: encodeURIComponent(companyId) }),
    sending: email.isPending,
    /** What was sent, once it has been. */
    sent: email.data,
    error: email.error,
    reset: email.reset,
  };
}
