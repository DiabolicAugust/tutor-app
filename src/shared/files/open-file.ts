import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { apiBaseUrl } from '@/shared/api/api-config';
import { getAccessToken } from '@/shared/api/auth-token';

import type { StudentFile } from './student-file';

/** Whether this file is something the app can show itself. */
export function isPreviewable(file: StudentFile): boolean {
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
export async function downloadFile(file: StudentFile): Promise<string> {
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
 * Hands a file to whatever on the device can open it.
 *
 * The share sheet rather than a viewer of our own: a tutor's files are contracts,
 * spreadsheets and scans, and the app has no business trying to render a `.docx`.
 * The OS already knows which app does.
 */
export async function openFileExternally(file: StudentFile): Promise<void> {
  const uri = await downloadFile(file);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Opening files is not supported on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: file.mimeType,
    dialogTitle: file.originalName,
    // iOS picks a viewer by uniform type identifier rather than MIME type.
    UTI: file.mimeType,
  });
}
