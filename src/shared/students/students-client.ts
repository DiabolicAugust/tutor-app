import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

import type { Student } from './student';

export type NewStudentInput = {
  name: string;
  subject: string;
};

export type StudentsClient = {
  /** Everyone the caller may book for; the server does the scoping. */
  list: () => Promise<Student[]>;
  create: (input: NewStudentInput) => Promise<Student>;
};

export const httpStudentsClient: StudentsClient = {
  list: () => http.get<Student[]>('/students'),
  create: (input) => http.post<Student>('/students', input),
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
};
