/**
 * An uploaded file, whatever it is kept against.
 *
 * One shape for a student's document and for a tutor's own teaching material,
 * because they differ only in *whose* they are — and that question is answered by
 * the endpoint the row came from, not by a field on it. Two near-identical types
 * would mean two clients, two hooks and two components for one idea.
 *
 * Field names match the API's `files` rows. `storageKey` is deliberately absent:
 * it is how the server finds the bytes and means nothing to the app, so exposing
 * it would only invite something to depend on it.
 */
export type StoredFile = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** ISO 8601, or null while an upload has not been confirmed. */
  uploadedAt: string | null;
  createdAt: string;
  uploadedById: string;
};

/** What the picker hands over, reduced to what an upload needs. */
export type FileToUpload = {
  uri: string;
  name: string;
  mimeType: string;
};

const UNITS = ['B', 'KB', 'MB'] as const;

/**
 * A size somebody can read at a glance.
 *
 * Rounded to whole units above a kilobyte: nobody deciding whether to open a
 * file cares about the third digit, and "1.4 MB" reads faster than "1,468,006".
 */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

/** Newest first, matching how the list is read. */
export function byNewestFile(a: StoredFile, b: StoredFile): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
