import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiClients, setAccessToken, setUnauthorizedHandler } from '@/shared/api';
import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import type { AuthClient, SignInCredentials } from './auth-client';
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
  client = apiClients.auth,
  initialSession,
}: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(
    () => initialSession ?? sessionStore.read(),
  );
  const [isPending, setIsPending] = useState(false);
  const [errorKey, setErrorKey] = useState<SessionValue['errorKey']>(null);

  // The HTTP layer reads the token from a module-level holder rather than from
  // React, because every request needs it and requests are not components.
  useEffect(() => {
    setAccessToken(session?.token ?? null);
  }, [session]);

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

  const adoptSession = useCallback((next: Session) => {
    sessionStore.write(next);
    setSession(next);
    setErrorKey(null);
  }, []);

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

  // A token the server will not accept is the same as no session; anything else
  // leaves the app on screens it can no longer load.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      sessionStore.clear();
      setSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isSignedIn: session !== null,
      isPending,
      errorKey,
      signIn,
      adoptSession,
      signOut,
      clearError: () => setErrorKey(null),
    }),
    [session, isPending, errorKey, signIn, adoptSession, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
