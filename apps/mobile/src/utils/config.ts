// EXPO_PUBLIC_* values are inlined at bundle time — restart `expo start` after editing .env.

/**
 * Backend origin. `localhost` works on the iOS simulator and web; the Android emulator
 * reaches the host machine at 10.0.2.2, and a physical device needs the machine's LAN IP.
 */
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/**
 * The deployed backend sits behind Google Cloud IAP, which accepts a Google ID token issued for
 * its own OAuth client (type Web). Set for release builds (build-apk.mjs, eas.json); left unset,
 * sign-in is off and requests go out without a token — a local backend has no IAP.
 */
export const GOOGLE_WEB_CLIENT_ID: string = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** The iOS OAuth client (bundle com.zinkworks.clientledger); needed for sign-in on iOS. */
export const GOOGLE_IOS_CLIENT_ID: string = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

export const AUTH_ENABLED = GOOGLE_WEB_CLIENT_ID !== '';
