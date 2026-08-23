import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { fixtures } from '@/shared/fixtures';
import { ownCalendarId } from '@/shared/tutors';

import { byName, type Student } from './student';

export type StudentsStore = {
  /** Everyone on the roster, including colleagues' students. */
  students: readonly Student[];
  /**
   * Only the signed-in tutor's own students — what a lesson can be booked for.
   * The full roster still exists so a colleague's lesson resolves to a name.
   */
  ownStudents: readonly Student[];
  find: (id: string) => Student | undefined;
  /** Resolves a name for display; falls back to the id so nothing renders blank. */
  nameOf: (id: string) => string;
  /** Registers a student met for the first time while booking a lesson. */
  addStudent: (name: string, subject: string) => Student;
};

const StudentsContext = createContext<StudentsStore | null>(null);

let localId = 0;

/**
 * The tutor's students, seeded from the fixtures (empty in production).
 *
 * Mounted above `LessonsProvider`: a lesson refers to a student, and the news
 * feed needs names to render its messages.
 */
export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => [...fixtures.students].sort(byName));

  const addStudent = useCallback((name: string, subject: string) => {
    localId += 1;
    const created: Student = {
      id: `local-student-${localId}`,
      tutorId: ownCalendarId,
      name: name.trim(),
      subject: subject.trim(),
      paidLessonsLeft: 0,
    };
    setStudents((current) => [...current, created].sort(byName));
    return created;
  }, []);

  const value = useMemo<StudentsStore>(() => {
    const byId = new Map(students.map((student) => [student.id, student]));
    return {
      students,
      ownStudents: students.filter((student) => student.tutorId === ownCalendarId),
      find: (id) => byId.get(id),
      nameOf: (id) => byId.get(id)?.name ?? id,
      addStudent,
    };
  }, [students, addStudent]);

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents(): StudentsStore {
  const value = useContext(StudentsContext);
  if (!value) {
    throw new Error('useStudents must be used inside <StudentsProvider>.');
  }
  return value;
}
