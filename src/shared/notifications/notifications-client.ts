import { http } from '@/shared/api/http';

import type { Notification, NotificationKind } from './notification';

export type NotificationsClient = {
  /** Server-sent notifications only; lesson reminders are derived locally. */
  list: () => Promise<Notification[]>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

/** The API sends screaming snake case; the app's registry is keyed camelCase. */
const kindFromWire: Record<string, NotificationKind> = {
  ADMIN_ANNOUNCEMENT: 'adminAnnouncement',
  TUTOR_JOINED: 'tutorJoined',
  PAYMENT_RUNNING_OUT: 'paymentRunningOut',
};

type WireNotification = {
  id: string;
  kind: string;
  createdAt: string;
  readAt: string | null;
  data: Notification['data'];
};

export const httpNotificationsClient: NotificationsClient = {
  async list() {
    const wire = await http.get<WireNotification[]>('/notifications');

    return wire
      // A kind this build does not know about is skipped rather than rendered as
      // a blank card: an older app must survive a newer server.
      .filter((item) => item.kind in kindFromWire)
      .map((item) => ({
        id: item.id,
        kind: kindFromWire[item.kind],
        createdAt: item.createdAt,
        data: item.data ?? {},
      }));
  },

  markRead: (id) => http.post<void>(`/notifications/${id}/read`),
  markAllRead: () => http.post<void>('/notifications/read-all'),
};
