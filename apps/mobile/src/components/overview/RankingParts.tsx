import type { RankEntry, RankSubject } from '@cl/api';
import { RANK_SUBJECT_OPTIONS, rankEntryNote, rankPeriodOptions, type RankPeriod } from '@cl/schemas';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { cn } from '@/utils/cn';
import { clientHref, companyHref } from '@/utils/routes';

import { EmailShortcut } from './EmailShortcut';

/** A ranked client or company opens its screen; managers have none. */
function entryHref(subject: RankSubject, e: RankEntry) {
  if (subject === 'clients') return clientHref(e.id);
  if (subject === 'companies' && e.clientId && e.companyId) return companyHref(e.clientId, e.companyId);
  return undefined;
}

/** The place in the ranking: the top three filled in the brand colour. */
export function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <View className={cn('size-7 items-center justify-center rounded-full', top ? 'bg-primary' : 'bg-muted')}>
      <Text className={cn('text-xs font-black', top ? 'text-primary-foreground' : 'text-muted-foreground')}>{rank}</Text>
    </View>
  );
}

/**
 * The ranked name, pressable to its screen when it has one, with a mail shortcut to email a client
 * or company their ledger summary, and who it is underneath.
 */
export function EntryName({ subject, entry }: { subject: RankSubject; entry: RankEntry }) {
  const href = entryHref(subject, entry);
  const note = rankEntryNote(subject, entry);
  const name = (
    <Text numberOfLines={1} className="font-bold text-card-foreground">
      {entry.name}
    </Text>
  );
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <View className="min-w-0 flex-row items-center gap-1">
        {href ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(href)}
            hitSlop={6}
            className="min-w-0 flex-shrink active:opacity-70"
          >
            {name}
          </Pressable>
        ) : (
          <View className="min-w-0 flex-shrink">{name}</View>
        )}
        <EmailShortcut subject={subject} entry={entry} />
      </View>
      {note ? (
        <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

interface RankingControlsProps {
  subject: RankSubject;
  onSubjectChange: (subject: RankSubject) => void;
  period: RankPeriod;
  onPeriodChange: (period: RankPeriod) => void;
  financialYear: string;
}

/** Who a ranking lists (Clients / Companies / Managers), and over which period. */
export function RankingControls({ subject, onSubjectChange, period, onPeriodChange, financialYear }: RankingControlsProps) {
  return (
    <>
      <SegmentedControl label="Rank" options={RANK_SUBJECT_OPTIONS} value={subject} onChange={onSubjectChange} />
      <SegmentedControl label="Period" options={rankPeriodOptions(financialYear)} value={period} onChange={onPeriodChange} />
    </>
  );
}
