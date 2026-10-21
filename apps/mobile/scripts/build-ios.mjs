#!/usr/bin/env node
// Builds the iOS app in the cloud with EAS Build (iOS needs macOS + Xcode, so it cannot be
// built locally on Windows). Run from the repo root: `pnpm build:ios`.
//
//   --profile=<name>  an eas.json build profile (default preview):
//                       preview     ad hoc .ipa, installed from a link on the devices
//                                   registered with `npx eas-cli device:create`
//                       production  App Store / TestFlight build (build number auto-bumped)
//                       simulator   .app for the iOS Simulator on a Mac (no Apple account)
//   --submit          production only: upload the build to App Store Connect (TestFlight)
//
// The backend URL is set per profile in eas.json (EXPO_PUBLIC_API_BASE_URL), not from .env.
// Needs an Expo account (`npx eas-cli login`) and, except for simulator, a paid Apple
// Developer account: on the first run EAS asks for the Apple login and creates and stores
// the signing certificate and provisioning profile.
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROFILES = ['preview', 'production', 'simulator']
const EAS = ['--yes', 'eas-cli@latest']

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'
const args = process.argv.slice(2)
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const profile = flag('profile')?.split('=')[1] || 'preview'
const submit = Boolean(flag('submit'))

function fail(message) {
  console.error(`ERROR: ${message}`)
  process.exit(1)
}

function eas(easArgs) {
  console.log(`> eas ${easArgs.join(' ')}`)
  // shell on Windows so npx.cmd resolves.
  return spawnSync('npx', [...EAS, ...easArgs], { cwd: root, stdio: 'inherit', shell: isWindows })
}

if (!PROFILES.includes(profile)) fail(`--profile must be one of ${PROFILES.join(', ')}`)
if (submit && profile !== 'production') fail('--submit only works with --profile=production')

console.log(`Profile: ${profile}${submit ? ' (then submit to App Store Connect)' : ''}`)
if (eas(['whoami']).status !== 0) fail('not logged in to Expo — run `npx eas-cli login` first')

const build = ['build', '--platform', 'ios', '--profile', profile]
if (submit) build.push('--auto-submit')
const result = eas(build)
if (result.status !== 0) fail(`eas build exited with ${result.status ?? result.signal}`)

console.log('\nSUCCESS — the build page above has the download / install link.')
