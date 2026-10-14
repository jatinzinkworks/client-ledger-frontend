import { financialYearLabel, financialYearOptions } from '@cl/schemas';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { OptionSheet } from '@/components/ui/OptionSheet';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { useThemeColors } from '@/theme/useThemeColors';

/** The app-wide financial year, as a compact header button that opens a sheet of the last five years. */
export function FinancialYearPicker() {
  const { financialYear, setFinancialYear } = useFinancialYear();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => financialYearOptions(), []);
  const label = financialYearLabel(financialYear);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Financial Year: ${label}`}
        onPress={() => setOpen(true)}
        className="mr-3 flex-row items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 active:opacity-80"
      >
        <Text className="text-sm font-bold text-foreground">{label}</Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>
      <OptionSheet
        title="Financial Year"
        visible={open}
        options={options}
        selected={financialYear}
        onChoose={(fy) => {
          setFinancialYear(fy);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
