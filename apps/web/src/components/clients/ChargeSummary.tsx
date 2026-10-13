import { formatInr, gstRateLabel, type ChargeBreakdown } from '@cl/schemas'

/** Fee, discount, net charge, GST and the total with GST for the service being added or edited. */
export function ChargeSummary({ fee, discount, net, gstRatePercent, gst, total }: ChargeBreakdown) {
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
      <div className="flex justify-between border-b border-border pb-2">
        <dt>GST ({gstRateLabel(gstRatePercent)})</dt>
        <dd className="text-muted-foreground">+ {formatInr(gst)}</dd>
      </div>
      <div className="flex justify-between font-bold">
        <dt>Total With GST</dt>
        <dd>{formatInr(total)}</dd>
      </div>
    </dl>
  )
}
