import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiClients } from '@/shared/api';
import { ownCalendarId } from '@/shared/tutors';

import type { StudentPatch, StudentsClient } from './students-client';

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
  addStudent: (name: string, subject: string) => Promise<Student>;
  /**
   * Edits a student. Whether the caller may edit *this* student is the server's
   * decision — a tutor their own, an admin the whole school — so a rejection
   * surfaces as a thrown error rather than being pre-judged here.
   */
  updateStudent: (id: string, patch: StudentPatch) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  isLoading: boolean;
};

const StudentsContext = createContext<StudentsStore | null>(null);

/**
 * The tutor's students, loaded through the API layer — fixtures or HTTP,
 * depending on how the build is configured.
 *
 * Mounted above `LessonsProvider`: a lesson refers to a student, and the news
 * feed needs names to render its messages.
 */
export function StudentsProvider({
  children,
  client = apiClients.students,
}: {
  children: ReactNode;
  client?: StudentsClient;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const loaded = await client.list();
        if (active) setStudents([...loaded].sort(byName));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [client]);

  const addStudent = useCallback(
    async (name: string, subject: string) => {
      const created = await client.create({ name, subject });
      setStudents((current) => [...current, created].sort(byName));
      return created;
    },
    [client],
  );

  const updateStudent = useCallback(
    async (id: string, patch: StudentPatch) => {
      const updated = await client.update(id, patch);
      setStudents((current) =>
        current.map((student) => (student.id === id ? updated : student)).sort(byName),
      );
    },
    [client],
  );

  const removeStudent = useCallback(
    async (id: string) => {
      await client.remove(id);
      setStudents((current) => current.filter((student) => student.id !== id));
    },
    [client],
  );

  const value = useMemo<StudentsStore>(() => {
    const byId = new Map(students.map((student) => [student.id, student]));
    return {
      students,
      ownStudents: students.filter((student) => student.tutorId === ownCalendarId),
      find: (id) => byId.get(id),
      nameOf: (id) => byId.get(id)?.name ?? id,
      addStudent,
      updateStudent,
      removeStudent,
      isLoading,
    };
  }, [students, addStudent, updateStudent, removeStudent, isLoading]);

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents(): StudentsStore {
  const value = useContext(StudentsContext);
  if (!value) {
    throw new Error('useStudents must be used inside <StudentsProvider>.');
  }
  return value;
}
