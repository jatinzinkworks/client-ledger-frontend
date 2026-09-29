// Zinkworks Design System tokens — the single source of truth for brand colour, type and
// radius across both apps. Web consumes them as CSS variables (theme.css, generated from
// this file by `pnpm --filter @cl/tokens generate`); mobile consumes them directly, through
// the NativeWind preset and `vars()`. Edit here, never in theme.css.

/** Fixed brand palette (mirrors mock/_ds tokens/colors.css). */
export const palette = {
  navy: '#04224C',
  green: '#006161',
  mint: '#18B389',
  seafoam: '#178581',
  teal: '#007D8B',
  indigo: '#084E71',
  orange: '#E8743B',
  charcoal: '#30414D',
  grey: '#D2D5D7',
  lightGrey: '#F3F3F4',
  white: '#FFFFFF',
  navy92: '#EDF0F4',
  navy85: '#D5DCE4',
  navy70: '#98A5B6',
  surface1: '#0A2C5A',
  surface2: '#0F3568',
  surface3: '#143E76',
  hairline: '#1F3D6B',
  hairlineStrong: '#2A4A7A',
  ink: '#F3F3F4',
  inkMuted: '#C5CFDB',
  inkSubtle: '#98A5B6',
  success: '#18B389',
  info: '#007D8B',
  warning: '#B45309',
  danger: '#B91C1C',
};

/**
 * Semantic colours per theme. Names follow shadcn/ui's convention so the web primitives
 * pick them up unchanged, and the mobile preset exposes the same names — `bg-card`,
 * `text-muted-foreground` and `border-border` mean the same thing in both apps.
 */
export const themes = {
  light: {
    background: palette.lightGrey,
    foreground: palette.navy,
    card: palette.white,
    cardForeground: palette.navy,
    popover: palette.white,
    popoverForeground: palette.navy,
    primary: palette.navy,
    primaryForeground: palette.white,
    secondary: palette.navy92,
    secondaryForeground: palette.navy,
    muted: palette.navy92,
    mutedForeground: palette.charcoal,
    accent: palette.navy92,
    accentForeground: palette.navy,
    destructive: palette.danger,
    destructiveForeground: palette.white,
    success: '#0F7A5C',
    warning: palette.warning,
    border: palette.navy85,
    input: palette.navy85,
    ring: palette.navy,
    // Eyebrow labels and brand accents.
    brand: palette.green,
    // App chrome: the sidebar stays navy in both themes, as in the mocks.
    sidebar: palette.navy,
    sidebarForeground: palette.ink,
    sidebarMuted: palette.inkSubtle,
    sidebarAccent: palette.surface2,
    sidebarBorder: palette.hairlineStrong,
  },
  dark: {
    background: palette.navy,
    foreground: palette.ink,
    card: palette.surface1,
    cardForeground: palette.ink,
    popover: palette.surface3,
    popoverForeground: palette.ink,
    primary: palette.mint,
    primaryForeground: palette.navy,
    secondary: palette.surface2,
    secondaryForeground: palette.ink,
    muted: palette.surface2,
    mutedForeground: palette.inkMuted,
    accent: palette.surface2,
    accentForeground: palette.ink,
    destructive: '#F87171',
    destructiveForeground: palette.navy,
    success: palette.mint,
    warning: '#FBBF24',
    border: palette.hairlineStrong,
    input: palette.hairlineStrong,
    ring: palette.mint,
    brand: palette.mint,
    sidebar: '#021634',
    sidebarForeground: palette.ink,
    sidebarMuted: palette.inkSubtle,
    sidebarAccent: palette.surface2,
    sidebarBorder: palette.hairline,
  },
};

/** Semantic colour names, in declaration order. */
export const colorNames = Object.keys(themes.light);

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 };

export const fontFamily = {
  sans: 'Lato',
  mono: 'JetBrains Mono',
};

/** `primaryForeground` → `primary-foreground`, the CSS variable / Tailwind class form. */
export function toKebab(name) {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
