import { Directory, File, Paths, UploadType } from 'expo-file-system';

import { ApiError } from '@/shared/api/api-error';
import { apiBaseUrl } from '@/shared/api/api-config';
import { getAccessToken } from '@/shared/api/auth-token';

import type { FileToUpload } from './stored-file';

/**
 * How long an upload may run.
 *
 * Much longer than an ordinary request, because this is the one call where a long
 * wait is legitimate: the bytes have to get there. The general timeout is sized
 * for a sleeping server waking up, and applying it here turned an upload that was
 * working — slowly, on a phone network — into "check your connection".
 */
const UPLOAD_TIMEOUT_MS = 180_000;

/**
 * Sends one file, as multipart, natively.
 *
 * **Not** `fetch` with a `FormData` part. React Native used to accept
 * `{ uri, name, type }` as a file part, and no longer does: the request is
 * rejected before it leaves the device with "Unsupported FormDataPart
 * implementation", which surfaced as a network failure and read as "could not
 * reach the server". Nothing was wrong with the server, the file or the
 * connection, and no log said otherwise — the picker's URI was intact and the
 * request never went out.
 *
 * `File.upload` streams from disk through the platform's own HTTP stack, so the
 * bytes never pass through JS. That also makes a large file cheap rather than
 * something held in memory twice.
 *
 * Returns the parsed body and throws `ApiError` for anything else, so callers see
 * exactly the shape every other request in the app produces.
 */
export async function uploadFile<T>(path: string, file: FileToUpload): Promise<T> {
  const token = getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  // The name the server stores comes from the file on disk, and a picked file
  // lives in the cache under a generated one — so a worksheet arrived in the
  // library called `99a6635a-4c3f….txt`. Staged under its real name first, in a
  // directory of its own so two uploads of the same name cannot collide.
  const staged = await stage(file);

  let result: { status: number; body: string };
  try {
    result = await staged.upload(`${apiBaseUrl}${path}`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      // The field the server reads. Its default is the same, stated because the
      // server's `FileInterceptor('file')` is what decides it.
      fieldName: 'file',
      mimeType: file.mimeType,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
  } catch (cause) {
    // Rejects only when the file cannot be read, the request failed, or it was
    // cancelled — all of which are "it never arrived", which is what status 0
    // means everywhere else in the app.
    throw new ApiError(0, cause instanceof Error ? cause.message : 'Upload failed');
  } finally {
    clearTimeout(timeout);
    discard(staged);
  }

  const parsed = result.body ? safeJson(result.body) : null;

  // A non-2xx comes back as a result rather than a rejection, which is the reason
  // this can tell "the server refused the type" from "the request never left".
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(result.status, messageFrom(result.status, parsed), parsed);
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

function messageFrom(status: number, body: unknown): string {
  if (typeof body === 'string' && body) return body;
  if (body && typeof body === 'object') {
    const candidate = (body as { message?: unknown }).message;
    if (typeof candidate === 'string') return candidate;
    if (Array.isArray(candidate)) return candidate.join('; ');
  }
  return `Upload failed with status ${status}`;
}

/**
 * Copies the picked file to a private directory under the name it was chosen
 * with, and returns that copy.
 *
 * A copy rather than a rename: the URI the picker handed back may point at a file
 * other code still expects to find, and renaming somebody else's file to suit an
 * upload is the kind of thing that breaks a retry.
 */
async function stage(file: FileToUpload): Promise<File> {
  const folder = new Directory(Paths.cache, 'uploads', String(Date.now()));
  folder.create({ intermediates: true, idempotent: true });

  const target = new File(folder, safeName(file.name));
  await new File(file.uri).copy(target);
  return target;
}

/** Best effort: a leftover copy in the cache is the OS's to reclaim. */
function discard(staged: File): void {
  try {
    staged.parentDirectory.delete();
  } catch {
    // Nothing to do about it, and nothing worth telling the user.
  }
}

/**
 * A filename with nothing in it that could mean a path.
 *
 * The name comes from whatever the user picked, and a separator in it would put
 * the staged copy somewhere other than the directory just made for it.
 */
function safeName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'upload';
}
