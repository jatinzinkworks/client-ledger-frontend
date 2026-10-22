import {
  LEDGER_PAGE_SIZE,
  useClient,
  useCompany,
  useCompanyLedger,
  useCompanyLedgerEmail,
  useCompanyLedgerExport,
  useCompanyLedgerPdf,
} from '@cl/api';
import { clientName, companyLedgerEmailDescription, financialYearLabel, ledgerSummaryCards } from '@cl/schemas';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { EmailLedgerButton } from '@/components/EmailLedgerButton';
import { ExportLedgerButton } from '@/components/ExportLedgerButton';
import { FinancialYearPicker } from '@/components/FinancialYearPicker';
import { SummaryCards } from '@/components/SummaryCards';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadError, Loading } from '@/components/ui/LoadState';
import { useFinancialYear } from '@/financialYear/useFinancialYear';
import { useThemeColors } from '@/theme/useThemeColors';
import {
  assignmentHref,
  clientHref,
  editCompanyHref,
  ledgerEntryHref,
  newAssignmentHref,
  recordPaymentHref,
} from '@/utils/routes';

import { CompanyHeader } from './CompanyHeader';
import { CompanyLedger } from './CompanyLedger';
import { CompanyServices } from './CompanyServices';

/**
 * One company of a client: its details, the year's summary, the services assigned to it and its
 * ledger for the selected financial year. Mount it keyed by client and company, so another
 * company starts afresh.
 */
export function CompanyScreen({ clientId, companyId }: { clientId: string; companyId: string }) {
  const page = useCompany(clientId, companyId);
  const { financialYear } = useFinancialYear();
  const ledger = useCompanyLedger(clientId, companyId, financialYear);
  const ledgerExport = useCompanyLedgerExport(clientId, companyId);
  const ledgerPdf = useCompanyLedgerPdf(clientId, companyId);
  const ledgerEmail = useCompanyLedgerEmail(clientId, companyId);
  const owner = useClient(clientId);
  const ownerName = owner.client ? clientName(owner.client) : '';
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const { company } = page;
  // Back to the client page underneath, or onto it when opened some other way.
  const openClient = () => router.dismissTo(clientHref(clientId));

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([page.refetch(), ledger.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const body = () => {
    if (page.notFound) {
      return (
        <View className="gap-4">
          <EmptyState title="Company Not Found" description="This Company May Have Been Removed." />
          <Button variant="outline" label={ownerName ? `Back To ${ownerName}` : 'Back To Client'} onPress={openClient} />
        </View>
      );
    }
    if (page.isLoading) return <Loading />;
    if (page.loadError) return <LoadError error={page.loadError} onRetry={() => page.refetch()} />;
    if (!company) return null;
    return (
      <>
        <CompanyHeader
          company={company}
          eyebrow={financialYearLabel(financialYear)}
          clientName={ownerName}
          onOpenClient={openClient}
          onEdit={() => router.push(editCompanyHref(clientId, companyId))}
        />
        <View className="gap-3">
          <View className="flex-row gap-3">
            <Button label="Record Payment" className="flex-1" onPress={() => router.push(recordPaymentHref(clientId, companyId))} />
            <Button label="Add Service" className="flex-1" onPress={() => router.push(newAssignmentHref(clientId, companyId))} />
          </View>
          <View className="flex-row items-start gap-3">
            <ExportLedgerButton ledgerExport={ledgerExport} name={company.companyName ?? ''} className="flex-1" />
            <EmailLedgerButton
              description={companyLedgerEmailDescription(company.companyName ?? '')}
              onSend={ledgerEmail.send}
              sending={ledgerEmail.sending}
              className="flex-1"
            />
          </View>
          <ExportLedgerButton ledgerExport={ledgerPdf} name={company.companyName ?? ''} format="pdf" />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Summary For {financialYearLabel(financialYear)}</Text>
          <SummaryCards
            cards={ledger.yearSummary && ledgerSummaryCards(ledger.yearSummary, financialYear)}
            isLoading={ledger.yearSummaryLoading}
            error={ledger.yearSummaryError}
            onRetry={() => ledger.refetch()}
          />
        </View>

        <CompanyServices
          services={page.services}
          isLoading={page.servicesLoading}
          error={page.servicesError}
          onRetry={() => page.refetch()}
          onOpen={(s) => s.id && router.push(assignmentHref(clientId, companyId, s.id))}
        />
        <CompanyLedger
          financialYear={financialYear}
          entries={ledger.entries}
          isLoading={ledger.isLoading}
          error={ledger.error}
          onRetry={() => ledger.refetch()}
          page={ledger.page}
          pageSize={LEDGER_PAGE_SIZE}
          pageCount={ledger.pageCount}
          totalEntries={ledger.totalEntries}
          onPageChange={ledger.setPage}
          onGenerate={ledger.generate}
          generating={ledger.generating}
          onOpen={(e) => e.id && router.push(ledgerEntryHref(clientId, companyId, e.id))}
        />
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: company?.companyName ?? 'Company', headerRight: () => <FinancialYearPicker /> }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 p-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      >
        {body()}
      </ScrollView>
    </>
  );
}
