import { BIRTHDAY_LABEL, clientBirthdayLabel } from '@cl/schemas';
import { Cake } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface ClientBirthdayProps {
  birthday: string | undefined;
  iconSize?: number;
  /** The date's text classes. */
  className?: string;
}

/** A cake icon and the client's birthday ("23 Jul 1985"); nothing when none is recorded. */
export function ClientBirthday({ birthday, iconSize = 13, className }: ClientBirthdayProps) {
  const colors = useThemeColors();
  const date = clientBirthdayLabel(birthday);
  if (!date) return null;
  return (
    <View accessible accessibilityLabel={`${BIRTHDAY_LABEL} ${date}`} className="flex-row items-center gap-1.5">
      <Cake size={iconSize} color={colors.mutedForeground} />
      <Text className={cn('text-muted-foreground', className)}>{date}</Text>
    </View>
  );
}
