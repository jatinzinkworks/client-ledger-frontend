import { useBirthdays } from '@cl/api';
import { NO_BIRTHDAYS_HINT, birthdaysEyebrow, currentMonth, noBirthdaysTitle } from '@cl/schemas';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { BirthdayCard } from '@/components/birthdays/BirthdayCard';
import { MonthStepper } from '@/components/birthdays/MonthStepper';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { useThemeColors } from '@/theme/useThemeColors';
import { clientHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

export default function BirthdaysScreen() {
  const colors = useThemeColors();
  const [month, setMonth] = useState(currentMonth);
  const list = useBirthdays(month);

  return (
    <FlatList
      data={list.isLoading || list.loadError ? [] : list.birthdays}
      keyExtractor={(b) => b.clientId ?? ''}
      contentContainerClassName="gap-3 p-4"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => list.refetch()} tintColor={colors.mutedForeground} />
      }
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          <MonthStepper month={month} onChange={setMonth} />
          <Text className={EYEBROW}>{list.isLoading ? ' ' : birthdaysEyebrow(list.birthdays.length, month)}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <BirthdayCard birthday={item} onPress={() => item.clientId && router.push(clientHref(item.clientId))} />
      )}
      ListEmptyComponent={
        list.isLoading ? (
          <Loading />
        ) : list.loadError ? (
          <LoadError error={list.loadError} onRetry={() => list.refetch()} />
        ) : (
          <EmptyState title={noBirthdaysTitle(month)} description={NO_BIRTHDAYS_HINT} />
        )
      }
    />
  );
}
