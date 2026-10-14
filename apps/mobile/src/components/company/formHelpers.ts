import { errorMessage, fieldErrors } from '@cl/api';
import { router, type Href } from 'expo-router';
import { Alert } from 'react-native';

/**
 * Puts the backend's field errors on the fields the form renders (via the schema's
 * `…FieldFromApi` mapper); returns the message to show under the form when none matched.
 */
export function mapSaveError<F extends string>(
  error: unknown,
  fieldFromApi: (path: string) => F | undefined,
  setError: (field: F, error: { message: string }) => void,
): string | undefined {
  const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
    const field = fieldFromApi(path);
    return field ? [[field, message] as const] : [];
  });
  byField.forEach(([field, message]) => setError(field, { message }));
  return byField.length ? undefined : errorMessage(error);
}

/** Asks before deleting, then deletes and calls `onDone`; a failure is shown in an alert. */
export function confirmDelete({
  label,
  itemName,
  warning,
  onDelete,
  onDone,
}: {
  /** The action, e.g. "Delete Service". */
  label: string;
  /** What is deleted, e.g. the service's name. */
  itemName: string;
  warning: string;
  onDelete: () => Promise<unknown>;
  onDone: () => void;
}) {
  Alert.alert(`${label}?`, `${itemName}\n\n${warning}`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await onDelete();
          onDone();
        } catch (error) {
          Alert.alert('Could Not Delete', errorMessage(error));
        }
      },
    },
  ]);
}

/** Back to the screen underneath, or to `fallback` when the screen was opened directly (a deep link). */
export const goBack = (fallback: Href) => (router.canGoBack() ? router.back() : router.replace(fallback));
