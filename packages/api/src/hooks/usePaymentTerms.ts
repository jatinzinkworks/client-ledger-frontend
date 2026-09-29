import { useQueryClient } from '@tanstack/react-query';

import {
  getGetPaymentTermsQueryKey,
  useGetPaymentTerms,
  useSavePaymentTerms,
} from '../generated/global-settings/global-settings';
import type { PaymentTermsRequest, PaymentTermsResponse } from '../generated/model';
import { retryUnlessNotFound, singletonSetting } from './singletonSetting';

/** Payment terms for a settings screen, shared by web and mobile. */
export function usePaymentTerms() {
  const queryClient = useQueryClient();
  const query = useGetPaymentTerms({ query: { retry: retryUnlessNotFound } });
  const mutation = useSavePaymentTerms({
    mutation: {
      onSuccess: (saved) => queryClient.setQueryData<PaymentTermsResponse>(getGetPaymentTermsQueryKey(), saved),
    },
  });
  return singletonSetting<PaymentTermsResponse, PaymentTermsRequest>(query, mutation);
}
