import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { applyThemePreference, loadThemePreference, saveThemePreference, type ThemePreference } from './themePreference';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceState | null>(null);

/** The user's Light / Dark / System choice from Settings, remembered across restarts. */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setState] = useState<ThemePreference>(loadThemePreference);

  useEffect(() => applyThemePreference(preference), [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    saveThemePreference(next);
    setState(next);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceState {
  const state = useContext(ThemePreferenceContext);
  if (!state) throw new Error('useThemePreference must be used inside ThemePreferenceProvider');
  return state;
}
