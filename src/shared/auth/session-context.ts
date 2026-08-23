import { createContext } from 'react';

import type { SignInCredentials } from './auth-client';
import type { AuthUser, Session } from './session';

export type SessionValue = {
  session: Session | null;
  /** Convenience shortcut for `session?.user`. */
  user: AuthUser | null;
  isSignedIn: boolean;
  /** A sign-in attempt is in flight. */
  isPending: boolean;
  /** Last failure, as a translation key, or `null`. */
  errorKey: 'auth.signInFailed' | null;
  /** Resolves to `true` on success. Navigation happens on its own — see below. */
  signIn: (credentials: SignInCredentials) => Promise<boolean>;
  /**
   * Installs a session that came from somewhere other than the sign-in form —
   * accepting an invitation, or registering a school. Same effect as signing in:
   * the guard sees a session and moves the user into the app.
   */
  adoptSession: (session: Session) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);
