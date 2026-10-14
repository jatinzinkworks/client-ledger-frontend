import { useOverviewRanking, type RankEntry, type RankSubject } from '@cl/api';
import { RANKING_COPY, formatInr, noRankingMessage, percentLabel, rankingMax, shareOf, type RankPeriod } from '@cl/schemas';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Legend } from './Legend';
import { OverviewSection, SectionEmpty } from './OverviewSection';
import { EntryName, RankBadge, RankingControls } from './RankingParts';

const LEGEND = [
  { label: 'Received', swatch: 'bg-success' },
  { label: 'Pending', swatch: 'bg-destructive' },
] as const;

/** One entry: billed, the share received, and a bar against the largest split into received and pending. */
function BilledRow({ subject, entry, max }: { subject: RankSubject; entry: RankEntry; max: number }) {
  const received = shareOf(entry.received, entry.billed);
  return (
    <View className="flex-row items-start gap-3">
      <RankBadge rank={entry.rank} />
      <View className="min-w-0 flex-1 gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <EntryName subject={subject} entry={entry} />
          <View className="shrink-0 items-end">
            <Text className="font-bold text-card-foreground">{formatInr(entry.billed)}</Text>
            <Text className="text-[13px] text-muted-foreground">{percentLabel(received)} Received</Text>
          </View>
        </View>
        <View className="h-2.5 flex-row gap-0.5" style={{ width: `${Math.max(shareOf(entry.billed, max) * 100, 2)}%` }}>
          {received > 0 && <View className="h-full rounded-full bg-success" style={{ width: `${received * 100}%` }} />}
          {received < 1 && <View className="h-full flex-1 rounded-full bg-destructive" />}
        </View>
      </View>
    </View>
  );
}

/** Billed most — clients, companies or managers — green for what was received, red for the rest. */
export function BilledRanking({ financialYear }: { financialYear: string }) {
  const [subject, setSubject] = useState<RankSubject>('clients');
  const [period, setPeriod] = useState<RankPeriod>('year');
  const { entries, isLoading, error, refetch } = useOverviewRanking(
    'billed',
    subject,
    period === 'year' ? financialYear : undefined,
  );
  const list = entries ?? [];
  const max = rankingMax(list, 'billed');

  return (
    <OverviewSection
      title={RANKING_COPY.billed.title}
      hint={RANKING_COPY.billed.hint}
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
          <SectionEmpty message={noRankingMessage('billed', period, financialYear)} />
        ) : (
          <View className="gap-4 border-t border-border px-4 pt-4 pb-4">
            {list.map((entry) => (
              <BilledRow key={entry.id} subject={subject} entry={entry} max={max} />
            ))}
            <Legend items={LEGEND} />
          </View>
        ))}
    </OverviewSection>
  );
}
