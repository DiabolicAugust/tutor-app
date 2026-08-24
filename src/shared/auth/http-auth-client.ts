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

  /**
   * Ends the session on the server as well as on this device.
   *
   * Forgetting the token locally was all this used to do, which left it a working
   * key for as long as it had to live — on a phone somebody had just handed on,
   * or lost. The server bumps the account's token version, and every token it has
   * issued stops working, this one included.
   *
   * A failure is swallowed on purpose. The local session is cleared either way,
   * and refusing to sign somebody out because the network is down is the wrong
   * answer to the wrong question: they asked to be signed out of *this* device,
   * and a request that failed can be repeated by signing in and out again.
   */
  async signOut() {
    try {
      await http.post<void>('/auth/sign-out');
    } catch {
      // See above.
    }
  },
};
