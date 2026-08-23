import { fixturesEnabled } from '@/shared/fixtures';

import type { AuthUser, Session } from './session';

export type SignInCredentials = {
  email: string;
  password: string;
};

/**
 * The seam between the app and whatever ends up authenticating users.
 *
 * Screens and the session provider only ever talk to this interface, so
 * swapping the mock for a real endpoint is a one-line change at the provider —
 * no screen, hook or component needs to know.
 */
export type AuthClient = {
  signIn: (credentials: SignInCredentials) => Promise<Session>;
  signOut: () => Promise<void>;
};

/** Turns `anna.koval@school.com` into `Anna Koval`. */
function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0]?.trim();
  if (!localPart) return 'Tutor';

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Stand-in until a backend exists: **any** credentials succeed, and the user is
 * fabricated from whatever email was typed (or a placeholder if none was).
 *
 * It is async on purpose even though nothing awaits — the pending/error states
 * in the provider and the sign-in screen are therefore real code paths that a
 * network client will exercise unchanged, instead of being added later.
 */
export const mockAuthClient: AuthClient = {
  async signIn({ email }) {
    const trimmedEmail = email.trim();
    const user: AuthUser = {
      id: `mock-${Date.now()}`,
      email: trimmedEmail || 'tutor@foxacademy.dev',
      name: nameFromEmail(trimmedEmail),
      role: 'tutor',
      schoolId: null,
    };

    return {
      user,
      token: 'mock-token',
      issuedAt: new Date().toISOString(),
    };
  },

  async signOut() {
    // Nothing to revoke without a backend.
  },
};

/**
 * What a production build gets until a real backend exists: sign-in fails
 * loudly instead of fabricating a session. Better an error on the login screen
 * than a shipped app that pretends to authenticate.
 */
export const unavailableAuthClient: AuthClient = {
  async signIn() {
    throw new Error('No authentication backend is configured for this build.');
  },
  async signOut() {},
};

/** The client used unless one is passed to `SessionProvider`. */
export const defaultAuthClient: AuthClient = fixturesEnabled
  ? mockAuthClient
  : unavailableAuthClient;
