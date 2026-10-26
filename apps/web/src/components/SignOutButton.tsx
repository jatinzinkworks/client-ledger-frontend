import { SIGN_OUT_LABEL, SIGNING_OUT_LABEL } from '@cl/schemas'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { useSignOut } from '@/auth/useSignOut'
import { Button } from '@/components/ui/button'

export function SignOutButton({ className }: { className?: string }) {
  const signOut = useSignOut()
  const [signingOut, setSigningOut] = useState(false)

  const onClick = () => {
    setSigningOut(true)
    void signOut()
  }

  return (
    <Button variant="ghost" size="sm" className={className} onClick={onClick} disabled={signingOut}>
      <LogOut />
      <span>{signingOut ? SIGNING_OUT_LABEL : SIGN_OUT_LABEL}</span>
    </Button>
  )
}
