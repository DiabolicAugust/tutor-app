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

import type { Lesson, LessonStatus } from './lesson';
import type { LessonsClient } from './lessons-client';

/**
 * Draft of a new lesson: everything except the identity the backend assigns.
 */
export type NewLesson = Omit<Lesson, 'id'>;

export type LessonsStore = {
  lessons: readonly Lesson[];
  isLoading: boolean;
  /**
   * Books a lesson. Resolves to `null` when the request failed, having already
   * said so — callers do not await this, so a thrown error would be lost.
   */
  addLesson: (draft: NewLesson) => Promise<Lesson | null>;
  /**
   * Re-reads the window from the server.
   *
   * Exposed for pull-to-refresh: the schedule is the one thing a colleague can
   * change while somebody is looking at it, so "did anything move?" needs an
   * answer that is not "relaunch the app".
   */
  reload: () => Promise<void>;
  /**
   * Confirming or cancelling a lesson after the fact — driven from the news
   * feed, which is why the schedule lives above both tabs.
   */
  setLessonStatus: (id: string, status: LessonStatus) => Promise<void>;
};

const LessonsContext = createContext<LessonsStore | null>(null);

/** How much schedule to load: the calendar never shows more than a month. */
const WINDOW_DAYS = 45;

/**
 * The schedule, loaded through the API layer.
 *
 * Mutations go to the client first and update local state from what comes back,
 * so an id assigned by the server is the id the app uses — no reconciling a
 * temporary one later.
 */
export function LessonsProvider({
  children,
  client = apiClients.lessons,
}: {
  children: ReactNode;
  client?: LessonsClient;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useT();
  const toast = useToast();

  /** The window the calendar keeps loaded, recomputed per fetch. */
  const load = useCallback(async () => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - WINDOW_DAYS);
    const to = new Date(now);
    to.setDate(to.getDate() + WINDOW_DAYS);

    return client.list({ from: from.toISOString(), to: to.toISOString() });
  }, [client]);

  const reload = useCallback(async () => {
    try {
      setLessons(await load());
    } catch {
      toast.show(t('errors.loadSchedule'));
    }
  }, [load, toast, t]);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - WINDOW_DAYS);
    const to = new Date(now);
    to.setDate(to.getDate() + WINDOW_DAYS);

    void (async () => {
      try {
        const loaded = await client.list({
          from: from.toISOString(),
          to: to.toISOString(),
        });
        if (active) setLessons(loaded);
      } catch {
        // Previously uncaught, which left an empty calendar and no way to tell
        // an empty schedule from a failed request.
        if (active) toast.show(t('errors.loadSchedule'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [client, toast, t]);

  const create = useCallback(
    async (draft: NewLesson) => {
      const created = await client.create({
        // Exactly one of the two; the form only ever offers one, and the server
        // rejects neither and both.
        ...(draft.group
          ? { groupId: draft.group.id }
          : { studentId: draft.studentId ?? undefined }),
        // The draft carries the whole subject row so the new block can render
        // before anything is refetched; the wire wants only the id.
        subjectId: draft.subject?.id,
        startsAt: draft.startsAt,
        durationMinutes: draft.durationMinutes,
      });
      setLessons((current) => [...current, created]);
      return created;
    },
    [client],
  );

  const addLesson = useCallback(
    async (draft: NewLesson) => {
      try {
        return await create(draft);
      } catch {
        // The sheet has already closed by now — it does not await this — so
        // without a message a failed booking looked exactly like a successful
        // one until somebody noticed the lesson was missing.
        toast.show(t('errors.bookLesson'));
        return null;
      }
    },
    [create, toast, t],
  );

  const setLessonStatus = useCallback(
    async (id: string, status: LessonStatus) => {
      // Applied locally first: confirming a lesson from the news feed should
      // make the item leave immediately, not after a round trip.
      setLessons((current) =>
        current.map((lesson) => (lesson.id === id ? { ...lesson, status } : lesson)),
      );

      try {
        const updated = await client.setStatus(id, status);
        setLessons((current) =>
          current.map((lesson) => (lesson.id === id ? updated : lesson)),
        );
      } catch {
        // The optimistic change stands rather than flickering back; the next
        // load corrects it. Now that there is somewhere to say so, the user
        // hears that it did not stick.
        toast.show(t('errors.saveLesson'));
      }
    },
    [client, toast, t],
  );

  const value = useMemo<LessonsStore>(
    () => ({ lessons, isLoading, addLesson, setLessonStatus, reload }),
    [lessons, isLoading, addLesson, setLessonStatus, reload],
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
