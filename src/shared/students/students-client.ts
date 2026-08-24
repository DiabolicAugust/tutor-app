import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

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

let localId = 0;

/** The subject row a form named by id. Null for none and for an unknown one. */
function subjectById(id: string | null | undefined) {
  if (!id) return null;
  return fixtures.subjects.find((subject) => subject.id === id) ?? null;
}

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
      subject: subjectById(input.subjectId),
      paidLessonsLeft: 0,
    };
  },

  async update(id, patch) {
    const existing = fixtures.students.find((student) => student.id === id);
    const base = existing ?? {
      id,
      tutorId: 'me',
      name: '',
      subject: null,
      paidLessonsLeft: 0,
    };

    // The store applies the result, so echoing the merge is enough for the UI to
    // behave exactly as it will against a server. `subjectId` is translated back
    // into the row here, the way the server answers with it.
    const { subjectId, ...rest } = patch;
    return {
      ...base,
      ...rest,
      ...(subjectId === undefined ? {} : { subject: subjectById(subjectId) }),
    };
  },

  async remove() {},
};
