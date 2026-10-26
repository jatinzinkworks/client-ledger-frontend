import { themes, type ThemeName } from '@cl/tokens';
import { useColorScheme } from 'react-native';

import { useThemePreference } from './ThemePreferenceProvider';

/** The active theme name: the user's choice in Settings, or the OS appearance for System. */
export function useThemeName(): ThemeName {
  const { preference } = useThemePreference();
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return preference === 'system' ? system : preference;
}

/**
 * Raw token colours for props that take a colour value rather than a className
 * (icon `color`, placeholderTextColor, Switch tracks, navigation theme).
 */
export function useThemeColors() {
  return themes[useThemeName()];
}
