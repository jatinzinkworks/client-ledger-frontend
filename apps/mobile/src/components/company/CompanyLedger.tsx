import { errorMessage, type LedgerEntryResponse } from '@cl/api';
import {
  companyDiscountLabel,
  financialYearLabel,
  formatApiDate,
  formatInr,
  generatedEntriesMessage,
  gstRateLabel,
  isOpeningBalance,
  isPayment,
  ledgerEntryTitle,
  openingBalanceDetail,
  ledgerEntryCountLabel,
  noLedgerEntries,
  pageRangeLabel,
  paymentMethodLabel,
} from '@cl/schemas';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { LoadError, Loading } from '@/components/ui/LoadState';
import { Section } from '@/components/ui/Section';
import { cn } from '@/utils/cn';

interface CompanyLedgerProps {
  financialYear: string;
  entries: readonly LedgerEntryResponse[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** The page shown, counting from 0. */
  page: number;
  pageSize: number;
  pageCount: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  /** Posts the services that are due; resolves to the entries created. */
  onGenerate: () => Promise<readonly unknown[]>;
  generating: boolean;
  /** Opens Edit Ledger Entry for a service charge, or Edit Payment for a payment. */
  onOpen: (entry: LedgerEntryResponse) => void;
}

const amount = (value: number | undefined) => (value != null ? formatInr(value) : '—');

/** The lines under an entry's name: a charge's rates, or how a payment came and its comment. */
function entryDetails(e: LedgerEntryResponse): string[] {
  if (isOpeningBalance(e)) return [openingBalanceDetail(e)];
  if (isPayment(e)) {
    return [[paymentMethodLabel(e.paymentMethod), e.paymentReference].filter(Boolean).join(' · '), e.comment ?? ''].filter(
      Boolean,
    );
  }
  return [
    `Fee ${amount(e.serviceFee)} · Discount ${companyDiscountLabel(e.discountPercent)} · GST ${gstRateLabel(e.gstRatePercent)}`,
  ];
}

/** One charge, payment or opening balance; tapping it opens its screen (an editor, or Delete). */
function LedgerRow({ entry: e, onPress }: { entry: LedgerEntryResponse; onPress: () => void }) {
  const payment = isPayment(e);
  const name = ledgerEntryTitle(e);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isOpeningBalance(e) ? 'Open' : 'Edit'} ${name}, ${formatApiDate(e.dueDate)}`}
      onPress={onPress}
      className="flex-row gap-3 border-t border-border px-4 py-3 active:opacity-80"
    >
      <View className="flex-1 gap-0.5">
        {/* The due date of a service charge; the date received of a payment. */}
        <Text className="text-xs text-muted-foreground">{formatApiDate(e.dueDate)}</Text>
        <Text className="text-base font-bold text-card-foreground">{name}</Text>
        {entryDetails(e).map((line) => (
          <Text key={line} className="text-sm text-muted-foreground">
            {line}
          </Text>
        ))}
      </View>
      {/* A payment's total is stored negative; show it as an amount received. */}
      <Text className={cn('text-base font-bold', payment ? 'text-success' : 'text-card-foreground')}>
        {payment ? `− ${amount(Math.abs(e.totalAmount ?? 0))}` : amount(e.totalAmount)}
      </Text>
    </Pressable>
  );
}

/**
 * A company's ledger for the financial year: Generate Service Entries and its charges and
 * payments, a page at a time. A row opens Edit Ledger Entry or Edit Payment.
 */
export function CompanyLedger({
  financialYear,
  entries,
  isLoading,
  error,
  onRetry,
  page,
  pageSize,
  pageCount,
  totalEntries,
  onPageChange,
  onGenerate,
  generating,
  onOpen,
}: CompanyLedgerProps) {
  // What the last Generate did, or why it failed.
  const [result, setResult] = useState<{ message: string; failed?: boolean }>();

  const generate = async () => {
    setResult(undefined);
    try {
      const created = await onGenerate();
      setResult({ message: generatedEntriesMessage(created.length) });
    } catch (e) {
      setResult({ message: errorMessage(e), failed: true });
    }
  };

  const body = () => {
    if (isLoading) return <Loading />;
    if (error) {
      return (
        <View className="px-4 pb-4">
          <LoadError error={error} onRetry={onRetry} />
        </View>
      );
    }
    if (!totalEntries) {
      return (
        <Text className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {noLedgerEntries(financialYear)}
        </Text>
      );
    }
    return (
      <>
        {entries.map((e) => (
          <LedgerRow key={e.id ?? `${e.companyServiceId}-${e.dueDate}`} entry={e} onPress={() => onOpen(e)} />
        ))}
        <View className="gap-3 border-t border-border px-4 py-4">
          <Text className="text-center text-sm text-muted-foreground">{pageRangeLabel(page, pageSize, totalEntries)}</Text>
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              label="Previous"
              className="flex-1"
              onPress={() => onPageChange(page - 1)}
              disabled={page === 0}
            />
            <Button
              variant="outline"
              label="Next"
              className="flex-1"
              onPress={() => onPageChange(page + 1)}
              disabled={page >= pageCount - 1}
            />
          </View>
        </View>
      </>
    );
  };

  return (
    <Section
      title="Ledger"
      hint={[!isLoading && !error && ledgerEntryCountLabel(totalEntries), financialYearLabel(financialYear)]
        .filter(Boolean)
        .join(' · ')}
      flush
    >
      <View className="gap-2 px-4 pb-4">
        <Button label={generating ? 'Generating…' : 'Generate Service Entries'} onPress={generate} disabled={generating} />
        {result && (
          <Text accessibilityLiveRegion="polite" className={cn('text-sm', result.failed ? 'text-destructive' : 'text-success')}>
            {result.message}
          </Text>
        )}
      </View>
      {body()}
    </Section>
  );
}
