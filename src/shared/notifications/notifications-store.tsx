import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { fixtures } from '@/shared/fixtures';
import { useLessons } from '@/shared/lessons';
import { useStudents } from '@/shared/students';
import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { deriveNotifications } from './derive';
import { byNewest, type Notification } from './notification';
import type { NotificationAction } from './registry';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const readIdsStore = createPersistedValue<string[]>(StorageKeys.notificationsRead, isStringArray);

export type NotificationsStore = {
  notifications: readonly Notification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Runs an action from a notification's descriptor. */
  runAction: (notification: Notification, action: NotificationAction) => void;
};

const NotificationsContext = createContext<NotificationsStore | null>(null);

/**
 * The news feed.
 *
 * Two sources, one list: notifications a server would push (fixtures for now) and
 * notifications derived from the schedule. Read state is persisted separately
 * from the items themselves, which is what lets derived notifications come and
 * go without losing what the user has already seen.
 *
 * Depends on `LessonsProvider` and `StudentsProvider`, so it must be mounted
 * inside both.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { lessons, setLessonStatus } = useLessons();
  const { nameOf } = useStudents();
  const [readIds, setReadIds] = useState<string[]>(() => readIdsStore.read() ?? []);

  const notifications = useMemo(
    () =>
      [...fixtures.notifications, ...deriveNotifications(lessons, new Date(), nameOf)].sort(
        byNewest,
      ),
    [lessons, nameOf],
  );

  const persistRead = useCallback((next: string[]) => {
    setReadIds(next);
    readIdsStore.write(next);
  }, []);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];
        readIdsStore.write(next);
        return next;
      });
    },
    [],
  );

  const markAllRead = useCallback(() => {
    persistRead(notifications.map((notification) => notification.id));
  }, [notifications, persistRead]);

  const runAction = useCallback(
    (notification: Notification, action: NotificationAction) => {
      // Actions name an intent; this is the one place that decides what the
      // intent does. With a backend, these become mutations.
      if (notification.lessonId) {
        if (action.id === 'markHeld') setLessonStatus(notification.lessonId, 'completed');
        if (action.id === 'markMissed') setLessonStatus(notification.lessonId, 'cancelled');
      }
      markRead(notification.id);
    },
    [markRead, setLessonStatus],
  );

  const value = useMemo<NotificationsStore>(() => {
    const readSet = new Set(readIds);
    return {
      notifications,
      unreadCount: notifications.filter((item) => !readSet.has(item.id)).length,
      isRead: (id) => readSet.has(id),
      markRead,
      markAllRead,
      runAction,
    };
  }, [notifications, readIds, markRead, markAllRead, runAction]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsStore {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>.');
  }
  return value;
}
