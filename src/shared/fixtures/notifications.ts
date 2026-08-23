import type { Notification } from '@/shared/notifications/notification';

/**
 * Test notifications — the kinds a server would push. The lesson-based kinds
 * are not here: they are derived from the schedule, and `fixtureLessons` is
 * built so that they always appear.
 *
 * Between the two sources, a test build always shows every notification kind.
 */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const fixtureNotifications: Notification[] = [
  {
    id: 'fixture-announcement-1',
    kind: 'adminAnnouncement',
    createdAt: hoursAgo(2),
    data: {
      text: 'Parent-teacher meetings move to Friday. Please keep 15:00-18:00 free.',
    },
  },
  {
    id: 'fixture-payment-1',
    kind: 'paymentRunningOut',
    createdAt: hoursAgo(5),
    data: { studentName: 'Anna Koval', count: 2 },
  },
  {
    id: 'fixture-payment-2',
    kind: 'paymentRunningOut',
    // Count of one, so the singular plural form is exercised too.
    createdAt: hoursAgo(30),
    data: { studentName: 'Petro Melnyk', count: 1 },
  },
  {
    id: 'fixture-tutor-1',
    kind: 'tutorJoined',
    createdAt: hoursAgo(26),
    data: { personName: 'Yulia Danylchenko', text: 'Chemistry' },
  },
  {
    id: 'fixture-announcement-2',
    kind: 'adminAnnouncement',
    createdAt: hoursAgo(52),
    data: { text: 'New invoicing rules take effect next month.' },
  },
];
