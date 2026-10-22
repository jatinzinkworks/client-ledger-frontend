import { BriefcaseBusiness, Cake, LayoutDashboard, Settings, UserCog, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Sidebar entries, top to bottom. Add a screen here and in the route table in App.tsx. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/managers', label: 'Managers', icon: UserCog },
  { to: '/services', label: 'Services', icon: BriefcaseBusiness },
  { to: '/birthdays', label: 'Birthdays', icon: Cake },
  { to: '/settings', label: 'Settings', icon: Settings },
]
