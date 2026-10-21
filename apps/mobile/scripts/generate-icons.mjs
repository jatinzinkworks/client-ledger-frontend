#!/usr/bin/env node
// Renders the app icons from the web app's "CL" mark (apps/web/public/favicon.svg), so both
// apps carry the same icon. Run after changing the favicon: `pnpm --filter @cl/mobile icons`,
// then rebuild the app — app.json already points at these files.
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const favicon = readFileSync(join(root, '..', 'web', 'public', 'favicon.svg'), 'utf8')
const out = join(root, 'assets', 'images')

// favicon.svg = a 64×64 background <rect> followed by the mark (the "CL" strokes and bar).
const VIEWBOX = 64
const body = favicon
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
const background = /<rect[^>]*width="64"[^>]*\/>/.exec(body)?.[0]
const mark = background && body.replace(background, '').trim()
const navy = background && /fill="(#[0-9A-Fa-f]{6})"/.exec(background)?.[1]
if (!mark || !navy) throw new Error('favicon.svg no longer starts with a 64×64 background <rect>')

// The mark's bounds in favicon units, strokes included.
const BOX = { x: 11, y: 14.5, width: 42, height: 38.5 }
const CENTER = { x: BOX.x + BOX.width / 2, y: BOX.y + BOX.height / 2 }

/** Adaptive icon layers are 108dp; launchers may crop everything outside the centre 66dp. */
const SAFE_ZONE = 66 / 108

const svg = (width, height, content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`

/** The mark scaled by `scale`, its centre placed at (cx, cy). */
const placed = (scale, cx, cy, content = mark) =>
  `<g transform="translate(${cx - CENTER.x * scale} ${cy - CENTER.y * scale}) scale(${scale})">${content}</g>`

/** Scale at which the mark's diagonal fits the adaptive icon's safe circle. */
const safeScale = (size) => (size * SAFE_ZONE) / Math.hypot(BOX.width, BOX.height)

const white = mark.replace(/#[0-9A-Fa-f]{6}/g, '#FFFFFF')

const ICONS = {
  // Android adaptive icon (app.json android.adaptiveIcon).
  'android-icon-foreground.png': svg(512, 512, placed(safeScale(512), 256, 256)),
  'android-icon-background.png': svg(512, 512, `<rect width="512" height="512" fill="${navy}"/>`),
  // Android 13+ themed icons: the launcher tints this silhouette.
  'android-icon-monochrome.png': svg(432, 432, placed(safeScale(432), 216, 216, white)),
  // The general icon (iOS too): full-bleed square, the mark where the favicon has it.
  'icon.png': svg(1024, 1024, `<rect width="1024" height="1024" fill="${navy}"/><g transform="scale(16)">${mark}</g>`),
  // Splash: the mark alone on the splash's navy background (app.json expo-splash-screen).
  'splash-icon.png': svg(512, Math.round((512 * BOX.height) / BOX.width), placed(512 / BOX.width, 256, (512 * BOX.height) / BOX.width / 2)),
  // Expo web.
  'favicon.png': svg(48, 48, `<g transform="scale(${48 / VIEWBOX})">${background}${mark}</g>`),
}

for (const [name, source] of Object.entries(ICONS)) {
  writeFileSync(join(out, name), new Resvg(source).render().asPng())
  console.log(`wrote assets/images/${name}`)
}
