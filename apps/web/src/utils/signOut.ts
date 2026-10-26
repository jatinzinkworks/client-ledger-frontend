import { IAP_LOGOUT_URL } from './config'

/** Expires every cookie script can see on this origin, at each path and domain it may be set on. */
export function clearScriptCookies(doc: Document = document): void {
  const { hostname, pathname } = doc.location
  const paths = ['/', ...pathname.split('/').filter(Boolean).map((_, i, parts) => `/${parts.slice(0, i + 1).join('/')}`)]
  const domains = ['', hostname, `.${hostname}`]
  for (const cookie of doc.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (!name) continue
    for (const path of paths) {
      for (const domain of domains) {
        doc.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}`
      }
    }
  }
}

/**
 * Asks IAP to drop its HttpOnly session cookie. Best effort: the response is opaque (no-cors) and
 * a failure must not keep the user signed in to this screen, so errors are swallowed.
 */
export async function clearIapSession(url: string = IAP_LOGOUT_URL): Promise<void> {
  if (!url) return
  await fetch(url, { credentials: 'include', mode: 'no-cors', cache: 'no-store' }).catch(() => undefined)
}
