import { useFirmDetails, usePaymentTerms } from '@cl/api';
import {
  FIRM_DETAILS_SECTION,
  PAYMENT_TERMS_SECTION,
  firmDetailsFormDefaults,
  paymentTermsFormDefaults,
} from '@cl/schemas';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { FirmDetailsForm } from '@/components/settings/FirmDetailsForm';
import { PaymentTermsForm } from '@/components/settings/PaymentTermsForm';
import { SettingsCard } from '@/components/settings/SettingsCard';

export default function SettingsScreen() {
  const paymentTerms = usePaymentTerms();
  const firmDetails = useFirmDetails();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
        <SettingsCard {...PAYMENT_TERMS_SECTION} setting={paymentTerms} savedMessage="Payment Terms Saved.">
          <PaymentTermsForm
            // Re-seed the form whenever a different stored version arrives (including after a save).
            key={paymentTerms.stored?.updatedAt ?? 'defaults'}
            defaultValues={paymentTermsFormDefaults(paymentTerms.stored)}
            onSubmit={paymentTerms.save}
            saving={paymentTerms.saving}
          />
        </SettingsCard>

        <SettingsCard {...FIRM_DETAILS_SECTION} setting={firmDetails} savedMessage="Firm Details Saved.">
          <FirmDetailsForm
            key={firmDetails.stored?.updatedAt ?? 'blank'}
            defaultValues={firmDetailsFormDefaults(firmDetails.stored)}
            onSubmit={firmDetails.save}
            saving={firmDetails.saving}
          />
        </SettingsCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
