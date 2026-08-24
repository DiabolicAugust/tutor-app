/**
 * Where the API lives.
 *
 * `EXPO_PUBLIC_API_URL` is inlined at bundle time, so this folds to a constant
 * and the address is decided when the build is made rather than at runtime.
 */
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/**
 * True when the app has a backend to talk to.
 *
 * There used to be a third possibility here — no backend, run on invented
 * students and lessons — and it was the right answer while the API did not exist.
 * It stopped being the right answer the moment it did: a build that quietly works
 * on made-up data is a build nobody can trust a bug report from.
 */
export const hasApi = apiBaseUrl.length > 0;

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
