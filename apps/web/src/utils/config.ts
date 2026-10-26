// Values Vite inlines from .env at start-up — restart the dev server after editing .env.

/** Release version from the repo-root `version` file. */
export const APP_VERSION: string = __APP_VERSION__

/** Backend origin. An empty string calls the app's own origin (same-origin deployment). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Clears the Google Cloud IAP session cookie. IAP sets it as HttpOnly on the backend's origin, so
 * script cannot delete it — only a request to IAP's own sign-out path can. `VITE_LOGOUT_URL`
 * overrides; otherwise it is derived from a deployed backend URL (a local backend has no IAP).
 */
export const IAP_LOGOUT_URL: string =
  import.meta.env.VITE_LOGOUT_URL || (API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, '')}/_gcp_iap/clear_login_cookie` : '')
