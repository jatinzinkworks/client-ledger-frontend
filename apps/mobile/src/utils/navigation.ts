import { BriefcaseBusiness, Cake, LayoutDashboard, Settings, UserCog, Users, type LucideIcon } from 'lucide-react-native';

export interface TabItem {
  /** Route file name under src/app/(tabs)/. */
  name: string;
  title: string;
  icon: LucideIcon;
}

/** Bottom tabs, left to right. Add a screen file under src/app/(tabs)/ and list it here. */
export const TAB_ITEMS: readonly TabItem[] = [
  { name: 'index', title: 'Overview', icon: LayoutDashboard },
  { name: 'clients', title: 'Clients', icon: Users },
  { name: 'managers', title: 'Managers', icon: UserCog },
  { name: 'services', title: 'Services', icon: BriefcaseBusiness },
  { name: 'birthdays', title: 'Birthdays', icon: Cake },
  { name: 'settings', title: 'Settings', icon: Settings },
];
