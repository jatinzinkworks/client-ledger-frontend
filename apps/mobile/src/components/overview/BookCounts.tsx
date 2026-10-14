import type { OverviewResponse } from '@cl/api';
import { bookCounts, companiesPerClientLabel, type BookCountKey } from '@cl/schemas';
import { router } from 'expo-router';
import { Building2, BriefcaseBusiness, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';
import { clientsHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

const ICONS: Readonly<Record<BookCountKey, LucideIcon>> = {
  clients: Users,
  companies: Building2,
  services: BriefcaseBusiness,
};

// Where a count leads, when it has a screen of its own.
const LINKS: Partial<Record<BookCountKey, typeof clientsHref>> = { clients: clientsHref };

/** The firm's book as it stands now: clients, companies and services assigned. */
export function BookCounts({ overview }: { overview: OverviewResponse }) {
  const colors = useThemeColors();
  const note = companiesPerClientLabel(overview);
  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <View className="flex-row flex-wrap items-baseline justify-between gap-2">
        <Text className={EYEBROW}>Your Book Today</Text>
        {note ? <Text className="text-sm text-muted-foreground">{note}</Text> : null}
      </View>
      <View className="flex-row gap-2">
        {bookCounts(overview).map(({ key, label, value }) => {
          const Icon = ICONS[key];
          const link = LINKS[key];
          const body = (
            <>
              <View className="flex-row items-center gap-1.5">
                <Icon size={14} color={colors.brand} />
                <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
                  {label}
                </Text>
              </View>
              <Text adjustsFontSizeToFit numberOfLines={1} className="text-2xl font-black text-card-foreground">
                {value.toLocaleString('en-IN')}
              </Text>
            </>
          );
          const box = 'flex-1 gap-1 rounded-md border border-border bg-muted p-3';
          return link ? (
            <Pressable
              key={key}
              accessibilityRole="link"
              accessibilityLabel={`${value} ${label}`}
              onPress={() => router.push(link)}
              className={cn(box, 'active:opacity-70')}
            >
              {body}
            </Pressable>
          ) : (
            <View key={key} className={box}>
              {body}
            </View>
          );
        })}
      </View>
    </View>
  );
}
