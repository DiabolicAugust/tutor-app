import { http } from '@/shared/api/http';

import type { AuthClient } from './auth-client';
import type { Session } from './session';

/**
 * The real thing.
 *
 * Sign-in is anonymous by definition — there is no token yet — and the response
 * is already the app's `Session`, which is why there is no mapping here: the
 * backend's field names were chosen to match.
 */
export const httpAuthClient: AuthClient = {
  signIn: (credentials) => http.post<Session>('/auth/sign-in', credentials, true),

  async signOut() {
    // Access tokens are stateless, so there is nothing to revoke server-side
    // yet. The session store clears the local copy regardless — see
    // `SessionProvider.signOut`. When refresh tokens land, this posts to
    // /auth/sign-out to revoke them.
  },
};
