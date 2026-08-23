import type { StudentFile } from '@/shared/files/student-file';

/** A fixture file also records whose it is; the client strips that on the way out. */
export type FixtureStudentFile = StudentFile & { studentId: string };

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * Test documents.
 *
 * Sizes and types are varied on purpose: they are what the list formats, and a
 * set of identically-sized PDFs would hide a formatting mistake. One was uploaded
 * by a colleague, which is the only way to see that its remove button is
 * correctly absent.
 */
export const fixtureStudentFiles: FixtureStudentFile[] = [
  {
    id: 'file-1',
    studentId: 'student-petro',
    originalName: 'Term agreement.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 184_320,
    uploadedAt: daysAgo(40),
    createdAt: daysAgo(40),
    uploadedById: 'me',
  },
  {
    id: 'file-2',
    studentId: 'student-petro',
    originalName: 'Practice set 4.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 24_576,
    uploadedAt: daysAgo(6),
    createdAt: daysAgo(6),
    uploadedById: 'me',
  },
  {
    id: 'file-3',
    studentId: 'student-petro',
    originalName: 'Progress report (July).pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1_468_006,
    uploadedAt: daysAgo(20),
    createdAt: daysAgo(20),
    uploadedById: 'tutor-2',
  },
  {
    id: 'file-4',
    studentId: 'student-anna',
    originalName: 'Homework photo.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 892,
    uploadedAt: daysAgo(1),
    createdAt: daysAgo(1),
    uploadedById: 'me',
  },
];
