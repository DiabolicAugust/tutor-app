import { apiBaseUrl, requestTimeoutMs } from './api-config';
import { ApiError } from './api-error';
import { getAccessToken, notifyUnauthorized } from './auth-token';

type Query = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /**
   * Serialised as JSON, unless it is `FormData` — then it is passed straight to
   * `fetch`, which is the only way a multipart boundary gets set correctly.
   * Omit for GET and DELETE.
   */
  body?: unknown;
  query?: Query;
  /** Public endpoints — sign-in, invitation links — skip the auth header. */
  anonymous?: boolean;
};

function buildUrl(path: string, query?: Query): string {
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }

  const serialised = params.toString();
  return serialised ? `${url}?${serialised}` : url;
}

/** Pulls a usable message out of whatever the server sent. */
function messageFrom(status: number, body: unknown): string {
  if (typeof body === 'string' && body) return body;
  if (body && typeof body === 'object') {
    const candidate = (body as { message?: unknown }).message;
    if (typeof candidate === 'string') return candidate;
    // Nest's validation pipe returns message as an array of strings.
    if (Array.isArray(candidate)) return candidate.join('; ');
  }
  return `Request failed with status ${status}`;
}

/**
 * Every request the app makes goes through here.
 *
 * One place owns the base URL, the auth header, JSON encoding, the timeout, and
 * turning failures into `ApiError`. Feature clients describe *what* they call;
 * none of them repeat *how*.
 *
 * A 401 signs the user out via the registered handler before throwing, so an
 * expired token cannot leave the app sitting on screens it can no longer load.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, anonymous = false } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = { Accept: 'application/json' };
  // Deliberately not set for multipart: `fetch` generates a boundary and writes
  // the header itself, and setting it by hand produces a body the server cannot
  // parse — with no error until it tries.
  if (body !== undefined && !isMultipart) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isMultipart ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    // Offline, DNS failure, timeout: status 0 means it never reached the server.
    throw new ApiError(0, cause instanceof Error ? cause.message : 'Network request failed');
  } finally {
    clearTimeout(timeout);
  }

  // 204 and friends have no body to parse.
  const raw = response.status === 204 ? null : await response.text();
  const parsed = raw ? safeJson(raw) : null;

  if (!response.ok) {
    if (response.status === 401 && !anonymous) notifyUnauthorized();
    throw new ApiError(response.status, messageFrom(response.status, parsed), parsed);
  }

  return parsed as T;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // A proxy or gateway returning HTML is a real failure mode; keep the text.
    return raw;
  }
}

export const http = {
  get: <T>(path: string, query?: Query, anonymous = false) =>
    request<T>(path, { method: 'GET', query, anonymous }),
  post: <T>(path: string, body?: unknown, anonymous = false) =>
    request<T>(path, { method: 'POST', body, anonymous }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  /**
   * Full replacement, for the resources where a partial update is meaningless —
   * a grade whose kind changed carries different fields, and merging half a new
   * kind onto half an old one produces rows whose kind and contents disagree.
   */
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  /**
   * A body is optional and unusual, but legal: unregistering a device is
   * identified by a push token, which is too long and too full of punctuation to
   * put in a path.
   */
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
  /** Multipart upload. The caller builds the form; this adds auth and the rest. */
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
};
