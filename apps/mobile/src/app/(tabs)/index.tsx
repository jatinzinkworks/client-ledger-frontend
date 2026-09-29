import { ScrollView } from 'react-native';

import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

export default function OverviewScreen() {
  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <Card>
        <CardTitle>Welcome to Client Ledger</CardTitle>
        <CardDescription>
          Client, company and service screens land here as the backend exposes them. Payment terms are live under
          Settings.
        </CardDescription>
      </Card>
    </ScrollView>
  );
}
