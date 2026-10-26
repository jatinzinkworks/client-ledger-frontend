import { View } from 'react-native';

import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useThemePreference } from '@/theme/ThemePreferenceProvider';
import { THEME_OPTIONS } from '@/theme/themePreference';

/** Light, Dark, or follow the phone (System). Applies at once and is remembered. */
export function AppearanceCard() {
  const { preference, setPreference } = useThemePreference();
  return (
    <Card>
      <View className="gap-1">
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose Light Or Dark, Or Follow Your Phone's Setting.</CardDescription>
      </View>
      <SegmentedControl label="Theme" options={THEME_OPTIONS} value={preference} onChange={setPreference} />
    </Card>
  );
}
