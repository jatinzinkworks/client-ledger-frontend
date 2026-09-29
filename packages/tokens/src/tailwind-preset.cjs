// Tailwind v3 preset for the mobile app (NativeWind). Every semantic colour resolves to a
// CSS variable that the app sets per theme at runtime with NativeWind's `vars()` — that is
// what lets `bg-card` switch between light and dark without a `dark:` variant.
// CommonJS because Tailwind v3 loads presets with require().
const { colorNames, radius, fontFamily, toKebab } = require('./index.js');

const colors = Object.fromEntries(
  colorNames.map((name) => [toKebab(name), `var(--${toKebab(name)})`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors,
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
      },
      fontFamily: {
        sans: [fontFamily.sans],
        mono: [fontFamily.mono],
      },
    },
  },
};
