import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './components/AppLayout'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { CompanyDetailPage } from './pages/CompanyDetailPage'
import { ManagersPage } from './pages/ManagersPage'
import { OverviewPage } from './pages/OverviewPage'
import { ServicesPage } from './pages/ServicesPage'
import { SettingsPage } from './pages/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="clients/:id/companies/:companyId" element={<CompanyDetailPage />} />
        <Route path="managers" element={<ManagersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/payment-terms" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
