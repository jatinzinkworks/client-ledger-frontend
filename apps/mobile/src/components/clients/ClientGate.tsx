import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { clientsHref } from '@/utils/routes';

interface ClientGateProps {
  /** From `useClient`. */
  page: { isLoading: boolean; notFound: boolean; loadError: Error | null; refetch: () => unknown };
  children: ReactNode;
}

/** Closes every screen pushed over the tabs and shows the client list (after a delete, or a dead link). */
export function goToClientList() {
  if (router.canDismiss()) router.dismissAll();
  router.navigate(clientsHref);
}

/**
 * What a client screen shows before it has the client: a spinner, "Client Not Found" (deleted,
 * or a stale link) with a way back, or the load error with Retry. Then its children.
 */
export function ClientGate({ page, children }: ClientGateProps) {
  if (page.notFound) {
    return (
      <View className="gap-3">
        <EmptyState title="Client Not Found" description="This Client May Have Been Removed." />
        <Button variant="outline" label="Back To Clients" onPress={goToClientList} />
      </View>
    );
  }
  if (page.isLoading) return <Loading className="py-8" />;
  if (page.loadError) return <LoadError error={page.loadError} onRetry={() => page.refetch()} />;
  return <>{children}</>;
}
