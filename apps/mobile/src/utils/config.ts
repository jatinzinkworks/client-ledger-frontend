// EXPO_PUBLIC_* values are inlined at bundle time — restart `expo start` after editing .env.

/**
 * Backend origin. `localhost` works on the iOS simulator and web; the Android emulator
 * reaches the host machine at 10.0.2.2, and a physical device needs the machine's LAN IP.
 */
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
