/**
 * A failed request, in the one shape the app handles.
 *
 * Carries the status so callers can distinguish "your input was wrong" from
 * "the server is down" without parsing strings, and keeps the server's message
 * for logs — never for display, since it is not translated.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Server-provided message, for logs and debugging. */
    message: string,
    /** Absent when the request never reached the server. */
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 401: the session is gone or the token expired. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** 0 means the request never completed — offline, DNS, timeout. */
  get isNetworkFailure(): boolean {
    return this.status === 0;
  }

  /** 4xx other than 401: the request itself was wrong, retrying will not help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
