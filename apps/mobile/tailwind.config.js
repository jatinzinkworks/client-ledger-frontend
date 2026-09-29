// Tailwind v3 (NativeWind 4). Brand colours come from @cl/tokens, shared with the web app;
// they resolve to CSS variables set per theme in src/theme/ThemeRoot.tsx.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('@cl/tokens/tailwind-preset')],
};
