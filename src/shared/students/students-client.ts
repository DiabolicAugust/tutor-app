import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

import type { Student } from './student';

export type NewStudentInput = {
  name: string;
  subject: string;
};

/** Only the fields being changed. */
export type StudentPatch = {
  name?: string;
  subject?: string;
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

let localId = 0;

export const mockStudentsClient: StudentsClient = {
  async list() {
    return [...fixtures.students];
  },

  async create(input) {
    localId += 1;
    return {
      id: `local-student-${localId}`,
      tutorId: 'me',
      name: input.name.trim(),
      subject: input.subject.trim(),
      paidLessonsLeft: 0,
    };
  },

  async update(id, patch) {
    const existing = fixtures.students.find((student) => student.id === id);
    // The store applies the result, so echoing the merge is enough for the UI to
    // behave exactly as it will against a server.
    return {
      ...(existing ?? {
        id,
        tutorId: 'me',
        name: '',
        subject: '',
        paidLessonsLeft: 0,
      }),
      ...patch,
    };
  },

  async remove() {},
};
