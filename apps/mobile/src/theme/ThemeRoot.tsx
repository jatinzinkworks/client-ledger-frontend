import { colorNames, themes, toKebab, type ThemeName } from '@cl/tokens';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useThemeName } from './useThemeColors';

// The Tailwind preset maps `bg-card` etc. to CSS variables; these set them per theme, so
// every semantic class switches with the OS appearance without a `dark:` variant.
const cssVars = Object.fromEntries(
  (['light', 'dark'] as const).map((name) => [
    name,
    vars(Object.fromEntries(colorNames.map((c) => [`--${toKebab(c)}`, themes[name][c]]))),
  ]),
) as Record<ThemeName, ReturnType<typeof vars>>;

function navigationTheme(name: ThemeName): Theme {
  const base = name === 'dark' ? DarkTheme : DefaultTheme;
  const t = themes[name];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: t.primary,
      background: t.background,
      card: t.card,
      text: t.foreground,
      border: t.border,
    },
  };
}

export function ThemeRoot({ children }: { children: ReactNode }) {
  const name = useThemeName();
  return (
    <ThemeProvider value={navigationTheme(name)}>
      <View style={cssVars[name]} className="flex-1 bg-background">
        {children}
      </View>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
