import { formatInr, type ChargeBreakdown } from '@cl/schemas'

/** Fee, discount and net charge (before GST) for the service being added. */
export function ChargeSummary({ fee, discount, net }: ChargeBreakdown) {
  return (
    <dl className="flex flex-col gap-2 rounded-md bg-muted p-5 text-[15px]" aria-label="Charge Summary">
      <div className="flex justify-between">
        <dt>Fee</dt>
        <dd className="text-muted-foreground">{formatInr(fee)}</dd>
      </div>
      <div className="flex justify-between border-b border-border pb-2">
        <dt>Discount</dt>
        <dd className="font-bold text-success">− {formatInr(discount)}</dd>
      </div>
      <div className="flex justify-between font-bold">
        <dt>Net Charge</dt>
        <dd>{formatInr(net)}</dd>
      </div>
    </dl>
  )
}
