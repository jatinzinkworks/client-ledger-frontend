import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { AUTH_ENABLED } from '@/utils/config';

import { rememberUser, restoreUser } from './googleAuth';

type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

export interface SignedInUser {
  name: string | null;
  email: string;
}

interface AuthState {
  status: AuthStatus;
  /** Null while signed out, and always when sign-in is off (local backend). */
  user: SignedInUser | null;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function signInError(error: unknown): string | null {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.IN_PROGRESS) return null;
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services Is Not Available On This Device.';
    }
  }
  return error instanceof Error ? error.message : 'Sign-In Failed. Please Try Again.';
}

/** Google sign-in for the IAP-protected backend; a pass-through when AUTH_ENABLED is off. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(AUTH_ENABLED ? 'checking' : 'signedIn');
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    restoreUser()
      .then((restored) => {
        setUser(restored ? restored.user : null);
        setStatus(restored ? 'signedIn' : 'signedOut');
      })
      .catch(() => setStatus('signedOut'));
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // cancelled
      rememberUser(response.data);
      setUser(response.data.user);
      setStatus('signedIn');
    } catch (e) {
      setError(signInError(e));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await GoogleSignin.signOut().catch(() => null);
    rememberUser(null);
    // Nothing of the previous user's books stays on screen for the next one.
    queryClient.clear();
    setUser(null);
    setStatus('signedOut');
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user, signingIn, error, signIn, signOut }),
    [status, user, signingIn, error, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
