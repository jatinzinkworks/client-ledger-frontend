import { colorNames, fontFamily, radius, themes, toKebab } from '../src/index.js';

const block = (selector, theme) =>
  `${selector} {\n${colorNames.map((n) => `  --${toKebab(n)}: ${theme[n]};`).join('\n')}\n}`;

/** Renders the Tailwind v4 token file imported by apps/web/src/index.css. */
export function renderThemeCss() {
  return `/* GENERATED from packages/tokens/src/index.js — do not edit by hand.
   Regenerate with: pnpm --filter @cl/tokens generate */

${block(':root', themes.light)}

${block('.dark', themes.dark)}

@theme inline {
${colorNames.map((n) => `  --color-${toKebab(n)}: var(--${toKebab(n)});`).join('\n')}
  --radius-sm: ${radius.sm}px;
  --radius-md: ${radius.md}px;
  --radius-lg: ${radius.lg}px;
  --font-sans: "${fontFamily.sans}", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "${fontFamily.mono}", ui-monospace, "SF Mono", Menlo, monospace;
}
`;
}
