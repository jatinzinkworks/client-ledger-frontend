import type { ClientLedgerStatusResponse, FinancialYearStatus } from '@cl/api';
import { YEAR_STATUS_LABELS, clientYearsNote, formatInr, yearNote, yearTitle, type YearStatus } from '@cl/schemas';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LoadError, Loading } from '@/components/ui/LoadState';
import { Section } from '@/components/ui/Section';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { useThemeColors } from '@/theme/useThemeColors';

import { FigureGrid } from './FigureGrid';

const TONE: Readonly<Record<YearStatus, StatusTone>> = { PENDING: 'warning', CARRIED: 'danger', SETTLED: 'success' };

type Figures = Pick<FinancialYearStatus, 'billed' | 'discount' | 'received' | 'closingBalance' | 'status'>;

const amount = (value: number | undefined) => formatInr(value ?? 0);

/** A year's (or one company's share of it) billed, discount, received and closing balance. */
function YearFigures({ figures }: { figures: Figures }) {
  return (
    <FigureGrid
      figures={[
        { label: 'Billed', value: amount(figures.billed) },
        { label: 'Discount', value: `− ${amount(figures.discount)}`, className: 'text-success' },
        { label: 'Received', value: amount(figures.received) },
        { label: 'Closing Balance', value: amount(figures.closingBalance), className: 'font-bold' },
      ]}
    />
  );
}

function StatusOf({ status }: { status: YearStatus | undefined }) {
  return status ? <StatusPill tone={TONE[status]} label={YEAR_STATUS_LABELS[status]} /> : null;
}

/** One year: its title and figures; tapped, its companies open underneath. */
function YearRow({ year, open, onToggle }: { year: FinancialYearStatus; open: boolean; onToggle: () => void }) {
  const colors = useThemeColors();
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <View className="border-t border-border">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        className="gap-3 px-4 py-3.5 active:bg-muted"
      >
        <View className="flex-row items-start gap-2">
          <Chevron size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-base font-bold text-card-foreground">{yearTitle(year)}</Text>
            <Text className="text-[13px] text-muted-foreground">{yearNote(year)}</Text>
          </View>
          <StatusOf status={year.status} />
        </View>
        <YearFigures figures={year} />
      </Pressable>
      {open &&
        (year.companies ?? []).map((company) => (
          <View key={company.companyId ?? company.companyName} className="gap-2 border-t border-border bg-muted py-3 pr-4 pl-10">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-[15px] font-bold text-foreground">{company.companyName}</Text>
              <StatusOf status={company.status} />
            </View>
            <YearFigures figures={company} />
          </View>
        ))}
    </View>
  );
}

interface YearBalancesProps {
  status: ClientLedgerStatusResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

/**
 * Balance By Financial Year on the client page: every year since the client became one, latest
 * first, independent of the selected year; tap a year to open its companies.
 */
export function YearBalances({ status, isLoading, error, onRetry }: YearBalancesProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (fy: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(fy)) next.add(fy);
      return next;
    });
  const years = status?.years ?? [];

  return (
    <Section
      title="Balance By Financial Year"
      hint={status ? `${clientYearsNote(status)}. Tap A Year To Open It.` : undefined}
      flush
    >
      {isLoading && <Loading />}
      {error && (
        <View className="px-4 pb-4">
          <LoadError error={error} onRetry={onRetry} />
        </View>
      )}
      {status &&
        (years.length ? (
          years.map((year) => (
            <YearRow
              key={year.financialYear}
              year={year}
              open={open.has(year.financialYear ?? '')}
              onToggle={() => toggle(year.financialYear ?? '')}
            />
          ))
        ) : (
          <Text className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No Ledger Activity Yet.
          </Text>
        ))}
    </Section>
  );
}
