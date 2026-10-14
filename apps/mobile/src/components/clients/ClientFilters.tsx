import type { ManagerResponse } from '@cl/api';
import { managerFilterOptions } from '@cl/schemas';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { OptionSheet } from '@/components/ui/OptionSheet';
import { SearchField } from '@/components/ui/SearchField';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface ClientFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  managerId: string;
  onManagerChange: (managerId: string) => void;
  managers: readonly ManagerResponse[];
  overdueOnly: boolean;
  onOverdueOnlyChange: (overdueOnly: boolean) => void;
}

const CHIP = 'h-10 flex-row items-center gap-1.5 rounded-full border px-4';

/**
 * Search by client or company, and narrow to one manager's clients and to those overdue — the
 * web filters, with the manager choice as a chip opening a sheet.
 */
export function ClientFilters({
  query,
  onQueryChange,
  managerId,
  onManagerChange,
  managers,
  overdueOnly,
  onOverdueOnlyChange,
}: ClientFiltersProps) {
  const colors = useThemeColors();
  const [choosing, setChoosing] = useState(false);
  const options = useMemo(() => managerFilterOptions(managers), [managers]);
  const managerLabel = options.find((o) => o.value === managerId)?.label ?? options[0].label;

  return (
    <View className="gap-3">
      <SearchField value={query} onChangeText={onQueryChange} placeholder="Search Clients Or Companies" />
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter By Manager: ${managerLabel}`}
          onPress={() => setChoosing(true)}
          className={cn(CHIP, 'flex-shrink border-border bg-card active:opacity-80')}
        >
          <Text numberOfLines={1} className="flex-shrink font-bold text-foreground">
            {managerLabel}
          </Text>
          <ChevronDown size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: overdueOnly }}
          onPress={() => onOverdueOnlyChange(!overdueOnly)}
          className={cn(CHIP, overdueOnly ? 'border-destructive bg-destructive' : 'border-border bg-card')}
        >
          <Text className={cn('font-bold', overdueOnly ? 'text-destructive-foreground' : 'text-foreground')}>
            Overdue Only
          </Text>
        </Pressable>
      </View>

      <OptionSheet
        title="Filter By Manager"
        visible={choosing}
        options={options}
        selected={managerId}
        onChoose={(value) => {
          onManagerChange(value);
          setChoosing(false);
        }}
        onClose={() => setChoosing(false)}
      />
    </View>
  );
}
