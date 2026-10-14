import { ApiError, errorMessage, fieldErrors, type CompanyRequest } from '@cl/api';
import {
  COMPANY_FIELDS,
  addCompanyFormSchema,
  areCompaniesComplete,
  toCompanyRequest,
  type AddCompanyFormInput,
  type AddCompanyFormValues,
  type CompanyField,
  type CompanyFormInput,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { Button } from '@/components/ui/Button';

import { CompanyFields } from './CompanyFields';

interface CompanyFormProps {
  submitLabel: string;
  defaults: CompanyFormInput;
  onSave: (request: CompanyRequest) => Promise<unknown>;
  saving: boolean;
  onDone: () => void;
  /** Editing: keep the submit disabled until something changes. */
  requireChange?: boolean;
  /** Shown instead of the backend's message when it refuses with 409. */
  conflictMessage?: string;
  /** Replaces the fields, e.g. when the client can hold no more companies. */
  unavailable?: ReactNode;
  /** Under the submit button, e.g. Edit Company's Delete Company. */
  footer?: ReactNode;
}

/**
 * One company of a client — Add Company and Edit Company, as the web CompanyForm. The form holds
 * a one-item `companies` array so it reuses the onboarding company block.
 */
export function CompanyForm({
  submitLabel,
  defaults,
  onSave,
  saving,
  onDone,
  requireChange = false,
  conflictMessage,
  unavailable,
  footer,
}: CompanyFormProps) {
  const form = useForm<AddCompanyFormInput, unknown, AddCompanyFormValues>({
    resolver: zodResolver(addCompanyFormSchema),
    defaultValues: { companies: [defaults] },
  });
  const {
    control,
    setError,
    formState: { isDirty },
  } = form;
  const companies = useWatch({ control, name: 'companies' });
  const [formError, setFormError] = useState<string>();

  const submit = form.handleSubmit(async ({ companies: [company] }) => {
    setFormError(undefined);
    try {
      await onSave(toCompanyRequest(company));
      onDone();
    } catch (error) {
      if (conflictMessage && error instanceof ApiError && error.status === 409) {
        setFormError(conflictMessage);
        return;
      }
      const byField = Object.entries(fieldErrors(error)).filter(([path]) => path in COMPANY_FIELDS) as [CompanyField, string][];
      byField.forEach(([field, message]) => setError(`companies.0.${field}`, { message }));
      if (!byField.length) setFormError(errorMessage(error));
    }
  });

  const blocked = saving || !!unavailable || !areCompaniesComplete(companies) || (requireChange && !isDirty);

  return (
    <FormProvider {...form}>
      {unavailable ?? <CompanyFields index={0} />}
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}
      <Button label={saving ? 'Saving…' : submitLabel} disabled={blocked} onPress={submit} />
      {footer}
    </FormProvider>
  );
}
