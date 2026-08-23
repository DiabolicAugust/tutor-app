import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

import type { FileToUpload, StudentFile } from './student-file';

export type FilesClient = {
  listForStudent: (studentId: string) => Promise<StudentFile[]>;
  uploadForStudent: (studentId: string, file: FileToUpload) => Promise<StudentFile>;
  remove: (id: string) => Promise<void>;
};

export const httpFilesClient: FilesClient = {
  listForStudent: (studentId) => http.get<StudentFile[]>(`/students/${studentId}/files`),

  uploadForStudent: (studentId, file) => {
    const form = new FormData();

    // React Native's FormData accepts this shape for a local file URI; it is not
    // a browser `File`, which is why the cast is needed rather than avoidable.
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);

    return http.upload<StudentFile>(`/students/${studentId}/files`, form);
  },

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
const uploaded = new Map<string, StudentFile[]>();
let localId = 0;

export const mockFilesClient: FilesClient = {
  async listForStudent(studentId) {
    const seeded = fixtures.studentFiles.filter((file) => file.studentId === studentId);
    return [...(uploaded.get(studentId) ?? []), ...seeded.map(({ studentId: _, ...file }) => file)];
  },

  async uploadForStudent(studentId, file) {
    localId += 1;
    const created: StudentFile = {
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

    uploaded.set(studentId, [created, ...(uploaded.get(studentId) ?? [])]);
    return created;
  },

  async remove(id) {
    for (const [studentId, files] of uploaded) {
      uploaded.set(
        studentId,
        files.filter((file) => file.id !== id),
      );
    }
  },
};
