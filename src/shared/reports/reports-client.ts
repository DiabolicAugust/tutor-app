import { http } from '@/shared/api/http';

import type { Report } from './report';

/**
 * Reading a report.
 *
 * One call and one shape: every number on the screen is computed on the server
 * from the same rows the calendar and the gradebook read, so nothing here can
 * disagree with what a student's own progress page says.
 */
export type ReportsClient = {
  /**
   * `tutorId` narrows a school report to one person — admins only, and the
   * server refuses it from anybody else rather than quietly answering a
   * different question.
   */
  summary: (query: {
    from: string;
    to: string;
    tutorId?: string;
  }) => Promise<Report>;
};

export const httpReportsClient: ReportsClient = {
  summary: ({ from, to, tutorId }) =>
    http.get<Report>('/reports/summary', { from, to, tutorId }),
};
