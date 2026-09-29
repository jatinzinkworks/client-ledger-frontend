export declare const palette: Readonly<Record<string, string>>;

export type ThemeName = 'light' | 'dark';

export type ColorName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'success'
  | 'warning'
  | 'border'
  | 'input'
  | 'ring'
  | 'brand'
  | 'sidebar'
  | 'sidebarForeground'
  | 'sidebarMuted'
  | 'sidebarAccent'
  | 'sidebarBorder';

export declare const themes: Readonly<Record<ThemeName, Readonly<Record<ColorName, string>>>>;
export declare const colorNames: readonly ColorName[];
export declare const radius: Readonly<{ sm: number; md: number; lg: number; pill: number }>;
export declare const fontFamily: Readonly<{ sans: string; mono: string }>;
export declare function toKebab(name: string): string;
