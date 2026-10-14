import type { CompanyResponse } from '@cl/api';
import { companyDiscountDetail, companyTypeLabel, formatInr, servicesCountLabel } from '@cl/schemas';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AccountStatusBadge } from '@/components/AccountStatusBadge';
import { Section } from '@/components/ui/Section';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

import { FigureGrid } from './FigureGrid';

const amount = (value: number | undefined) => (value != null ? formatInr(value) : '—');

interface CompaniesListProps {
  companies: readonly CompanyResponse[];
  /** The selected financial year's label, "FY 2026–27": the figures are for that year. */
  yearLabel: string;
  onOpen: (companyId: string) => void;
}

/**
 * A client's companies — the mobile form of the web CompaniesTable: name, legal form, services
 * and discount, the year's billed / received / pending and status. A row opens the company;
 * deleting a company is in Edit Company.
 */
export function CompaniesList({ companies, yearLabel, onOpen }: CompaniesListProps) {
  const colors = useThemeColors();
  return (
    <Section title="Companies" hint={`Figures For ${yearLabel}`} flush>
      {companies.map((company) => {
        const pending = company.pending;
        const details = [
          companyTypeLabel(company.companyType),
          company.serviceCount != null && servicesCountLabel(company.serviceCount),
          companyDiscountDetail(company.discountPercent),
        ].filter(Boolean);
        return (
          <Pressable
            key={company.id ?? company.companyName}
            accessibilityRole="button"
            accessibilityLabel={`Open ${company.companyName ?? 'Company'}`}
            onPress={() => company.id && onOpen(company.id)}
            className="gap-3 border-t border-border px-4 py-3.5 active:bg-muted"
          >
            <View className="flex-row items-start gap-2">
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-base font-bold text-card-foreground">{company.companyName}</Text>
                <Text className="text-[13px] text-muted-foreground">{details.join(' · ')}</Text>
              </View>
              <AccountStatusBadge pending={pending} />
              <ChevronRight size={18} color={colors.mutedForeground} />
            </View>
            <FigureGrid
              figures={[
                { label: 'Billed', value: amount(company.totalBilled) },
                { label: 'Received', value: amount(company.totalPaymentReceived), className: 'text-success' },
                {
                  label: 'Pending',
                  value: amount(pending),
                  className: cn('font-bold', (pending ?? 0) > 0 && 'text-destructive'),
                },
              ]}
            />
          </Pressable>
        );
      })}
    </Section>
  );
}
