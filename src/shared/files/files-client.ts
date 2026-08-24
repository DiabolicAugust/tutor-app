import { http } from '@/shared/api/http';

import type { FileToUpload, StoredFile } from './stored-file';
import { uploadFile } from './upload';

export type FilesClient = {
  listForStudent: (studentId: string) => Promise<StoredFile[]>;
  uploadForStudent: (studentId: string, file: FileToUpload) => Promise<StoredFile>;
  /**
   * The caller's own teaching material — files kept for themselves rather than
   * against a student. Their own shelf, not the school's: an admin sees theirs.
   */
  listLibrary: () => Promise<StoredFile[]>;
  uploadToLibrary: (file: FileToUpload) => Promise<StoredFile>;
  remove: (id: string) => Promise<void>;
};

export const httpFilesClient: FilesClient = {
  listForStudent: (studentId) => http.get<StoredFile[]>(`/students/${studentId}/files`),

  // Uploads go through `uploadFile` rather than `http`: see the note there on why
  // a `FormData` file part cannot be used any more.
  uploadForStudent: (studentId, file) =>
    uploadFile<StoredFile>(`/students/${studentId}/files`, file),

  listLibrary: () => http.get<StoredFile[]>('/files'),

  uploadToLibrary: (file) => uploadFile<StoredFile>('/files', file),

  remove: async (id) => {
    await http.delete<void>(`/files/${id}`);
  },
};
