/**
 * The news feed's data model.
 *
 * One flat shape for every kind of notification, with the kind's *presentation*
 * held separately in the registry. That split is what keeps the feed generic:
 * the list component renders a `Notification` without knowing what kinds exist,
 * so a new kind is a registry entry plus a dictionary block — no component
 * changes, no switch statement to extend.
 */

export type NotificationKind =
  | 'adminAnnouncement'
  | 'tutorJoined'
  | 'paymentRunningOut'
  | 'lessonStartingSoon'
  | 'lessonNeedsConfirmation';

/** Visual weight. Maps to palette entries in the card, not to raw colors. */
export type NotificationTone = 'info' | 'warning' | 'success' | 'brand';

/**
 * Values a notification's message can interpolate.
 *
 * Deliberately raw: `at` stays an ISO instant rather than a formatted string so
 * the card can format it in the active locale — a notification kept overnight
 * still reads correctly after a language switch.
 */
export type NotificationData = {
  /** Who the notification is about. */
  studentName?: string;
  /** A person's name for kinds that concern staff rather than students. */
  personName?: string;
  /** The instant the message refers to. */
  at?: string;
  /** Remaining lessons, days left, anything countable. */
  count?: number;
  /** Server-authored free text, e.g. an announcement body. */
  text?: string;
};

export type Notification = {
  id: string;
  kind: NotificationKind;
  /** ISO timestamp; the feed sorts on this. */
  createdAt: string;
  data: NotificationData;
  /**
   * The lesson an action operates on, when the kind has actions.
   */
  lessonId?: string;
  /**
   * True for notifications computed from current data rather than stored.
   *
   * Derived items cannot be dismissed — they disappear when the condition that
   * produced them stops holding, which is the honest behaviour: hiding an
   * unconfirmed lesson would not confirm it.
   */
  derived?: boolean;
};

export function notificationTime(notification: Notification): Date {
  return new Date(notification.createdAt);
}

/** Newest first. */
export function byNewest(a: Notification, b: Notification): number {
  return notificationTime(b).getTime() - notificationTime(a).getTime();
}
