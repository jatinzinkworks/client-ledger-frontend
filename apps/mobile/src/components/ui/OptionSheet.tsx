import { Check } from 'lucide-react-native';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface OptionSheetProps {
  title: string;
  visible: boolean;
  options: readonly SelectOption[];
  /** The chosen option's value, ticked in the list. */
  selected?: string;
  onChoose: (value: string) => void;
  onClose: () => void;
}

/** A bottom sheet listing options, the chosen one ticked; long lists scroll inside it. */
export function OptionSheet({ title, visible, options, selected, onChoose, onClose }: OptionSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" className="flex-1 bg-black/40" onPress={onClose} />
      <View className="max-h-[70%] rounded-t-lg bg-card" style={{ paddingBottom: insets.bottom }}>
        <Text className="border-b border-border px-5 py-4 text-lg font-bold text-card-foreground">{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(o) => o.value}
          renderItem={({ item }) => {
            const isSelected = item.value === selected;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChoose(item.value)}
                className="min-h-12 flex-row items-center justify-between px-5 active:bg-muted"
              >
                <Text className={cn('text-base text-card-foreground', isSelected && 'font-bold')}>{item.label}</Text>
                {isSelected && <Check size={18} color={colors.primary} />}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
