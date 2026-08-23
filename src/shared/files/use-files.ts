import { useCallback, useMemo, useState } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { FilesClient } from './files-client';
import { byNewestFile, type FileToUpload, type StoredFile } from './stored-file';

/**
 * Whose files these are.
 *
 * A tagged union rather than a nullable student id, so "the library" is a state
 * a caller can name instead of one it falls into by leaving something out.
 */
export type FileSource = { kind: 'student'; id: string } | { kind: 'library' };

export type FilesState = {
  files: StoredFile[];
  isLoading: boolean;
  isUploading: boolean;
  /** Set when the last upload or removal failed. */
  hasError: boolean;
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
export function useFiles(
  source: FileSource | null,
  client: FilesClient = apiClients.files,
): FilesState {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { data, isLoading, setData } = useAsyncData(
    source ? (source.kind === 'student' ? `student:${source.id}` : 'library') : null,
    async () =>
      (source!.kind === 'student'
        ? await client.listForStudent(source!.id)
        : await client.listLibrary()
      ).sort(byNewestFile),
  );

  // Memoised so the callbacks below do not get a new dependency every render.
  const files = useMemo(() => data ?? [], [data]);

  const upload = useCallback(
    async (file: FileToUpload) => {
      if (!source) return;

      setIsUploading(true);
      setHasError(false);
      try {
        const created =
          source.kind === 'student'
            ? await client.uploadForStudent(source.id, file)
            : await client.uploadToLibrary(file);
        setData((current) => [created, ...(current ?? [])]);
      } catch {
        setHasError(true);
      } finally {
        setIsUploading(false);
      }
    },
    [client, source, setData],
  );

  const remove = useCallback(
    async (id: string) => {
      setHasError(false);
      // Removed locally first: it is already gone as far as the person who asked
      // is concerned, and putting it back on failure is clearer than a list that
      // does not react to a tap.
      const previous = files;
      setData(previous.filter((file) => file.id !== id));

      try {
        await client.remove(id);
      } catch {
        setData(previous);
        setHasError(true);
      }
    },
    [client, files, setData],
  );

  return { files, isLoading, isUploading, hasError, upload, remove };
}
