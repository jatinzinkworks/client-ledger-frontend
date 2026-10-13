import type { CatalogServiceResponse, ServiceFeeBulkUpdateRequest } from '@cl/api';
import { updateFeesBodyUpdatesMax as MAX_FEE_UPDATES } from '@cl/api/zod';
import { z } from 'zod';

import { blankToUndefined, hasAtMostTwoDecimals } from './fields';
import { CATEGORY_LABELS, CATEGORY_OPTIONS, filterServices, type CategoryFilter, type Option } from './services';

// Adjust Prices: raise or lower the standard fee of every service in the catalog, or of one
// category, by a percentage, rounded to a tidy amount, saved with PUT /services/fees (all or
// nothing, at most MAX_FEE_UPDATES services per request).

// ── Form ────────────────────────────────────────────────────────────────────────────────

/** A cut of 100% or more would leave services free; a rise above this is almost surely a typo. */
export const PRICE_CHANGE_MIN = -99;
export const PRICE_CHANGE_MAX = 500;

export type PriceRounding = 'NONE' | '10' | '100' | '1000';

export const PRICE_ROUNDING_OPTIONS: readonly Option[] = [
  { value: 'NONE', label: 'No Rounding' },
  { value: '10', label: 'Nearest 10' },
  { value: '100', label: 'Nearest 100' },
  { value: '1000', label: 'Nearest 1,000' },
];

/** "All Services" first, then each category. */
export const PRICE_SCOPE_OPTIONS: readonly Option[] = [{ value: 'ALL', label: 'All Services' }, ...CATEGORY_OPTIONS];

export const adjustPricesFormSchema = z.object({
  changePercent: z.preprocess(
    blankToUndefined,
    z
      .number({ error: 'Enter The Change In Percent.' })
      .min(PRICE_CHANGE_MIN, `Cannot Reduce By More Than ${-PRICE_CHANGE_MIN}%.`)
      .max(PRICE_CHANGE_MAX, `Cannot Raise By More Than ${PRICE_CHANGE_MAX}%.`)
      .refine((n) => n !== 0, 'Enter A Change Other Than 0.')
      .refine(hasAtMostTwoDecimals, 'Use At Most 2 Decimal Places.'),
  ),
  rounding: z.enum(['NONE', '10', '100', '1000']),
  scope: z.enum(['ALL', ...(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[])]),
});

export type AdjustPricesFormInput = z.input<typeof adjustPricesFormSchema>;
export type AdjustPricesFormValues = z.output<typeof adjustPricesFormSchema>;

export const ADJUST_PRICES_LABELS = {
  changePercent: 'Change By (%)',
  rounding: 'Round To',
  scope: 'Apply To',
} as const;

export const ADJUST_PRICES_HINT = 'Use A Negative Number To Reduce.';

export const ADJUST_PRICES_NOTE = 'New Prices Apply To Charges Recorded From Today. Past Charges Keep Their Original Amount.';

/** Starts at +10%, rounded to the nearest 100, for the category the Services page is showing. */
export const adjustPricesDefaults = (scope: CategoryFilter = 'ALL'): AdjustPricesFormInput => ({
  changePercent: '10',
  rounding: '100',
  scope,
});

// ── Preview ─────────────────────────────────────────────────────────────────────────────

/**
 * A fee after the change, rounded half up to the chosen amount (to paise without rounding).
 * Never negative; a fee that would round to nothing keeps the smallest step instead.
 */
export function adjustedFee(fee: number, changePercent: number, rounding: PriceRounding): number {
  const raw = (fee * (100 + changePercent)) / 100;
  if (rounding === 'NONE') return Math.max(0, Math.round(raw * 100) / 100);
  const step = Number(rounding);
  const rounded = Math.round(raw / step) * step;
  return fee > 0 && rounded <= 0 ? step : Math.max(0, rounded);
}

export interface PriceChangeRow {
  id: string;
  name: string;
  current: number;
  /** Undefined while the change entered is not valid. */
  next?: number;
}

/** The services the change applies to, each with its current fee and the new one, by name. */
export function priceChangePreview(
  services: readonly CatalogServiceResponse[],
  scope: CategoryFilter,
  changePercent: number | undefined,
  rounding: PriceRounding,
): PriceChangeRow[] {
  return filterServices(services, '', scope)
    .map((s) => {
      const current = s.standardFee ?? 0;
      return {
        id: s.id ?? s.serviceName ?? '',
        name: s.serviceName ?? '',
        current,
        next: changePercent == null ? undefined : adjustedFee(current, changePercent, rounding),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** "+10%" / "−5%". */
export const priceChangeLabel = (changePercent: number) =>
  `${changePercent > 0 ? '+' : '−'}${Number(Math.abs(changePercent).toFixed(2))}%`;

/** The Apply button: "Apply +10% To 10". */
export const applyPriceChangeLabel = (changePercent: number | undefined, count: number) =>
  changePercent == null ? 'Apply' : `Apply ${priceChangeLabel(changePercent)} To ${count}`;

// ── Request ─────────────────────────────────────────────────────────────────────────────

/** The services whose fee actually changes: rounding can leave a small fee where it was. */
export const changedFees = (rows: readonly PriceChangeRow[]) =>
  rows.filter((row): row is PriceChangeRow & { next: number } => row.next != null && row.next !== row.current);

/** The bulk update, naming only the services whose fee changes. */
export const toServiceFeeBulkUpdateRequest = (rows: readonly PriceChangeRow[]): ServiceFeeBulkUpdateRequest => ({
  updates: changedFees(rows).map((row) => ({ serviceId: row.id, standardFee: row.next })),
});

/** Why the change cannot be applied as it stands, or undefined when it can. */
export function priceChangeBlocker(rows: readonly PriceChangeRow[]): string | undefined {
  if (!rows.length) return 'No Services In This Category.';
  if (rows.some((row) => row.next == null)) return undefined; // the field shows its own error
  const changed = changedFees(rows).length;
  if (!changed) return 'No Fee Changes At This Rounding.';
  if (changed > MAX_FEE_UPDATES) return `Change At Most ${MAX_FEE_UPDATES} Services At A Time.`;
  return undefined;
}
