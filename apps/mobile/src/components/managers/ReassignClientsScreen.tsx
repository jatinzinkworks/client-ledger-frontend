import { useClients, useManagerCatalog, useReassignClients, type ClientSummaryResponse } from '@cl/api';
import {
  NO_CLIENTS_ON_BOARD,
  REASSIGN_CLIENTS_LABEL,
  REASSIGN_HINT_TAP,
  SAVE_REASSIGN_LABEL,
  boardColumnFigures,
  clientName,
  companyCountLabel,
  formatInr,
  managerInitials,
  managerName,
  moveClient,
  moveClientTitle,
  movedFromLabel,
  reassignBoard,
  reassignChangesLabel,
  reassignFailedMessage,
  reassignMoves,
  reassignSavedMessage,
  roleLabel,
  toReassignRequests,
  type ReassignDraft,
} from '@cl/schemas';
import { router } from 'expo-router';
import { ArrowRightLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { LoadError, Loading } from '@/components/ui/LoadState';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { useThemeColors } from '@/theme/useThemeColors';
import { cn } from '@/utils/cn';

/**
 * Reassign Clients on mobile: the web board as a section per manager. Tap a client to pick the
 * manager they move to (web drags the card); nothing is saved until Save Changes, which sends one
 * bulk request per receiving manager. Moves that fail stay, with the reason, to try again.
 */
export function ReassignClientsScreen() {
  const colors = useThemeColors();
  const catalog = useManagerCatalog();
  const clients = useClients();
  const { save, saving } = useReassignClients();
  const [draft, setDraft] = useState<ReassignDraft>({});
  const [moving, setMoving] = useState<ClientSummaryResponse>();
  const [error, setError] = useState<string>();

  const columns = useMemo(
    () => reassignBoard(catalog.managers, clients.clients, draft),
    [catalog.managers, clients.clients, draft],
  );
  const moves = reassignMoves(clients.clients, draft);
  const managerOptions = catalog.managers.map((m) => ({ value: m.id ?? '', label: managerName(m) }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/managers'));

  const onSave = async () => {
    setError(undefined);
    const outcome = await save(toReassignRequests(moves));
    if (!outcome.failures.length) {
      Alert.alert(reassignSavedMessage(outcome.savedClientIds.length));
      return close();
    }
    // Keep only the moves that failed; the saved ones now match each client's manager.
    const failed = new Set(outcome.failures.flatMap((f) => f.request.clientIds));
    setDraft((d) => Object.fromEntries(Object.entries(d).filter(([clientId]) => failed.has(clientId))));
    setError(
      [reassignFailedMessage(failed.size, outcome.savedClientIds.length), ...new Set(outcome.failures.map((f) => f.message))].join(' '),
    );
  };

  const loadError = catalog.loadError ?? clients.loadError;
  return (
    <FormScreen title={REASSIGN_CLIENTS_LABEL}>
      <Text className="text-[15px] text-muted-foreground">{REASSIGN_HINT_TAP}</Text>
      {catalog.isLoading || clients.isLoading ? (
        <Loading />
      ) : loadError ? (
        <LoadError
          error={loadError}
          onRetry={() => {
            catalog.refetch();
            clients.refetch();
          }}
        />
      ) : (
        <>
          {columns.map((column) => {
            const figures = boardColumnFigures(column);
            return (
              <View key={column.manager.id} className="gap-3 rounded-xl border-2 border-dashed border-border p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-primary-foreground">{managerInitials(column.manager)}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold text-foreground">{managerName(column.manager)}</Text>
                    <Text className="text-[13px] text-muted-foreground">{roleLabel(column.manager.role)}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between border-b border-border pb-2">
                  <Text className="text-xs font-bold uppercase tracking-wide text-foreground">{figures.clients}</Text>
                  <Text className="text-xs font-bold uppercase tracking-wide text-foreground">{figures.pending}</Text>
                </View>
                {column.clients.length ? (
                  column.clients.map(({ client, movedFrom }) => (
                    <Pressable
                      key={client.id}
                      accessibilityRole="button"
                      accessibilityLabel={moveClientTitle(client)}
                      disabled={saving}
                      onPress={() => setMoving(client)}
                      className={cn(
                        'gap-1.5 rounded-lg border bg-card p-3 active:opacity-70',
                        movedFrom ? 'border-primary' : 'border-border',
                      )}
                    >
                      <View className="flex-row items-center justify-between gap-2">
                        <Text numberOfLines={1} className="flex-1 text-base font-bold text-card-foreground">{clientName(client)}</Text>
                        <ArrowRightLeft size={16} color={colors.mutedForeground} />
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-[13px] text-muted-foreground">{companyCountLabel(client.companyNames?.length)}</Text>
                        <Text className="text-[13px] font-bold text-card-foreground">{formatInr(client.totalPending ?? 0)}</Text>
                      </View>
                      {movedFrom ? <Text className="text-xs font-bold text-primary">{movedFromLabel(movedFrom)}</Text> : null}
                    </Pressable>
                  ))
                ) : (
                  <Text className="py-3 text-center text-sm text-muted-foreground">{NO_CLIENTS_ON_BOARD}</Text>
                )}
              </View>
            );
          })}

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Text className="text-center text-sm text-muted-foreground">{reassignChangesLabel(moves.length)}</Text>
          <View className="flex-row gap-2">
            <Button variant="outline" label="Cancel" className="flex-1" disabled={saving} onPress={close} />
            <Button
              label={saving ? 'Saving…' : SAVE_REASSIGN_LABEL}
              className="flex-1"
              disabled={!moves.length || saving}
              onPress={onSave}
            />
          </View>
        </>
      )}

      <OptionSheet
        title={moving ? moveClientTitle(moving) : ''}
        visible={!!moving}
        options={managerOptions}
        selected={moving ? (draft[moving.id ?? ''] ?? moving.managerId) : undefined}
        onChoose={(managerId) => {
          if (moving) setDraft((d) => moveClient(d, moving, managerId));
          setMoving(undefined);
        }}
        onClose={() => setMoving(undefined)}
      />
    </FormScreen>
  );
}
