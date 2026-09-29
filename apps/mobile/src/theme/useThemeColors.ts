import { themes, type ThemeName } from '@cl/tokens';
import { useColorScheme } from 'react-native';

/** The active theme name — mobile follows the OS appearance setting. */
export function useThemeName(): ThemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/**
 * Raw token colours for props that take a colour value rather than a className
 * (icon `color`, placeholderTextColor, Switch tracks, navigation theme).
 */
export function useThemeColors() {
  return themes[useThemeName()];
}
