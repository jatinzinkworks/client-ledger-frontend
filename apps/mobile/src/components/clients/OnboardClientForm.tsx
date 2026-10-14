import { errorMessage, fieldErrors, isNotFound, type ClientRequest, type ClientResponse, type ManagerResponse } from '@cl/api';
import {
  MAX_COMPANIES,
  clientFieldFromApi,
  clientFormDefaults,
  clientFormSchema,
  isClientFormComplete,
  toClientRequest,
  type ClientFormInput,
  type ClientFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm, useWatch, type Path } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EYEBROW } from '@/utils/typography';

import { ClientDetailsFields } from './ClientDetailsFields';
import { CompanyListFields } from './CompanyListFields';

interface OnboardClientFormProps {
  managers: readonly ManagerResponse[];
  managersLoading: boolean;
  onSave: (request: ClientRequest) => Promise<ClientResponse>;
  saving: boolean;
  /** After onboarding, with the new client. */
  onDone: (client: ClientResponse) => void;
}

// Same schema, defaults, request mapping and error handling as the web OnboardClientForm.
export function OnboardClientForm({ managers, managersLoading, onSave, saving, onDone }: OnboardClientFormProps) {
  const form = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientFormDefaults(),
  });
  const { control, setError } = form;
  // Onboard stays disabled until every mandatory field has a value (the discount is optional).
  const complete = isClientFormComplete(useWatch({ control }));
  const [formError, setFormError] = useState<string>();

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      onDone(await onSave(toClientRequest(values)));
    } catch (error) {
      // 404 on create means the chosen manager was removed meanwhile.
      if (isNotFound(error)) {
        setError('managerId', { message: 'This Manager No Longer Exists. Choose Another.' });
        return;
      }
      const byField = Object.entries(fieldErrors(error)).flatMap(([path, message]) => {
        const field = clientFieldFromApi(path);
        return field ? [[field as Path<ClientFormInput>, message] as const] : [];
      });
      byField.forEach(([field, message]) => setError(field, { message }));
      if (!byField.length) setFormError(errorMessage(error));
    }
  });

  const noManagers = !managersLoading && managers.length === 0;

  return (
    <FormProvider {...form}>
      <Text className={EYEBROW}>Client</Text>
      <ClientDetailsFields managers={managers} managersLoading={managersLoading} />

      <View className="gap-4 border-t border-border pt-5">
        <Text className={EYEBROW}>Companies</Text>
        <CompanyListFields max={MAX_COMPANIES} />
      </View>
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button
        label={saving ? 'Onboarding…' : 'Onboard Client'}
        disabled={saving || noManagers || !complete}
        onPress={submit}
      />
    </FormProvider>
  );
}
