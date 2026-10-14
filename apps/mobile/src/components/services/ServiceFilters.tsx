import { CATEGORY_FILTERS, type CategoryFilter } from '@cl/schemas';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SearchField } from '@/components/ui/SearchField';
import { cn } from '@/utils/cn';

interface ServiceFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

/** Name search above a horizontally scrolling row of category chips. */
export function ServiceFilters({ query, onQueryChange, category, onCategoryChange }: ServiceFiltersProps) {
  return (
    <View className="gap-3">
      <SearchField value={query} onChangeText={onQueryChange} placeholder="Search Services By Name" />
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
