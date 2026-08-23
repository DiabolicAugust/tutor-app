/**
 * The current access token, held outside React.
 *
 * This exists to break a cycle: every request needs the token, the token lives
 * in the session, and the session is obtained through a request. A module-level
 * holder that `SessionProvider` writes to and the HTTP client reads from keeps
 * both sides ignorant of each other.
 *
 * Deliberately not persisted here — the session store owns persistence, and two
 * places writing the same secret is one too many.
 */
let accessToken: string | null = null;

/** Called by `SessionProvider` whenever the session appears or disappears. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Registers what to do when the server rejects the token. `SessionProvider`
 * signs the user out, which is the only sensible response to a token the server
 * will not accept.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}
