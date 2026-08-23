/**
 * Session shape. Deliberately independent of any backend: TypeORM/Prisma/Drizzle
 * will each produce their own row shape, and mapping that to `AuthUser` is the
 * auth client's job, not the screens'.
 */

/**
 * Who the signed-in person is inside a tenant. Drives navigation and
 * permissions later: a tutor sees their own lessons, a school admin sees every
 * tutor's.
 */
export type UserRole = 'tutor' | 'school-admin' | 'student';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** The tenant this user belongs to; `null` for an independent tutor. */
  schoolId: string | null;
};

export type Session = {
  user: AuthUser;
  /** Opaque to the app — only the auth client and the API layer read it. */
  token: string;
  /** ISO timestamp, so a persisted session can be aged out later. */
  issuedAt: string;
};

const roles: readonly UserRole[] = ['tutor', 'school-admin', 'student'];

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
    (user.schoolId === null || typeof user.schoolId === 'string')
  );
}
