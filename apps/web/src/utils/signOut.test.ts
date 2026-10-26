import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearIapSession, clearScriptCookies } from './signOut'

describe('clearScriptCookies', () => {
  it('expires every cookie script can see', () => {
    document.cookie = 'first=1; path=/'
    document.cookie = 'second=2; path=/'
    clearScriptCookies()
    expect(document.cookie).toBe('')
  })
})

describe('clearIapSession', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('calls the sign-out URL with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    await clearIapSession('https://backend.test/_gcp_iap/clear_login_cookie')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.test/_gcp_iap/clear_login_cookie',
      expect.objectContaining({ credentials: 'include', mode: 'no-cors' }),
    )
  })

  it('does nothing without a URL and never throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'))
    vi.stubGlobal('fetch', fetchMock)
    await clearIapSession('')
    expect(fetchMock).not.toHaveBeenCalled()
    await expect(clearIapSession('https://backend.test/x')).resolves.toBeUndefined()
  })
})
