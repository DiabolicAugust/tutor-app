import { useCallback, useMemo, useState } from 'react';

import { ApiError, apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { FilesClient } from './files-client';
import { byNewestFile, type FileToUpload, type StoredFile } from './stored-file';

/**
 * Whose files these are.
 *
 * A tagged union rather than a nullable student id, so "the library" is a state
 * a caller can name instead of one it falls into by leaving something out.
 */
export type FileSource =
  | { kind: 'student'; id: string }
  | { kind: 'lesson'; id: string }
  | { kind: 'library' };

/**
 * Why the last write failed, when the server said something specific.
 *
 * A single boolean was not enough: "could not add that file" is the same message
 * for a type the server refuses, a file over the size limit, and a dead
 * connection — and the person holding the phone is the only one who can tell
 * them apart, if the app says which.
 */
export type FileFailure = 'type' | 'tooLarge' | 'offline' | 'unknown';

export type FilesState = {
  files: StoredFile[];
  isLoading: boolean;
  isUploading: boolean;
  /** Set when the last upload or removal failed. */
  hasError: boolean;
  /** Set alongside `hasError` when the reason is known. */
  failure: FileFailure | null;
  upload: (file: FileToUpload) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

/**
 * Files for one source — a student's documents, or the tutor's own shelf.
 *
 * One hook taking a source rather than two hooks: the difference between them is
 * which endpoint the list comes from, and pushing that decision down here keeps
 * every screen and component unaware of it. Removal is already the same call for
 * both, which is the clue that they were one idea.
 *
 * Same shape as `useNotes` and for the same reason: read on one screen at a time,
 * so local state rather than a provider nothing else would use.
 */
/**
 * The cache key for a source.
 *
 * A function rather than a nested conditional, because there are three kinds now
 * and the conditional had already stopped being readable at two.
 */
function keyFor(source: FileSource): string {
  return source.kind === 'library' ? 'library' : `${source.kind}:${source.id}`;
}

/** Reading a source. One place that knows which endpoint each kind comes from. */
function list(client: FilesClient, source: FileSource): Promise<StoredFile[]> {
  switch (source.kind) {
    case 'student':
      return client.listForStudent(source.id);
    case 'lesson':
      return client.listForLesson(source.id);
    case 'library':
      return client.listLibrary();
  }
}

/** Writing to a source. Paired with `list` so the two cannot disagree. */
function store(
  client: FilesClient,
  source: FileSource,
  file: FileToUpload,
): Promise<StoredFile> {
  switch (source.kind) {
    case 'student':
      return client.uploadForStudent(source.id, file);
    case 'lesson':
      return client.uploadForLesson(source.id, file);
    case 'library':
      return client.uploadToLibrary(file);
  }
}

export function useFiles(
  source: FileSource | null,
  client: FilesClient = apiClients.files,
): FilesState {
  const [isUploading, setIsUploading] = useState(false);
  const [failure, setFailure] = useState<FileFailure | null>(null);

  const { data, isLoading, setData } = useAsyncData(
    source ? keyFor(source) : null,
    async () => (await list(client, source!)).sort(byNewestFile),
  );

  // Memoised so the callbacks below do not get a new dependency every render.
  const files = useMemo(() => data ?? [], [data]);

  const upload = useCallback(
    async (file: FileToUpload) => {
      if (!source) return;

      setIsUploading(true);
      setFailure(null);
      try {
        const created = await store(client, source, file);
        setData((current) => [created, ...(current ?? [])]);
      } catch (cause) {
        setFailure(reasonFor(cause));
      } finally {
        setIsUploading(false);
      }
    },
    [client, source, setData],
  );

  const remove = useCallback(
    async (id: string) => {
      setFailure(null);
      // Removed locally first: it is already gone as far as the person who asked
      // is concerned, and putting it back on failure is clearer than a list that
      // does not react to a tap.
      const previous = files;
      setData(previous.filter((file) => file.id !== id));

      try {
        await client.remove(id);
      } catch (cause) {
        setData(previous);
        setFailure(reasonFor(cause));
      }
    },
    [client, files, setData],
  );

  return {
    files,
    isLoading,
    isUploading,
    hasError: failure !== null,
    failure,
    upload,
    remove,
  };
}

/**
 * Turns a rejection into something worth showing.
 *
 * The statuses are the server's own: 415 for a type outside its allow-list, 413
 * for a file over `MAX_UPLOAD_MB`, and 0 for a request that never arrived.
 */
function reasonFor(cause: unknown): FileFailure {
  if (!(cause instanceof ApiError)) return 'unknown';
  if (cause.isNetworkFailure) return 'offline';
  if (cause.status === 415) return 'type';
  if (cause.status === 413) return 'tooLarge';
  return 'unknown';
}
