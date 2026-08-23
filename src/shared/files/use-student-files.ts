import { useCallback, useMemo, useState } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { FilesClient } from './files-client';
import { byNewestFile, type FileToUpload, type StudentFile } from './student-file';

export type StudentFilesState = {
  files: StudentFile[];
  isLoading: boolean;
  isUploading: boolean;
  /** Set when the last upload or removal failed. */
  hasError: boolean;
  upload: (file: FileToUpload) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

/**
 * Documents for one student.
 *
 * Same shape as `useNotes` and for the same reason: read on one screen at a
 * time, so local state rather than a provider nothing else would use.
 */
export function useStudentFiles(
  studentId: string | null,
  client: FilesClient = apiClients.files,
): StudentFilesState {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { data, isLoading, setData } = useAsyncData(studentId, async (id) =>
    (await client.listForStudent(id)).sort(byNewestFile),
  );

  // Memoised so the callbacks below do not get a new dependency every render.
  const files = useMemo(() => data ?? [], [data]);

  const upload = useCallback(
    async (file: FileToUpload) => {
      if (!studentId) return;

      setIsUploading(true);
      setHasError(false);
      try {
        const created = await client.uploadForStudent(studentId, file);
        setData((current) => [created, ...(current ?? [])]);
      } catch {
        setHasError(true);
      } finally {
        setIsUploading(false);
      }
    },
    [client, studentId, setData],
  );

  const remove = useCallback(
    async (id: string) => {
      setHasError(false);
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
