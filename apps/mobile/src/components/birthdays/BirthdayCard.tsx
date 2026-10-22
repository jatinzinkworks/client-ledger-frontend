import type { ClientBirthdayResponse } from '@cl/api';
import {
  BIRTHDAY_TODAY_LABEL,
  birthdayCardLabel,
  birthdayMonthShort,
  clientName,
  isBirthdayToday,
  turningAgeLabel,
} from '@cl/schemas';
import { Mail, Phone, UserCog } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StatusPill } from '@/components/ui/StatusPill';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

interface BirthdayCardProps {
  birthday: ClientBirthdayResponse;
  onPress: () => void;
}

/**
 * One client's birthday, as the web BirthdayCard: a date tile, their name and the age they turn,
 * then phone, email and manager. Today's birthdays are outlined and marked. Tapping opens the client.
 */
export function BirthdayCard({ birthday, onPress }: BirthdayCardProps) {
  const colors = useThemeColors();
  const name = clientName(birthday);
  const today = isBirthdayToday(birthday.birthday);
  const contacts = [
    { icon: Phone, text: birthday.phone },
    { icon: Mail, text: birthday.email },
    { icon: UserCog, text: birthday.managerName && `Manager: ${birthday.managerName}` },
  ].filter((row) => row.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={birthdayCardLabel(birthday, name)}
      onPress={onPress}
      className={cn('gap-4 rounded-lg border bg-card p-4 active:opacity-80', today ? 'border-primary' : 'border-border')}
    >
      <View className="flex-row items-center gap-3">
        <View className={cn('h-14 w-14 items-center justify-center rounded-lg', today ? 'bg-primary' : 'bg-muted')}>
          <Text className={cn('text-xl font-black', today ? 'text-primary-foreground' : 'text-primary')}>
            {birthday.dayOfMonth}
          </Text>
          <Text className={cn('text-[11px] font-bold uppercase', today ? 'text-primary-foreground' : 'text-primary')}>
            {birthdayMonthShort(birthday.birthday)}
          </Text>
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-lg font-bold text-card-foreground">
            {name}
          </Text>
          <Text className="text-[13px] text-muted-foreground">{turningAgeLabel(birthday.birthday)}</Text>
        </View>
        {today && <StatusPill tone="brand" label={BIRTHDAY_TODAY_LABEL} />}
      </View>

      {contacts.length > 0 && (
        <View className="gap-2 border-t border-border pt-3">
          {contacts.map(({ icon: Icon, text }) => (
            <View key={text} className="flex-row items-center gap-2">
              <Icon size={14} color={colors.mutedForeground} />
              <Text numberOfLines={1} className="flex-shrink text-sm text-card-foreground">
                {text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
