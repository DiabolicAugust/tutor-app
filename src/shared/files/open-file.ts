import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { apiBaseUrl } from '@/shared/api/api-config';
import { getAccessToken } from '@/shared/api/auth-token';

import type { StoredFile } from './stored-file';

/** Whether this file is something the app can show itself. */
export function isPreviewable(file: StoredFile): boolean {
  return file.mimeType.startsWith('image/');
}

/**
 * Fetches a file to the cache and returns its local URI.
 *
 * Downloaded rather than linked because the endpoint needs the `Authorization`
 * header — a bare URL handed to an image view or a browser arrives without it
 * and comes back 401. The cache directory, not documents: this is a copy of
 * something the server holds, and the OS may reclaim it whenever it likes.
 */
export async function downloadFile(file: StoredFile): Promise<string> {
  const token = getAccessToken();
  const destination = new File(Paths.cache, `${file.id}-${file.originalName}`);

  // A file downloaded earlier is still the same bytes: these rows are immutable
  // once uploaded, so re-fetching would only cost time and data.
  if (destination.exists) return destination.uri;

  const task = File.createDownloadTask(`${apiBaseUrl}/files/${file.id}`, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const downloaded = await task.downloadAsync();
  // Null when the download did not produce a file — a cancelled task or a server
  // that answered with nothing. Better a clear failure than a URI to no bytes.
  if (!downloaded) throw new Error(`Could not download ${file.originalName}`);

  return downloaded.uri;
}

/**
 * Hands the file to the OS, which decides who can take it.
 *
 * One function behind two names below, because on both platforms opening and
 * sending are the same sheet — the OS lists whatever can accept the type, and
 * that list is both "view in" and "send to". Writing our own viewer or our own
 * destination picker would be reimplementing something the device does better,
 * for the sake of two labels.
 */
async function handToSystem(file: StoredFile): Promise<void> {
  const uri = await downloadFile(file);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing files is not supported on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: file.mimeType,
    dialogTitle: file.originalName,
    // iOS picks a viewer by uniform type identifier rather than MIME type.
    UTI: file.mimeType,
  });
}

/**
 * Opens a file in whatever app on the device handles its type.
 *
 * The system sheet rather than a viewer of our own: a tutor's files are
 * contracts, spreadsheets and scans, and the app has no business trying to render
 * a `.docx` when the device already knows which app does.
 */
export const openFileExternally = handToSystem;

/**
 * Sends a file wherever the user chooses — a chat, mail, another app, a folder.
 *
 * Offered as its own action even though it is the same sheet as opening, because
 * they are different intentions: "let me look at this" and "send this to a
 * parent" are the two things tutors do with a worksheet, and a single button
 * labelled for one of them hides the other.
 */
export const shareFile = handToSystem;
