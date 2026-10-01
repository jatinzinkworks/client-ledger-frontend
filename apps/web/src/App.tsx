import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './components/AppLayout'
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
        <Route path="managers" element={<ManagersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/payment-terms" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
