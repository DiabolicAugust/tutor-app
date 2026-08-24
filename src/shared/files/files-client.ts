import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

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

/**
 * Stand-in until the API exists.
 *
 * Uploads are recorded in memory rather than pretended: picking a file adds a
 * row with its real name, type and size, so the list, the sizes and removal all
 * behave as they will against a server. The bytes go nowhere, which is the only
 * honest option with nothing to store them.
 */
const uploaded = new Map<string, StoredFile[]>();
/** The tutor's own shelf, seeded so a test build has something to share. */
let library: StoredFile[] = [...fixtures.libraryFiles];
let localId = 0;

/** A picked file as a row, without pretending to know a size nothing stored. */
function record(file: FileToUpload): StoredFile {
  localId += 1;
  return {
    id: `local-file-${localId}`,
    originalName: file.name,
    mimeType: file.mimeType,
    // Unknown without reading the file, and reading it to report a number the
    // mock will not store would be work for a lie.
    sizeBytes: 0,
    uploadedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    uploadedById: 'me',
  };
}

export const mockFilesClient: FilesClient = {
  async listForStudent(studentId) {
    const seeded = fixtures.studentFiles.filter((file) => file.studentId === studentId);
    return [...(uploaded.get(studentId) ?? []), ...seeded.map(({ studentId: _, ...file }) => file)];
  },

  async uploadForStudent(studentId, file) {
    const created = record(file);
    uploaded.set(studentId, [created, ...(uploaded.get(studentId) ?? [])]);
    return created;
  },

  async listLibrary() {
    return [...library];
  },

  async uploadToLibrary(file) {
    const created = record(file);
    library = [created, ...library];
    return created;
  },

  async remove(id) {
    for (const [studentId, files] of uploaded) {
      uploaded.set(
        studentId,
        files.filter((file) => file.id !== id),
      );
    }
    library = library.filter((file) => file.id !== id);
  },
};
