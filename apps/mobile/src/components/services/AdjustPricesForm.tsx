import { errorMessage, type CatalogServiceResponse, type ServiceFeeBulkUpdateRequest } from '@cl/api';
import {
  ADJUST_PRICES_HINT,
  ADJUST_PRICES_LABELS,
  ADJUST_PRICES_NOTE,
  PRICE_ROUNDING_OPTIONS,
  PRICE_SCOPE_OPTIONS,
  adjustPricesDefaults,
  adjustPricesFormSchema,
  applyPriceChangeLabel,
  formatInr,
  priceChangeBlocker,
  priceChangePreview,
  servicesCountLabel,
  toServiceFeeBulkUpdateRequest,
  type AdjustPricesFormInput,
  type AdjustPricesFormValues,
  type CategoryFilter,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SelectControl, TextControl } from '@/components/ui/FormControls';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';
import { EYEBROW } from '@/utils/typography';

interface AdjustPricesFormProps {
  services: readonly CatalogServiceResponse[];
  /** The category the Services list is filtered to; the change starts out applying to it. */
  defaultScope?: CategoryFilter;
  onApply: (request: ServiceFeeBulkUpdateRequest) => Promise<unknown>;
  applying: boolean;
  onDone: () => void;
}

/**
 * Adjust Prices, as on web: change the standard fee of every service, or of one category, by a
 * percentage, with a live preview of each service's current and new fee.
 */
export function AdjustPricesForm({ services, defaultScope, onApply, applying, onDone }: AdjustPricesFormProps) {
  const colors = useThemeColors();
  const { control, setValue, handleSubmit } = useForm<AdjustPricesFormInput, unknown, AdjustPricesFormValues>({
    resolver: zodResolver(adjustPricesFormSchema),
    defaultValues: adjustPricesDefaults(defaultScope),
    mode: 'onChange',
  });
  const values = useWatch({ control });
  // The preview follows what is typed, once it is a valid change.
  const parsed = adjustPricesFormSchema.safeParse(values);
  const scope = (values.scope ?? 'ALL') as CategoryFilter;
  const rows = priceChangePreview(
    services,
    scope,
    parsed.success ? parsed.data.changePercent : undefined,
    parsed.success ? parsed.data.rounding : 'NONE',
  );
  const blocker = priceChangeBlocker(rows);
  const [formError, setFormError] = useState<string>();

  // The rows already hold the new fees for the values just validated.
  const submit = handleSubmit(async () => {
    setFormError(undefined);
    try {
      await onApply(toServiceFeeBulkUpdateRequest(rows));
      onDone();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <View className="gap-5">
      <Text className={EYEBROW}>Bulk Edit</Text>
      <TextControl
        control={control}
        name="changePercent"
        label={ADJUST_PRICES_LABELS.changePercent}
        hint={ADJUST_PRICES_HINT}
        // A plain number pad has no minus sign on iOS.
        keyboardType="numbers-and-punctuation"
      />
      <SelectControl control={control} name="rounding" label={ADJUST_PRICES_LABELS.rounding} options={PRICE_ROUNDING_OPTIONS} />

      <View className="gap-2">
        <Text className="text-sm font-bold text-foreground">{ADJUST_PRICES_LABELS.scope}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {PRICE_SCOPE_OPTIONS.map(({ value, label }) => {
            const active = value === scope;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setValue('scope', value as AdjustPricesFormInput['scope'])}
                className={cn('h-10 justify-center rounded-full border px-4', active ? 'border-primary bg-primary' : 'border-border bg-card')}
              >
                <Text className={cn('font-bold', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="overflow-hidden rounded-lg border border-border bg-card">
        <View className="flex-row justify-between bg-muted px-4 py-2.5">
          <Text className="text-xs font-bold uppercase text-muted-foreground">{servicesCountLabel(rows.length)}</Text>
          <Text className="text-xs font-bold uppercase text-muted-foreground">Current → New</Text>
        </View>
        {rows.length ? (
          rows.map((row) => (
            <View key={row.id} className="flex-row items-center gap-3 border-t border-border px-4 py-3">
              <Text className="flex-1 font-bold text-card-foreground">{row.name}</Text>
              <Text className="text-muted-foreground">{formatInr(row.current)}</Text>
              <ArrowRight size={14} color={colors.mutedForeground} />
              <Text className="font-bold text-success">{row.next != null ? formatInr(row.next) : '—'}</Text>
            </View>
          ))
        ) : (
          <Text className="px-4 py-8 text-center text-sm text-muted-foreground">No Services In This Category.</Text>
        )}
      </View>

      <Text className="text-sm text-muted-foreground">{ADJUST_PRICES_NOTE}</Text>
      {rows.length > 0 && blocker ? <Text className="text-sm text-muted-foreground">{blocker}</Text> : null}
      {formError ? <Text className="text-sm text-destructive">{formError}</Text> : null}

      <Button
        label={applying ? 'Applying…' : applyPriceChangeLabel(parsed.success ? parsed.data.changePercent : undefined, rows.length)}
        disabled={applying || !parsed.success || !!blocker}
        onPress={submit}
      />
    </View>
  );
}
