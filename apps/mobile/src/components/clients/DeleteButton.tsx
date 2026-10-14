import { ApiError, errorMessage } from '@cl/api';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

interface DeleteButtonProps {
  /** Button and confirm-action text, e.g. "Delete Company". */
  label: string;
  /** Name of the record, used in the confirm title. */
  itemName: string;
  /** What deleting does, the confirm body. */
  description: string;
  /** Why deleting is not allowed right now; disables the button and shows underneath. */
  disabledReason?: string;
  /** Shown instead of the backend's message when it refuses with 409 (the record is in use). */
  conflictMessage?: string;
  /** Deletes, then moves on (the screen showing the record is gone). */
  onDelete: () => Promise<unknown>;
  deleting: boolean;
}

/** The mobile form of the web DeleteButton: a destructive button confirmed in a native alert. */
export function DeleteButton({
  label,
  itemName,
  description,
  disabledReason,
  conflictMessage,
  onDelete,
  deleting,
}: DeleteButtonProps) {
  const confirm = () =>
    Alert.alert(`Delete ${itemName}?`, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
          } catch (error) {
            const conflict = conflictMessage && error instanceof ApiError && error.status === 409;
            Alert.alert('Could Not Delete', conflict ? conflictMessage : errorMessage(error));
          }
        },
      },
    ]);

  return (
    <View className="gap-1.5">
      <Button
        variant="destructive"
        label={deleting ? 'Deleting…' : label}
        disabled={deleting || !!disabledReason}
        onPress={confirm}
      />
      {disabledReason ? <Text className="text-sm text-muted-foreground">{disabledReason}</Text> : null}
    </View>
  );
}
