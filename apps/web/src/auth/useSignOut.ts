import type { SignOutReason } from '@cl/schemas'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { SIGNED_OUT_PATH } from '@/utils/routes'
import { clearIapSession, clearScriptCookies } from '@/utils/signOut'

/** Router state the signed-out page reads to say why. */
export interface SignedOutState {
  reason: SignOutReason
}

/** Ends the session (IAP cookie, other cookies, cached books) and opens the signed-out page. */
export function useSignOut(): (reason?: SignOutReason) => Promise<void> {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useCallback(
    async (reason: SignOutReason = 'user') => {
      await clearIapSession()
      clearScriptCookies()
      // Nothing of this user's books stays in memory for whoever signs in next.
      queryClient.clear()
      navigate(SIGNED_OUT_PATH, { replace: true, state: { reason } satisfies SignedOutState })
    },
    [queryClient, navigate],
  )
}
