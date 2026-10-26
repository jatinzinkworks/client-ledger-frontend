import { File, Paths } from 'expo-file-system';
import { Appearance, Platform } from 'react-native';

/** System follows the phone's appearance setting; Light and Dark override it in this app. */
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const isPreference = (value: string): value is ThemePreference => THEME_OPTIONS.some((o) => o.value === value);

// No key-value store is installed; a one-word file in the documents folder survives restarts.
const preferenceFile = () => new File(Paths.document, 'theme-preference.txt');

export function loadThemePreference(): ThemePreference {
  if (Platform.OS === 'web') return 'system';
  try {
    const file = preferenceFile();
    const stored = file.exists ? file.textSync().trim() : '';
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  if (Platform.OS === 'web') return;
  try {
    preferenceFile().write(preference);
  } catch {
    // Not remembered; the choice still applies until the app restarts.
  }
}

/** Native date pickers, alerts and the keyboard follow the app's choice, not just our views. */
export function applyThemePreference(preference: ThemePreference): void {
  if (Platform.OS === 'web') return;
  Appearance.setColorScheme?.(preference === 'system' ? 'unspecified' : preference);
}
