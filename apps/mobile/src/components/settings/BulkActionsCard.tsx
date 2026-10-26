import { useBulkActions } from '@cl/api';
import {
  BULK_ACTIONS_SECTION,
  bulkActionError,
  bulkActionRuns,
  bulkActions,
  bulkFailuresTitle,
  type BulkActionCopy,
  type BulkActionRun,
  type BulkOutcome,
} from '@cl/schemas';
import { Play } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useThemeColors } from '@/theme/useThemeColors';

/** One action: what it does, its button (asks first), then what it did or why it did not run. */
function BulkActionItem({ action, run, running }: { action: BulkActionCopy } & BulkActionRun) {
  const colors = useThemeColors();
  const [outcome, setOutcome] = useState<BulkOutcome>();
  const [error, setError] = useState<string>();

  const start = async () => {
    setOutcome(undefined);
    setError(undefined);
    try {
      setOutcome(await run());
    } catch (e) {
      setError(bulkActionError(e));
    }
  };
  const confirm = () =>
    Alert.alert(action.confirmTitle, action.confirmBody, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.label, onPress: () => void start() },
    ]);

  return (
    <View className="gap-2 border-t border-border pt-4">
      <Text className="font-bold text-card-foreground">{action.title}</Text>
      <Text className="text-sm text-muted-foreground">{action.description}</Text>
      <Button
        variant="outline"
        label={running ? action.runningLabel : action.label}
        icon={<Play size={16} color={colors.foreground} />}
        disabled={running}
        onPress={confirm}
      />
      {outcome ? (
        <View className="gap-1">
          <Text className="text-sm font-bold text-success">{outcome.summary}</Text>
          {outcome.failures.length > 0 ? (
            <>
              <Text className="text-sm font-bold text-destructive">{bulkFailuresTitle(outcome.failures.length)}</Text>
              {outcome.failures.map((f) => (
                <Text key={f.key} className="text-sm text-muted-foreground">
                  <Text className="font-bold text-card-foreground">{f.name}</Text> — {f.reason}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}

/** Settings' Bulk Actions, as the web section: payment reminders, every client's ledger summary, posting due services. */
export function BulkActionsCard() {
  const runs = bulkActionRuns(useBulkActions());
  return (
    <Card>
      <View className="gap-1">
        <CardTitle>{BULK_ACTIONS_SECTION.title}</CardTitle>
        <CardDescription>{BULK_ACTIONS_SECTION.description}</CardDescription>
      </View>
      {bulkActions().map((action) => (
        <BulkActionItem key={action.key} action={action} {...runs[action.key]} />
      ))}
    </Card>
  );
}
