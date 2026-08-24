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
import { useToast } from '@/shared/ui';

import type { SubjectsClient } from './subjects-client';

import { bySubjectName, isOffered, type Subject, type SubjectUsage } from './subject';

export type SubjectsStore = {
  /**
   * Everything the school has ever taught, retired subjects included.
   *
   * Only the management screen wants this. Everywhere else wants `offered`.
   */
  all: readonly Subject[];
  /** Still taught — the only ones a form may propose. */
  offered: readonly Subject[];
  find: (id: string) => Subject | undefined;
  /**
   * A subject's name, for a screen that holds only an id.
   *
   * Falls back to the id rather than to an empty string: a blank where a subject
   * should be reads as "no subject", which is a different and wrong statement.
   */
  nameOf: (id: string) => string;
  reload: () => Promise<void>;
  addSubject: (name: string) => Promise<Subject>;
  renameSubject: (id: string, name: string) => Promise<Subject>;
  usageOf: (id: string) => Promise<SubjectUsage>;
  /** Rejects while anything current still points at it — see `inUseFrom`. */
  hideSubject: (id: string) => Promise<void>;
  restoreSubject: (id: string) => Promise<void>;
  isLoading: boolean;
};

const SubjectsContext = createContext<SubjectsStore | null>(null);

/**
 * The school's subject list.
 *
 * Mounted above the students and lessons providers: what the school teaches is a
 * property of the school, and every form that takes on a student or books a
 * lesson needs the list before it can offer anything.
 */
export function SubjectsProvider({
  children,
  client = apiClients.subjects,
}: {
  children: ReactNode;
  client?: SubjectsClient;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useT();
  const toast = useToast();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const loaded = await client.list();
        if (active) setSubjects([...loaded].sort(bySubjectName));
      } catch {
        // Reported rather than swallowed: an empty list and a failed request look
        // identical in a picker, and the second one silently insists the school
        // teaches nothing.
        if (active) toast.show(t('errors.loadSubjects'));
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
      setSubjects([...(await client.list())].sort(bySubjectName));
    } catch {
      toast.show(t('errors.loadSubjects'));
    }
  }, [client, toast, t]);

  /** Replaces one row in place, keeping the list sorted. */
  const put = useCallback((subject: Subject) => {
    setSubjects((current) =>
      [
        ...current.filter((candidate) => candidate.id !== subject.id),
        subject,
      ].sort(bySubjectName),
    );
  }, []);

  const addSubject = useCallback(
    async (name: string) => {
      const created = await client.create(name);
      put(created);
      return created;
    },
    [client, put],
  );

  const renameSubject = useCallback(
    async (id: string, name: string) => {
      const renamed = await client.rename(id, name);
      put(renamed);
      return renamed;
    },
    [client, put],
  );

  const usageOf = useCallback((id: string) => client.usage(id), [client]);

  const hideSubject = useCallback(
    async (id: string) => {
      put(await client.hide(id));
      // Everything that named it keeps naming it, and the app is holding those
      // rows: a student's own copy of the subject still says "Latin" and should,
      // so nothing else is reloaded here.
    },
    [client, put],
  );

  const restoreSubject = useCallback(
    async (id: string) => {
      put(await client.restore(id));
    },
    [client, put],
  );

  const value = useMemo<SubjectsStore>(() => {
    const byId = new Map(subjects.map((subject) => [subject.id, subject]));
    return {
      all: subjects,
      offered: subjects.filter(isOffered),
      find: (id) => byId.get(id),
      nameOf: (id) => byId.get(id)?.name ?? id,
      reload,
      addSubject,
      renameSubject,
      usageOf,
      hideSubject,
      restoreSubject,
      isLoading,
    };
  }, [
    subjects,
    reload,
    addSubject,
    renameSubject,
    usageOf,
    hideSubject,
    restoreSubject,
    isLoading,
  ]);

  return <SubjectsContext.Provider value={value}>{children}</SubjectsContext.Provider>;
}

export function useSubjects(): SubjectsStore {
  const value = useContext(SubjectsContext);
  if (!value) {
    throw new Error('useSubjects must be used inside <SubjectsProvider>.');
  }
  return value;
}
