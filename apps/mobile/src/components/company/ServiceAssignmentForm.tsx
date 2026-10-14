import type { CatalogServiceResponse, CompanyResponse, ServiceAssignmentResponse } from '@cl/api';
import {
  ASSIGN_SERVICE_FIELDS,
  BILLING_LABELS,
  DELETE_SERVICE_WARNING,
  assignServiceFieldFromApi,
  assignServiceFormSchema,
  assignedCatalogService,
  catalogServiceOptions,
  chargeBreakdown,
  effectiveDiscount,
  isAssignServiceComplete,
  serviceDiscountHint,
  standardFeeHint,
  upcomingDueDates,
  type AssignServiceFormInput,
  type AssignServiceFormValues,
} from '@cl/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DateControl, SelectControl, TextControl } from '@/components/ui/FormControls';
import { LoadError, Loading } from '@/components/ui/LoadState';
import { ReadOnlyField } from '@/components/ui/ReadOnlyField';

import { ChargeSummary } from './ChargeSummary';
import { DueSchedule } from './DueSchedule';
import { confirmDelete, mapSaveError } from './formHelpers';

interface ServiceAssignmentFormProps {
  company: CompanyResponse;
  /** The service catalog: the choices when adding, the schedule and fee when editing. */
  catalog: readonly CatalogServiceResponse[];
  catalogLoading: boolean;
  catalogError: Error | null;
  onRetryCatalog: () => void;
  submitLabel: string;
  defaults: AssignServiceFormInput;
  onSave: (values: AssignServiceFormValues) => Promise<unknown>;
  saving: boolean;
  onDone: () => void;
  /** Editing: the service is fixed (shown, not chosen), saving waits for a change, and it can be deleted. */
  assignment?: ServiceAssignmentResponse;
  onDelete?: () => Promise<unknown>;
  deleting?: boolean;
}

/**
 * One service of a company — Add Service and Edit Service, as on web. The fee is the catalog's
 * standard fee; a blank discount takes the company's.
 */
export function ServiceAssignmentForm({
  company,
  catalog,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  submitLabel,
  defaults,
  onSave,
  saving,
  onDone,
  assignment,
  onDelete,
  deleting,
}: ServiceAssignmentFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useForm<AssignServiceFormInput, unknown, AssignServiceFormValues>({
    resolver: zodResolver(assignServiceFormSchema),
    defaultValues: defaults,
  });
  const values = useWatch({ control });
  const [formError, setFormError] = useState<string>();
  const service = assignment
    ? assignedCatalogService(assignment, catalog)
    : catalog.find((s) => s.id === values.serviceId);
  const options = catalogServiceOptions(catalog);
  // The discount the backend will apply (the entry, else the company's); none while invalid.
  const rate = effectiveDiscount(values.discountPercent, company.discountPercent);
  const charge =
    service?.standardFee != null && rate != null ? chargeBreakdown(service.standardFee, rate, service.gstRatePercent) : undefined;

  const submit = handleSubmit(async (v) => {
    setFormError(undefined);
    try {
      await onSave(v);
      onDone();
    } catch (error) {
      setFormError(mapSaveError(error, assignServiceFieldFromApi, setError));
    }
  });

  // Editing never needs to choose from the catalog, so it can go ahead without it.
  const ready = !!assignment || (!catalogLoading && !catalogError);
  const empty = ready && !assignment && !options.length;
  const blocked = saving || !ready || empty || !isAssignServiceComplete(values) || (!!assignment && !isDirty);
  const field = ASSIGN_SERVICE_FIELDS;

  return (
    <View className="gap-5">
      {!assignment && catalogLoading && <Loading />}
      {!assignment && catalogError && <LoadError error={catalogError} onRetry={onRetryCatalog} />}
      {empty && (
        <View className="gap-3">
          <Text className="text-sm text-muted-foreground">The Service Catalog Is Empty. Add A Service First.</Text>
          <Button variant="outline" label="Open The Service Catalog" onPress={() => router.navigate('/services')} />
        </View>
      )}
      {ready && !empty && (
        <>
          {assignment ? (
            <ReadOnlyField label={field.serviceId.label} value={assignment.serviceName ?? ''} />
          ) : (
            <SelectControl
              control={control}
              name="serviceId"
              label={field.serviceId.label}
              placeholder={field.serviceId.placeholder}
              options={options}
            />
          )}
          {service && (
            <Text className="-mt-3 text-sm text-muted-foreground">
              {[service.billingFrequency && BILLING_LABELS[service.billingFrequency], standardFeeHint(service)]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
          <DateControl control={control} name="deliveryDate" label={field.deliveryDate.label} />
          <TextControl
            control={control}
            name="discountPercent"
            label={field.discountPercent.label}
            hint={serviceDiscountHint(company)}
            keyboardType="decimal-pad"
          />
          {charge && <ChargeSummary {...charge} />}
          <TextControl
            control={control}
            name="comment"
            label={field.comment.label}
            placeholder={field.comment.placeholder}
            autoComplete="off"
          />
          {service && <DueSchedule dates={upcomingDueDates(service, values.deliveryDate)} amount={charge?.total} />}
        </>
      )}
      {formError && <Text className="text-sm text-destructive">{formError}</Text>}

      <Button label={saving ? 'Saving…' : submitLabel} disabled={blocked} onPress={submit} />
      {assignment && onDelete && (
        <Button
          variant="destructive"
          label={deleting ? 'Deleting…' : 'Delete Service'}
          disabled={deleting}
          onPress={() =>
            confirmDelete({
              label: 'Delete Service',
              itemName: assignment.serviceName ?? 'This Service',
              warning: DELETE_SERVICE_WARNING,
              onDelete,
              onDone,
            })
          }
        />
      )}
    </View>
  );
}
