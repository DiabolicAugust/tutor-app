import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { fixtures } from '@/shared/fixtures';

import type { Lesson, LessonStatus } from './lesson';

/**
 * Draft of a new lesson: everything except the identity the backend assigns.
 */
export type NewLesson = Omit<Lesson, 'id'>;

export type LessonsStore = {
  lessons: readonly Lesson[];
  addLesson: (draft: NewLesson) => Lesson;
  /**
   * Confirming or cancelling a lesson after the fact — driven from the news
   * feed, which is why the schedule lives above both tabs.
   */
  setLessonStatus: (id: string, status: LessonStatus) => void;
};

const LessonsContext = createContext<LessonsStore | null>(null);

let localId = 0;

/**
 * Holds the schedule in memory, seeded from the fixtures (empty in production).
 *
 * The shape is deliberately the one a data layer will expose — a list plus
 * mutations — so replacing this with TypeORM/Prisma/Drizzle behind a query
 * client is a change of implementation, not of call sites. Nothing is persisted
 * yet: an added lesson lives until the app reloads, which is the honest
 * behaviour while there is no server to accept it.
 */
export function LessonsProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<Lesson[]>(() => [...fixtures.lessons]);

  const addLesson = useCallback((draft: NewLesson) => {
    localId += 1;
    const created: Lesson = { ...draft, id: `local-${localId}` };
    setLessons((current) => [...current, created]);
    return created;
  }, []);

  const setLessonStatus = useCallback((id: string, status: LessonStatus) => {
    setLessons((current) =>
      current.map((lesson) => (lesson.id === id ? { ...lesson, status } : lesson)),
    );
  }, []);

  const value = useMemo<LessonsStore>(
    () => ({ lessons, addLesson, setLessonStatus }),
    [lessons, addLesson, setLessonStatus],
  );

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>;
}

export function useLessons(): LessonsStore {
  const value = useContext(LessonsContext);
  if (!value) {
    throw new Error('useLessons must be used inside <LessonsProvider>.');
  }
  return value;
}
