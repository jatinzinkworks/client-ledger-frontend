#!/usr/bin/env node
// Builds a release Android APK locally (Gradle, no EAS account needed), pointed at the
// deployed backend. Run from the repo root: `pnpm build:apk`.
//
//   --abi=<list>   ABIs to compile, comma-separated (default arm64-v8a, every phone since
//                  ~2017; pass --abi=all for armeabi-v7a,arm64-v8a,x86,x86_64)
//   --install      also install the APK on the device connected over USB (adb)
//
// API_BASE_URL in the environment overrides the backend below.
//
// Needs the Android SDK (ANDROID_HOME) and a JDK 17+ (JAVA_HOME or `java` on PATH).
// android/ is regenerated from app.json on every run (CNG) — never edit it by hand.
// The APK is signed with the debug key: fine to sideload, not for the Play Store.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_BASE_URL = process.env.API_BASE_URL || 'https://136-82-161-4.nip.io'
const ALL_ABIS = 'armeabi-v7a,arm64-v8a,x86,x86_64'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'
const args = process.argv.slice(2)
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const abiArg = flag('abi')?.split('=')[1]
const abis = abiArg === 'all' ? ALL_ABIS : abiArg || 'arm64-v8a'

function step(n, title) {
  console.log(`\n==========================================\n[${n}/4] ${title}\n==========================================`)
}

function run(command, commandArgs, cwd) {
  console.log(`> ${command} ${commandArgs.join(' ')}`)
  // shell on Windows so .cmd / .bat (npx, gradlew.bat) resolve.
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit', shell: isWindows })
  if (result.status !== 0) {
    console.error(`\nERROR: ${command} exited with ${result.status ?? result.signal}`)
    process.exit(1)
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`)
  process.exit(1)
}

// ---------- Step 1: Preflight ----------------------------------------------
step(1, 'Checking the toolchain')
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
if (!sdk || !existsSync(sdk)) fail('ANDROID_HOME is not set to the Android SDK folder')
if (!/^https:\/\//.test(API_BASE_URL)) {
  fail(`API_BASE_URL must be https:// (release builds block cleartext http): ${API_BASE_URL}`)
}
const { version } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo
console.log(`Android SDK: ${sdk}`)
console.log(`Backend:     ${API_BASE_URL}`)
console.log(`ABIs:        ${abis}`)
console.log(`App version: ${version}`)

// Expo inlines EXPO_PUBLIC_* into the JS bundle when Gradle bundles it. A variable already
// in the environment wins over .env, so the dev value there (10.0.2.2) is not used.
process.env.EXPO_PUBLIC_API_BASE_URL = API_BASE_URL
process.env.NODE_ENV = 'production'

// ---------- Step 2: Generate the native project ----------------------------
step(2, 'Generating android/ from app.json')
run('npx', ['expo', 'prebuild', '--platform', 'android', '--clean', '--no-install'], root)

// ---------- Step 3: Gradle release build -----------------------------------
step(3, 'Building the release APK')
const androidDir = join(root, 'android')
run(
  isWindows ? 'gradlew.bat' : './gradlew',
  ['assembleRelease', `-PreactNativeArchitectures=${abis}`, '--no-daemon'],
  androidDir,
)

const built = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
if (!existsSync(built)) fail(`Gradle finished but ${built} is missing`)
const outDir = join(root, 'dist')
mkdirSync(outDir, { recursive: true })
const apk = join(outDir, `client-ledger-${version}.apk`)
copyFileSync(built, apk)

// ---------- Step 4: Install (optional) -------------------------------------
step(4, flag('install') ? 'Installing on the USB device' : 'Install skipped (pass --install)')
if (flag('install')) {
  const adb = join(sdk, 'platform-tools', isWindows ? 'adb.exe' : 'adb')
  run(adb, ['install', '-r', apk], root)
}

console.log(`\n==========================================\nSUCCESS\n==========================================`)
console.log(`APK:     ${apk}`)
console.log(`Backend: ${API_BASE_URL}`)
