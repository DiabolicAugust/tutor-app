import { allAddons } from '@/shared/addons';
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
 * Builds a fixture session.
 *
 * Exported because more than one mock hands one back — signing in, accepting an
 * invitation, opening a school — and a session assembled slightly differently in
 * each place is how "works when you sign in, broken when you register" happens.
 */
export function mockSession(options: {
  email: string;
  /** Overrides the name derived from the address. */
  name?: string;
  /** Defaults to admin for an address starting "admin", as sign-in does. */
  role?: AuthUser['role'];
}): Session {
  const email = options.email.trim();
  const role = options.role ?? (email.toLowerCase().startsWith('admin') ? 'admin' : 'tutor');

  const user: AuthUser = {
    // `me` rather than a timestamp: fixture lessons and the school roster
    // reference the signed-in tutor by that id.
    id: 'me',
    email: email || 'tutor@foxacademy.dev',
    name: options.name?.trim() || nameFromEmail(email),
    role,
    schoolId: 'demo-school',
    // An admin holds everything. A tutor starts with the invite capability so
    // a test build shows a member who can invite without being an admin —
    // which is the whole point of addons.
    addons: role === 'admin' ? [...allAddons] : ['INVITE_TUTORS'],
    // Reminders on, so a test build shows the preference in use rather than
    // every account sitting on defaults. Marking on, because a test build should
    // demonstrate the gradebook — the setting that hides it is in Settings.
    config: { lessonReminders: true, lessonReminderMinutes: 60, gradesEnabled: true },
  };

  return { user, token: 'mock-token', issuedAt: new Date().toISOString() };
}

/**
 * Stand-in until a backend exists: **any** credentials succeed, and the user is
 * fabricated from whatever email was typed (or a placeholder if none was).
 *
 * It is async on purpose even though nothing awaits — the pending/error states
 * in the provider and the sign-in screen are therefore real code paths that a
 * network client will exercise unchanged, instead of being added later.
 *
 * Sign in with an address starting "admin" to get the admin role, which is the
 * only way to reach school management in a test build.
 */
export const mockAuthClient: AuthClient = {
  async signIn({ email }) {
    return mockSession({ email });
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
