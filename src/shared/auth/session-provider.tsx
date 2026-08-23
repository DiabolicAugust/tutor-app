import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { defaultAuthClient, type AuthClient, type SignInCredentials } from './auth-client';
import { SessionContext, type SessionValue } from './session-context';
import { isSession, type Session } from './session';

const sessionStore = createPersistedValue<Session>(StorageKeys.session, isSession);

export type SessionProviderProps = {
  children: ReactNode;
  /**
   * The authentication backend. Defaults to the mock client in test builds and
   * to a failing client in production; pass a real one once the API exists —
   * that is the only edit required app-wide.
   */
  client?: AuthClient;
  /** Overrides the persisted session. Useful for tests and screenshot tooling. */
  initialSession?: Session | null;
};

/**
 * Owns the signed-in session for the whole app.
 *
 * The persisted session is read synchronously, so a returning user lands on the
 * app rather than watching the sign-in screen appear and disappear — which also
 * means no splash-screen gating is needed here.
 */
export function SessionProvider({
  children,
  client = defaultAuthClient,
  initialSession,
}: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(
    () => initialSession ?? sessionStore.read(),
  );
  const [isPending, setIsPending] = useState(false);
  const [errorKey, setErrorKey] = useState<SessionValue['errorKey']>(null);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      setIsPending(true);
      setErrorKey(null);
      try {
        const next = await client.signIn(credentials);
        sessionStore.write(next);
        setSession(next);
        return true;
      } catch {
        setErrorKey('auth.signInFailed');
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [client],
  );

  const signOut = useCallback(async () => {
    // Local state is cleared regardless of what the backend says: a user who
    // asked to sign out must end up signed out even if the request fails.
    try {
      await client.signOut();
    } finally {
      sessionStore.clear();
      setSession(null);
      setErrorKey(null);
    }
  }, [client]);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isSignedIn: session !== null,
      isPending,
      errorKey,
      signIn,
      signOut,
      clearError: () => setErrorKey(null),
    }),
    [session, isPending, errorKey, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
