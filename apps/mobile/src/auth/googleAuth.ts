import { GoogleSignin, type User } from '@react-native-google-signin/google-signin';

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/utils/config';

/** Refresh the ID token when it has less than this left (Google issues them for an hour). */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

let idToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    // The ID token's audience: IAP's OAuth client, so IAP accepts it.
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });
}

/** When the JWT expires, in ms since the epoch (0 if it cannot be read). */
function expiresAt(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return (JSON.parse(atob(padded)) as { exp?: number }).exp! * 1000;
  } catch {
    return 0;
  }
}

/** Keeps the user's ID token for requests; null clears it (signed out). */
export function rememberUser(user: User | null): void {
  idToken = user?.idToken ?? null;
}

/** Restores the previous session without UI; null when nobody is signed in. */
export async function restoreUser(): Promise<User | null> {
  const response = await GoogleSignin.signInSilently();
  const user = response.type === 'success' ? response.data : null;
  rememberUser(user);
  return user;
}

/** A current ID token, refreshed silently when close to expiry; null when signed out. */
async function currentIdToken(): Promise<string | null> {
  if (idToken && expiresAt(idToken) - Date.now() > REFRESH_MARGIN_MS) return idToken;
  // One refresh shared by every request that arrives while it runs.
  refreshing ??= restoreUser()
    .then(() => idToken)
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** For configureApi's getHeaders: IAP reads the ID token from the Authorization header. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await currentIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
