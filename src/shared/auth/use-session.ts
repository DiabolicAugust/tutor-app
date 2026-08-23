import { useContext } from 'react';

import { SessionContext, type SessionValue } from './session-context';
import type { AuthUser } from './session';

/** Session state and the sign-in/sign-out actions. */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside <SessionProvider>.');
  }
  return value;
}

/**
 * The signed-in user, for screens that only render behind a guard.
 *
 * Throws instead of returning `null` so protected screens do not each need a
 * `user &&` branch that can never be false in practice.
 */
export function useCurrentUser(): AuthUser {
  const { user } = useSession();
  if (!user) {
    throw new Error('useCurrentUser was called outside a protected route.');
  }
  return user;
}
