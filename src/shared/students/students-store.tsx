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
import { useT } from '@/shared/i18n';
import { useOwnCalendarId } from '@/shared/tutors';
import { useToast } from '@/shared/ui';

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
  /**
   * Re-reads the roster.
   *
   * Called by pull-to-refresh, and by the booking form when it opens: a student
   * added on another device — or by an admin — is otherwise invisible until the
   * app is relaunched, and the form then insists there is nobody to book for.
   */
  reload: () => Promise<void>;
  /**
   * Registers a student met for the first time while booking a lesson.
   *
   * The subject is an id from the school's list, and null is allowed: somebody
   * can be taken on before anybody has settled what they will study.
   */
  addStudent: (name: string, subjectId: string | null) => Promise<Student>;
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
  const { t } = useT();
  const toast = useToast();
  const ownId = useOwnCalendarId();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const loaded = await client.list();
        if (active) setStudents([...loaded].sort(byName));
      } catch {
        // Previously uncaught, so a failed roster looked identical to a school
        // with no students — and every lesson then rendered a raw id for a name.
        if (active) toast.show(t('errors.loadStudents'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [client, toast, t]);

  const reload = useCallback(async () => {
    try {
      setStudents([...(await client.list())].sort(byName));
    } catch {
      toast.show(t('errors.loadStudents'));
    }
  }, [client, toast, t]);

  const addStudent = useCallback(
    async (name: string, subjectId: string | null) => {
      const created = await client.create({ name, subjectId: subjectId ?? undefined });
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
      // The signed-in tutor's real id. A fixture constant here meant a real
      // school always looked like it had no students of its own.
      ownStudents: students.filter((student) => student.tutorId === ownId),
      find: (id) => byId.get(id),
      nameOf: (id) => byId.get(id)?.name ?? id,
      reload,
      addStudent,
      updateStudent,
      removeStudent,
      isLoading,
    };
  }, [students, ownId, reload, addStudent, updateStudent, removeStudent, isLoading]);

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents(): StudentsStore {
  const value = useContext(StudentsContext);
  if (!value) {
    throw new Error('useStudents must be used inside <StudentsProvider>.');
  }
  return value;
}
