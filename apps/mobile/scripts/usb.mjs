// Run the app on an Android phone over USB — no Wi-Fi or firewall involved.
//
//   pnpm dev:mobile:usb            reverse the ports, then start Expo (press `a` to open the app)
//   pnpm dev:mobile:usb --no-start only reverse the ports (e.g. after re-plugging the phone)
//
// `adb reverse` makes localhost:8081 (Expo) and localhost:8080 (backend) on the phone reach
// this PC over the cable. The routes drop whenever the phone is unplugged — just re-run this.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PORTS = [8081, 8080]; // Expo dev server, backend
const API_BASE_URL = 'http://localhost:8080';

function findAdb() {
  const exe = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    process.env.HOME && join(process.env.HOME, 'Library', 'Android', 'sdk'),
  ].filter(Boolean);
  for (const root of sdkRoots) {
    const candidate = join(root, 'platform-tools', exe);
    if (existsSync(candidate)) return candidate;
  }
  return exe; // fall back to PATH
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const adb = findAdb();
const run = (...args) => execFileSync(adb, args, { encoding: 'utf8' });

let listing;
try {
  listing = run('devices');
} catch {
  fail('adb not found. Install Android Studio (SDK Platform-Tools) or set ANDROID_HOME.');
}

const devices = listing
  .split('\n')
  .slice(1)
  .map((line) => line.trim().split(/\s+/))
  .filter(([serial, state]) => serial && state);

const unauthorized = devices.filter(([, state]) => state === 'unauthorized');
const ready = devices.filter(([, state]) => state === 'device');
// Prefer a real phone when an emulator is also running.
const phone = ready.find(([serial]) => !serial.startsWith('emulator-')) ?? ready[0];

if (!phone) {
  fail(
    unauthorized.length
      ? 'Phone found but not authorised — unlock it and tap "Allow" on the USB debugging prompt, then re-run.'
      : 'No device found. Plug the phone in with USB debugging on (Settings → Developer options).',
  );
}

const [serial] = phone;
console.log(`✔ Using device ${serial}`);
for (const port of PORTS) {
  run('-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`);
  console.log(`✔ Phone localhost:${port} → this PC:${port}`);
}

if (process.argv.includes('--no-start')) process.exit(0);

console.log(`\nStarting Expo with EXPO_PUBLIC_API_BASE_URL=${API_BASE_URL} — press "a" to open the app.\n`);
// Expo never overrides a variable that is already set, so this wins over .env for this run
// only; ANDROID_SERIAL makes `a` open on the phone rather than a running emulator.
const expo = spawn('expo', ['start', '--clear'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_API_BASE_URL: API_BASE_URL, ANDROID_SERIAL: serial },
});
expo.on('exit', (code) => process.exit(code ?? 0));
