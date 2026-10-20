import type { LedgerEntryResponse } from '@cl/api';
import {
  OPENING_BALANCE_LABEL,
  deleteEntryWarning,
  formatApiDate,
  formatInr,
  ledgerEntryName,
  openingBalanceDetail,
} from '@cl/schemas';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ReadOnlyField } from '@/components/ui/ReadOnlyField';

import { confirmDelete } from './formHelpers';

interface OpeningBalanceViewProps {
  entry: LedgerEntryResponse;
  onDelete: () => Promise<unknown>;
  deleting: boolean;
  onDone: () => void;
}

/**
 * An opening balance from the company's ledger: the backend allows no changes to one, only
 * deleting it (it can be set again from Edit Company), so it is shown read-only with Delete.
 */
export function OpeningBalanceView({ entry, onDelete, deleting, onDone }: OpeningBalanceViewProps) {
  return (
    <View className="gap-5">
      <ReadOnlyField label={OPENING_BALANCE_LABEL} value={formatInr(entry.totalAmount ?? 0)} />
      <ReadOnlyField label="As Of" value={formatApiDate(entry.dueDate)} hint={entry.financialYear} />
      <Text className="text-sm text-muted-foreground">{openingBalanceDetail(entry)}</Text>
      <Button
        variant="destructive"
        label={deleting ? 'Deleting…' : 'Delete Opening Balance'}
        disabled={deleting}
        onPress={() =>
          confirmDelete({
            label: 'Delete Opening Balance',
            itemName: ledgerEntryName(entry),
            warning: deleteEntryWarning(entry),
            onDelete,
            onDone,
          })
        }
      />
    </View>
  );
}
