import { AppState } from 'react-native';
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
import { useLessons } from '@/shared/lessons';
import { useStudents } from '@/shared/students';
import { useOwnCalendarId } from '@/shared/tutors';
import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { deriveNotifications } from './derive';
import { byNewest, type Notification } from './notification';
import type { NotificationsClient } from './notifications-client';
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
  /**
   * Refetches server-sent notifications.
   *
   * Needed because the feed is not a live connection: something arriving on the
   * server — an announcement, a payment warning — is invisible here until asked
   * for. Called when a push arrives, when one is tapped, and when the app comes
   * back to the foreground.
   */
  refresh: () => Promise<void>;
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
export function NotificationsProvider({
  children,
  client = apiClients.notifications,
}: {
  children: ReactNode;
  client?: NotificationsClient;
}) {
  const { lessons, setLessonStatus } = useLessons();
  const { nameOf } = useStudents();
  const ownId = useOwnCalendarId();
  const [readIds, setReadIds] = useState<string[]>(() => readIdsStore.read() ?? []);
  const [sent, setSent] = useState<Notification[]>([]);

  const refresh = useCallback(async () => {
    try {
      setSent(await client.list());
    } catch {
      // Keep whatever is already on screen: an empty feed would read as "nothing
      // is happening", which is a different and wrong statement.
    }
  }, [client]);

  useEffect(() => {
    let active = true;

    // The fetch is inside an async function so nothing is set synchronously in
    // the effect body; `active` drops a response that arrives after unmount.
    void (async () => {
      const loaded = await client.list().catch(() => null);
      if (active && loaded) setSent(loaded);
    })();

    return () => {
      active = false;
    };
  }, [client]);

  /**
   * Refetches when the app returns to the foreground.
   *
   * Without this the feed showed whatever existed when the app started. An
   * announcement sent while somebody had the app open in the background stayed
   * invisible until they killed and reopened it — which is not a state anybody
   * would think to try.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => subscription.remove();
  }, [refresh]);

  const notifications = useMemo(
    () => [...sent, ...deriveNotifications(lessons, new Date(), nameOf, ownId)].sort(byNewest),
    [sent, lessons, nameOf, ownId],
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

      // Derived notifications exist only on the device, so telling the server
      // about them would be a 404.
      if (!id.startsWith('derived-')) void client.markRead(id).catch(() => undefined);
    },
    [client],
  );

  const markAllRead = useCallback(() => {
    persistRead(notifications.map((notification) => notification.id));
    void client.markAllRead().catch(() => undefined);
  }, [notifications, persistRead, client]);

  const runAction = useCallback(
    (notification: Notification, action: NotificationAction) => {
      // Actions name an intent; this is the one place that decides what the
      // intent does. With a backend, these become mutations.
      if (notification.lessonId) {
        if (action.id === 'markHeld') void setLessonStatus(notification.lessonId, 'completed');
        if (action.id === 'markMissed') void setLessonStatus(notification.lessonId, 'cancelled');
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
      refresh,
    };
  }, [notifications, readIds, markRead, markAllRead, runAction, refresh]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsStore {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>.');
  }
  return value;
}
