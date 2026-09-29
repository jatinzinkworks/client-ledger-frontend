import { useQueryClient } from '@tanstack/react-query';

import {
  getGetFirmDetailsQueryKey,
  useGetFirmDetails,
  useSaveFirmDetails,
} from '../generated/global-settings/global-settings';
import type { FirmDetailsRequest, FirmDetailsResponse } from '../generated/model';
import { retryUnlessNotFound, singletonSetting } from './singletonSetting';

/** Firm details (printed on invoices and exports) for a settings screen, shared by web and mobile. */
export function useFirmDetails() {
  const queryClient = useQueryClient();
  const query = useGetFirmDetails({ query: { retry: retryUnlessNotFound } });
  const mutation = useSaveFirmDetails({
    mutation: {
      onSuccess: (saved) => queryClient.setQueryData<FirmDetailsResponse>(getGetFirmDetailsQueryKey(), saved),
    },
  });
  return singletonSetting<FirmDetailsResponse, FirmDetailsRequest>(query, mutation);
}
