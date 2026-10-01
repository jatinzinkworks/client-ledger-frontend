import { CATEGORY_FILTERS, type CategoryFilter } from '@cl/schemas';
import { Search } from 'lucide-react-native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface ServiceFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

/** Name search above a horizontally scrolling row of category chips. */
export function ServiceFilters({ query, onQueryChange, category, onCategoryChange }: ServiceFiltersProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 rounded-md border border-input bg-card px-3">
        <Search size={18} color={colors.mutedForeground} />
        <TextInput
          accessibilityLabel="Search services by name"
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search Services By Name"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          className="flex-1 py-2.5 text-base text-foreground"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {CATEGORY_FILTERS.map(({ value, label }) => {
          const active = value === category;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onCategoryChange(value as CategoryFilter)}
              className={cn(
                'h-10 justify-center rounded-full border px-4',
                active ? 'border-primary bg-primary' : 'border-border bg-card',
              )}
            >
              <Text className={cn('font-bold', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
