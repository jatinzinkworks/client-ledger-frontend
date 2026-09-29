// Generates theme.css (the web app's light/dark token blocks) from src/index.js.
// Run `pnpm --filter @cl/tokens generate` after editing the tokens; a test fails if the
// committed file drifts from the source.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { renderThemeCss } from './render-css.mjs';

const out = fileURLToPath(new URL('../theme.css', import.meta.url));
writeFileSync(out, renderThemeCss());
console.log(`wrote ${out}`);
