import { PageHeader } from '@/components/PageHeader'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" />
      <Card>
        <CardHeader>
          <CardTitle>Welcome To Client Ledger</CardTitle>
          <CardDescription>
            Client, Company And Service Screens Land Here As The Backend Exposes Them. Payment Terms Are Live Under
            Settings.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
