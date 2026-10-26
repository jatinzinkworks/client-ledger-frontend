import { SIGN_IN_AGAIN_LABEL, SIGNED_OUT_COPY } from '@cl/schemas'
import { LogIn } from 'lucide-react'
import { useLocation } from 'react-router'

import type { SignedOutState } from '@/auth/useSignOut'
import { Button } from '@/components/ui/button'
import { FIRM } from '@/utils/branding'

export function SignedOutPage() {
  const reason = (useLocation().state as SignedOutState | null)?.reason === 'idle' ? 'idle' : 'user'
  const copy = SIGNED_OUT_COPY[reason]
  // A full page load, not a client-side route change: it goes through IAP, which asks the user
  // to sign in now that its cookie is gone.
  const signInAgain = () => window.location.assign('/')

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
        <LogIn className="size-10 text-primary" aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{FIRM.name}</span>
          <h1 className="text-xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.message}</p>
        </div>
        <Button className="w-full" onClick={signInAgain}>
          <LogIn />
          {SIGN_IN_AGAIN_LABEL}
        </Button>
      </div>
    </main>
  )
}
