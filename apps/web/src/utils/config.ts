// Values Vite inlines from .env at start-up — restart the dev server after editing .env.

/** Backend origin. An empty string calls the app's own origin (same-origin deployment). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''
