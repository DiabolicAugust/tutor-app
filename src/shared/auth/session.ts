import { isAddonKey, type AddonKey } from '@/shared/addons';

/**
 * Session shape. Deliberately independent of any backend: TypeORM/Prisma/Drizzle
 * will each produce their own row shape, and mapping that to `AuthUser` is the
 * auth client's job, not the screens'.
 */

/**
 * Who the signed-in person is inside a tenant. Drives navigation and
 * permissions: a tutor sees their own lessons, an admin sees every tutor's.
 *
 * Two roles, matching the backend's `UserRole` enum lowercased. Students are
 * records a tutor owns, not accounts that sign in, so they are not a role.
 */
export type UserRole = 'tutor' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** The tenant this user belongs to; `null` for an independent tutor. */
  schoolId: string | null;
  /**
   * Capabilities granted to this account, delivered with the user's first
   * payload — see `shared/addons`.
   *
   * In the session rather than fetched per screen: the app needs them to decide
   * what to render on its first frame, and a permission that arrives late means
   * UI appearing after the fact.
   */
  addons: AddonKey[];
};

export type Session = {
  user: AuthUser;
  /** Opaque to the app — only the auth client and the API layer read it. */
  token: string;
  /** ISO timestamp, so a persisted session can be aged out later. */
  issuedAt: string;
};

const roles: readonly UserRole[] = ['tutor', 'admin'];

/**
 * Validates a session restored from storage. Required by
 * `createPersistedValue`: a session written by an older build must be rejected
 * rather than handed to the app half-formed.
 */
export function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Session>;
  const user = candidate.user;

  return (
    typeof candidate.token === 'string' &&
    typeof candidate.issuedAt === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    roles.includes(user.role as UserRole) &&
    (user.schoolId === null || typeof user.schoolId === 'string') &&
    // Tolerated when absent: a session persisted by a build that predates addons
    // must still load rather than logging the user out on upgrade.
    (user.addons === undefined || (Array.isArray(user.addons) && user.addons.every(isAddonKey)))
  );
}
