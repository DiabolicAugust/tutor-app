import type { StoredFile } from '@/shared/files/stored-file';

/**
 * A tutor's own shelf in a test build.
 *
 * Deliberately covers the three things the screen renders differently: a PDF that
 * goes to the OS, an image the app previews itself, and a spreadsheet — so the
 * type icons, the sizes and the share action all have something to act on.
 */

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const fixtureLibraryFiles: StoredFile[] = [
  {
    id: 'library-1',
    originalName: 'Quadratics worksheet.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 184_320,
    uploadedAt: daysAgo(3),
    createdAt: daysAgo(3),
    uploadedById: 'me',
  },
  {
    id: 'library-2',
    originalName: 'Formula sheet.png',
    mimeType: 'image/png',
    sizeBytes: 612_000,
    uploadedAt: daysAgo(11),
    createdAt: daysAgo(11),
    uploadedById: 'me',
  },
  {
    id: 'library-3',
    originalName: 'Term plan.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 27_800,
    uploadedAt: daysAgo(26),
    createdAt: daysAgo(26),
    uploadedById: 'me',
  },
];
