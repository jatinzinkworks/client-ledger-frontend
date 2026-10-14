import { useClient, useClientLedgerSummary, useClientYearBalances } from '@cl/api';
import { clientName, clientSummaryCards, financialYearLabel } from '@cl/schemas';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { ClientActions } from '@/components/clients/ClientActions';
import { ClientGate } from '@/components/clients/ClientGate';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { CompaniesList } from '@/components/clients/CompaniesList';
import { YearBalances } from '@/components/clients/YearBalances';
import { FinancialYearPicker } from '@/components/FinancialYearPicker';
import { SummaryCards } from '@/components/SummaryCards';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { useThemeColors } from '@/theme/useThemeColors';
import { companyHref, editClientHref } from '@/utils/routes';
import { EYEBROW } from '@/utils/typography';

/** One client: their details, the year's summary, their companies and their balance by year. */
export default function ClientScreen() {
  const { clientId = '' } = useLocalSearchParams<{ clientId: string }>();
  const { financialYear } = useFinancialYear();
  const colors = useThemeColors();
  // The companies list carries each company's billed / received / pending for the year.
  const page = useClient(clientId, financialYear);
  const yearSummary = useClientLedgerSummary(clientId, financialYear);
  const yearBalances = useClientYearBalances(clientId);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([page.refetch(), yearSummary.refetch(), yearBalances.refetch()]);
    setRefreshing(false);
  };

  const { client } = page;
  const name = client ? clientName(client) : '';
  const yearLabel = financialYearLabel(financialYear);
  // The client's services, for the Billed card's note: a sum over their companies' counts.
  const serviceCount = page.companies.reduce((total, c) => total + (c.serviceCount ?? 0), 0);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4 pb-10"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
    >
      <Stack.Screen
        options={{ headerShown: true, title: name || 'Client', headerRight: () => <FinancialYearPicker /> }}
      />
      <ClientGate page={page}>
        {client && (
          <>
            <ClientHeader client={client} yearLabel={yearLabel} onEdit={() => router.push(editClientHref(clientId))} />
            <ClientActions clientId={clientId} name={name} companyCount={page.companies.length} />
            <View className="gap-2">
              <Text className={EYEBROW}>Summary For {yearLabel}</Text>
              <SummaryCards
                cards={yearSummary.summary && clientSummaryCards(yearSummary.summary, financialYear, serviceCount)}
                isLoading={yearSummary.isLoading}
                error={yearSummary.error}
                onRetry={() => yearSummary.refetch()}
              />
            </View>
            <CompaniesList
              companies={page.companies}
              yearLabel={yearLabel}
              onOpen={(companyId) => router.push(companyHref(clientId, companyId))}
            />
            <YearBalances
              status={yearBalances.status}
              isLoading={yearBalances.isLoading}
              error={yearBalances.error}
              onRetry={() => yearBalances.refetch()}
            />
          </>
        )}
      </ClientGate>
    </ScrollView>
  );
}
