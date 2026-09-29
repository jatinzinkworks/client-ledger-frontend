import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderThemeCss } from '../scripts/render-css.mjs';
import { colorNames, themes } from './index.js';

describe('tokens', () => {
  it('defines every semantic colour in both themes', () => {
    expect(Object.keys(themes.dark)).toEqual(Object.keys(themes.light));
    expect(colorNames).toEqual(Object.keys(themes.light));
  });

  it('keeps the committed theme.css in sync with the source', () => {
    const committed = readFileSync(fileURLToPath(new URL('../theme.css', import.meta.url)), 'utf8');
    expect(committed).toBe(renderThemeCss());
  });
});
