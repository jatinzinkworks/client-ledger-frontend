import { BriefcaseBusiness, LayoutDashboard, Settings, UserCog, type LucideIcon } from 'lucide-react-native';

export interface TabItem {
  /** Route file name under src/app/(tabs)/. */
  name: string;
  title: string;
  icon: LucideIcon;
}

/** Bottom tabs, left to right. Add a screen file under src/app/(tabs)/ and list it here. */
export const TAB_ITEMS: readonly TabItem[] = [
  { name: 'index', title: 'Overview', icon: LayoutDashboard },
  { name: 'managers', title: 'Managers', icon: UserCog },
  { name: 'services', title: 'Services', icon: BriefcaseBusiness },
  { name: 'settings', title: 'Settings', icon: Settings },
];
