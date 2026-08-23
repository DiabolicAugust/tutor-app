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
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);
