import { Tabs } from 'expo-router/js-tabs';

import { useThemeColors } from '@/theme/useThemeColors';
import { TAB_ITEMS } from '@/utils/navigation';

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {TAB_ITEMS.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: ({ color, size }) => <Icon color={color} size={size} /> }}
        />
      ))}
    </Tabs>
  );
}
