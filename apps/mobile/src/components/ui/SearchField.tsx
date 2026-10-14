import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

interface SearchFieldProps {
  value: string;
  onChangeText: (query: string) => void;
  /** Also its accessibility label, e.g. "Search Services By Name". */
  placeholder: string;
}

/** A search box with a magnifier: filters a list as you type. */
export function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2 rounded-md border border-input bg-card px-3">
      <Search size={18} color={colors.mutedForeground} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        className="flex-1 py-2.5 text-base text-foreground"
      />
    </View>
  );
}
