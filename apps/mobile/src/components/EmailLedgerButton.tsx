import type { LedgerSummaryEmailResponse } from '@cl/api';
import { EMAIL_LEDGER_LABEL, EMAIL_LEDGER_TITLE, EMAIL_SENT_TITLE, ledgerEmailError, ledgerEmailSentMessage } from '@cl/schemas';
import { Mail } from 'lucide-react-native';
import { Alert, Pressable } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/theme/useThemeColors';

interface EmailLedgerButtonProps {
  /** What sending does, e.g. from `companyLedgerEmailDescription`. */
  description: string;
  onSend: () => Promise<LedgerSummaryEmailResponse>;
  sending: boolean;
  className?: string;
  /** A small mail icon (e.g. beside a name in a list) instead of the labelled button. */
  iconOnly?: boolean;
  /** Who it is for, naming the icon for screen readers: "Email Summary: Rohan Mehta". */
  itemName?: string;
}

/** "Email Summary": it emails the client, so it asks first, then says who it went to or why it failed. */
export function EmailLedgerButton({ description, onSend, sending, className, iconOnly = false, itemName }: EmailLedgerButtonProps) {
  const colors = useThemeColors();
  const send = async () => {
    try {
      // A native alert shows text only, so the tick is a character rather than an icon.
      Alert.alert(`✓ ${EMAIL_SENT_TITLE}`, ledgerEmailSentMessage(await onSend()));
    } catch (error) {
      Alert.alert('Email Not Sent', ledgerEmailError(error));
    }
  };
  const confirm = () =>
    Alert.alert(EMAIL_LEDGER_TITLE, description, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Email', onPress: send },
    ]);
  if (iconOnly) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={itemName ? `${EMAIL_LEDGER_LABEL}: ${itemName}` : EMAIL_LEDGER_LABEL}
        accessibilityState={{ disabled: sending }}
        disabled={sending}
        onPress={confirm}
        hitSlop={10}
        className="p-1 active:opacity-60"
      >
        <Mail size={16} color={sending ? colors.border : colors.mutedForeground} />
      </Pressable>
    );
  }
  return (
    <Button
      variant="outline"
      label={sending ? 'Sending…' : EMAIL_LEDGER_LABEL}
      disabled={sending}
      onPress={confirm}
      className={className}
    />
  );
}
