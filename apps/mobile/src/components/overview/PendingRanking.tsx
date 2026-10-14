import { useOverviewRanking, type RankEntry, type RankSubject } from '@cl/api';
import { PENDING_RANKING_TITLES, RANKING_COPY, formatInr, noRankingMessage, rankingMax, shareOf, type RankPeriod } from '@cl/schemas';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { OverviewSection, SectionEmpty } from './OverviewSection';
import { EntryName, RankBadge, RankingControls } from './RankingParts';

/** How many rows show before "Show All". */
const ROWS_SHOWN = 5;

function PendingRow({ subject, entry, max }: { subject: RankSubject; entry: RankEntry; max: number }) {
  return (
    <View className="flex-row items-start gap-3 border-t border-border px-4 py-3">
      <RankBadge rank={entry.rank} />
      <View className="min-w-0 flex-1 gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <EntryName subject={subject} entry={entry} />
          <View className="shrink-0 items-end">
            <Text className="font-bold text-destructive">{formatInr(entry.pending)}</Text>
            <Text className="text-[13px] text-muted-foreground">Of {formatInr(entry.billed)}</Text>
          </View>
        </View>
        <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-destructive" style={{ width: `${shareOf(entry.pending, max) * 100}%` }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Who owes most — clients, companies or managers — each pending amount over a bar drawn against
 * the largest. The first few show, the rest behind Show All (no scrolling inside the screen's scroll).
 * What is owed is not a one-year figure, so it starts at all years.
 */
export function PendingRanking({ financialYear }: { financialYear: string }) {
  const [subject, setSubject] = useState<RankSubject>('clients');
  const [period, setPeriod] = useState<RankPeriod>('all');
  const [expanded, setExpanded] = useState(false);
  const { entries, isLoading, error, refetch } = useOverviewRanking(
    'pending',
    subject,
    period === 'year' ? financialYear : undefined,
  );
  const list = entries ?? [];
  const max = rankingMax(list, 'pending');
  const shown = expanded ? list : list.slice(0, ROWS_SHOWN);

  return (
    <OverviewSection
      title={PENDING_RANKING_TITLES[subject]}
      hint={RANKING_COPY.pending.hint}
      controls={
        <RankingControls
          subject={subject}
          onSubjectChange={setSubject}
          period={period}
          onPeriodChange={setPeriod}
          financialYear={financialYear}
        />
      }
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {entries &&
        (list.length === 0 ? (
          <SectionEmpty message={noRankingMessage('pending', period, financialYear)} />
        ) : (
          <View>
            {shown.map((entry) => (
              <PendingRow key={entry.id} subject={subject} entry={entry} max={max} />
            ))}
            {list.length > ROWS_SHOWN && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setExpanded((open) => !open)}
                className="items-center border-t border-border py-3 active:opacity-70"
              >
                <Text className="text-sm font-bold text-primary">{expanded ? 'Show Fewer' : `Show All ${list.length}`}</Text>
              </Pressable>
            )}
          </View>
        ))}
    </OverviewSection>
  );
}
