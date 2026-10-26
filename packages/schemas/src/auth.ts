// Sign-out rules and copy shared by both apps.

export const SIGN_OUT_LABEL = 'Sign Out';
export const SIGNING_OUT_LABEL = 'Signing Out…';
export const SIGN_IN_AGAIN_LABEL = 'Sign In Again';

/** Signed out automatically after this long without a tap, click, key press or scroll. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** How often the apps check for idleness while open. */
export const IDLE_CHECK_INTERVAL_MS = 30 * 1000;

/** Why the user was signed out: they chose to, or the session timed out. */
export type SignOutReason = 'user' | 'idle';

export const SIGNED_OUT_COPY: Record<SignOutReason, { title: string; message: string }> = {
  user: {
    title: 'You Have Signed Out',
    message: 'Your session has ended on this device. Sign in again to get back to the books.',
  },
  idle: {
    title: 'Signed Out After Inactivity',
    message: 'You were signed out after 30 minutes without activity, to keep the books safe. Sign in again to continue.',
  },
};

/** How both apps show their release version, e.g. "Version 1.2". */
export const versionLabel = (version: string): string => `Version ${version}`;

/** True once `timeoutMs` has passed since the last activity. */
export function isIdle(lastActivityAt: number, now: number, timeoutMs: number = IDLE_TIMEOUT_MS): boolean {
  return now - lastActivityAt >= timeoutMs;
}
