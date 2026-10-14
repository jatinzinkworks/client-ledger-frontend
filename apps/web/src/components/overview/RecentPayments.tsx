import { useLatestPayments, type RecentPayment, type RecentPaymentMethod } from '@cl/api'
import { NO_RECENT_PAYMENTS, formatInr, groupPaymentsByDay, paymentMethodLabel, recentPaymentsNote } from '@cl/schemas'
import { Banknote, Landmark, ScrollText, Smartphone, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { companyPath } from '@/utils/routes'

import { OverviewPanel } from './OverviewPanel'

const METHOD_ICONS: Readonly<Record<RecentPaymentMethod, LucideIcon>> = {
  BANK_TRANSFER: Landmark,
  UPI: Smartphone,
  CHEQUE: ScrollText,
  CASH: Banknote,
}

/** One payment: who paid (to their company page), how, and how much. */
function PaymentRow({ payment }: { payment: RecentPayment }) {
  const Icon = payment.method ? METHOD_ICONS[payment.method] : Banknote
  const details = [payment.clientName, paymentMethodLabel(payment.method), payment.reference].filter(Boolean).join(' · ')
  const name = payment.companyName ?? ''
  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {payment.clientId && payment.companyId ? (
          <Link to={companyPath(payment.clientId, payment.companyId)} className="truncate font-bold hover:underline">
            {name}
          </Link>
        ) : (
          <span className="truncate font-bold">{name}</span>
        )}
        <span className="truncate text-[13px] text-muted-foreground" title={payment.comment}>
          {details}
        </span>
      </div>
      <span className="shrink-0 font-bold whitespace-nowrap text-success tabular-nums">+ {formatInr(payment.amount ?? 0)}</span>
    </li>
  )
}

/** The latest payments received from any company, grouped by day with each day's total. */
export function RecentPayments() {
  const { payments, isLoading, error, refetch } = useLatestPayments()
  return (
    <OverviewPanel
      title="Received Payments"
      hint={payments?.length ? recentPaymentsNote(payments) : undefined}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {payments &&
        (payments.length === 0 ? (
          <p className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">{NO_RECENT_PAYMENTS}</p>
        ) : (
          groupPaymentsByDay(payments).map((day) => (
            <div key={day.label} className="border-t border-border">
              <div className="flex items-center justify-between bg-muted/60 px-6 py-2 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">
                <span>{day.label}</span>
                <span className="tabular-nums">{formatInr(day.total)}</span>
              </div>
              <ul className="divide-y divide-border">
                {day.payments.map((payment) => (
                  <PaymentRow key={payment.paymentId} payment={payment} />
                ))}
              </ul>
            </div>
          ))
        ))}
    </OverviewPanel>
  )
}
