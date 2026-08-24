import { fixturesEnabled } from '@/shared/fixtures';

/**
 * Where the API lives, and whether to talk to it at all.
 *
 * `EXPO_PUBLIC_API_URL` is inlined at bundle time, so these fold to constants
 * and the choice of client is made once, at startup. A test build with no API
 * runs on fixtures; the same code talks to a real server the moment the variable
 * is set. (Both client sets stay in the bundle — the minifier does not eliminate
 * the unused branch. Verified, not assumed.)
 */
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** True when the app has a backend to talk to. */
export const hasApi = apiBaseUrl.length > 0;

/**
 * Fixtures are used only when there is no API. Configuring an API always wins —
 * otherwise a development build would quietly ignore the server it was pointed
 * at, which is the kind of thing that costs an afternoon.
 */
export const useMockClients = !hasApi && fixturesEnabled;

/**
 * Request timeout.
 *
 * Sized for a **cold start**, not for a fast request. A free-tier host spins the
 * service down when idle, and waking it means booting a container and connecting
 * a database pool — measured at over two minutes on a first hit, and commonly
 * thirty to sixty seconds afterwards. At fifteen seconds every first launch of
 * the day failed, which reads as a broken app rather than a sleeping server.
 *
 * Raising it costs less than it appears to: with no network at all, `fetch`
 * fails on DNS or connect within a second or two and never reaches this. The
 * timeout only bites when the server *is* reachable and slow, which is exactly
 * the case worth waiting for.
 */
export const requestTimeoutMs = 60_000;
