import { http } from '@/shared/api/http';

import type { Student } from './student';

export type NewStudentInput = {
  name: string;
  /**
   * An id from the school's subject list.
   *
   * Optional: a student can be taken on before anybody has settled what they
   * are studying, which is how the free-text field behaved too.
   */
  subjectId?: string;
};

/** Only the fields being changed. */
export type StudentPatch = {
  name?: string;
  /** An id moves them; an explicit `null` clears the subject. */
  subjectId?: string | null;
  paidLessonsLeft?: number;
};

export type StudentsClient = {
  /** Everyone the caller may book for; the server does the scoping. */
  list: () => Promise<Student[]>;
  create: (input: NewStudentInput) => Promise<Student>;
  /**
   * Editing and removing need the `MANAGE_STUDENTS` capability, and the server
   * additionally decides *whose* students the caller may touch — a tutor their
   * own, an admin the whole school.
   */
  update: (id: string, patch: StudentPatch) => Promise<Student>;
  remove: (id: string) => Promise<void>;
};

export const httpStudentsClient: StudentsClient = {
  list: () => http.get<Student[]>('/students'),
  create: (input) => http.post<Student>('/students', input),
  update: (id, patch) => http.patch<Student>(`/students/${id}`, patch),
  remove: async (id) => {
    await http.delete<void>(`/students/${id}`);
  },
};
