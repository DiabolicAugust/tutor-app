import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiClients, setAccessToken, setUnauthorizedHandler } from '@/shared/api';
import { useT } from '@/shared/i18n';
import {
  StorageKeys,
  createPersistedValue,
  secureStorage,
} from '@/shared/lib/storage';
import { useToast } from '@/shared/ui';

import type { AuthClient, SignInCredentials } from './auth-client';
import { SessionContext, type SessionValue } from './session-context';
import { isSession, type Session } from './session';

/**
 * The session, in the platform's keystore rather than the ordinary store.
 *
 * It carries a bearer token, and that token is the account: anybody holding it
 * reads every student, note and document the account can reach. Encrypted at
 * rest and left out of device backups — which is what stops a session ending up
 * in somebody's cloud backup and being restored onto another phone.
 */
const sessionStore = createPersistedValue<Session>(
  StorageKeys.session,
  isSession,
  secureStorage,
);

/**
 * The persisted session, read at module load, with the token handed to the HTTP
 * layer immediately.
 *
 * Not in an effect, and that is the whole point. Passive effects run
 * **child-first**, so a `useEffect` in this provider runs *after* the providers
 * beneath it have already fired their first requests. Those requests would go
 * out with no `Authorization` header, come back 401, and the unauthorized
 * handler would clear the session that had just been established — a successful
 * sign-in bouncing straight back to the sign-in screen, and a returning user
 * signed out on launch.
 *
 * Module scope runs before any component mounts, which is the only ordering that
 * makes the token available to the first request.
 */
const restoredSession = sessionStore.read();
setAccessToken(restoredSession?.token ?? null);

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
  const [session, setSession] = useState<Session | null>(() => {
    const initial = initialSession ?? restoredSession;
    // Only for an injected session; the persisted one was applied at module
    // load. Synchronous for the same reason as above.
    if (initialSession) setAccessToken(initial?.token ?? null);
    return initial;
  });
  const [isPending, setIsPending] = useState(false);
  const [errorKey, setErrorKey] = useState<SessionValue['errorKey']>(null);
  const { t } = useT();
  const toast = useToast();

  /**
   * Applies a session everywhere it has to be true at once.
   *
   * The token goes to the HTTP layer in the same tick as the state change, so
   * the screens the flipped guard is about to mount can already authenticate.
   */
  const apply = useCallback((next: Session | null) => {
    setAccessToken(next?.token ?? null);
    if (next) sessionStore.write(next);
    else sessionStore.clear();
    setSession(next);
  }, []);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      setIsPending(true);
      setErrorKey(null);
      try {
        const next = await client.signIn(credentials);
        apply(next);
        return true;
      } catch {
        setErrorKey('auth.signInFailed');
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [client, apply],
  );

  const updateUser = useCallback(
    (patch: Partial<Session['user']>) => {
      setSession((current) => {
        if (!current) return current;
        const next = { ...current, user: { ...current.user, ...patch } };
        // Persisted, not just held: the point of this method is that the change
        // survives a relaunch. The token is unchanged, so it is not republished.
        sessionStore.write(next);
        return next;
      });
    },
    [],
  );

  const adoptSession = useCallback(
    (next: Session) => {
      apply(next);
      setErrorKey(null);
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    // Local state is cleared regardless of what the backend says: a user who
    // asked to sign out must end up signed out even if the request fails.
    try {
      await client.signOut();
    } finally {
      apply(null);
      setErrorKey(null);
    }
  }, [client, apply]);

  // A token the server will not accept is the same as no session; anything else
  // leaves the app on screens it can no longer load. Announced, because being
  // returned to the sign-in screen with no explanation reads as the app losing
  // the password rather than the session having expired.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      apply(null);
      toast.show(t('auth.sessionExpired'));
    });
    return () => setUnauthorizedHandler(null);
  }, [apply, toast, t]);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isSignedIn: session !== null,
      isPending,
      errorKey,
      signIn,
      adoptSession,
      updateUser,
      signOut,
      clearError: () => setErrorKey(null),
    }),
    [session, isPending, errorKey, signIn, adoptSession, updateUser, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
