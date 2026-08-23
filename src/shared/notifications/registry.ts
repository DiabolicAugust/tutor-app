import type { AppDictionary, TranslationKey } from '@/shared/i18n';
import { icons, type ButtonVariant, type IconName } from '@/shared/ui';

import type { NotificationKind, NotificationTone } from './notification';

/**
 * An inline action offered on a notification.
 *
 * Actions name an intent (`markHeld`), not an implementation — the store decides
 * what that means, so the same descriptor works whether it mutates local state
 * today or calls an endpoint tomorrow. `writeUp` is the exception the union makes
 * visible: it opens a screen rather than performing a mutation, so the feed
 * handles it and the store leaves it alone.
 */
export type NotificationAction = {
  id: 'markHeld' | 'markMissed' | 'writeUp';
  labelKey: TranslationKey<AppDictionary>;
  variant: ButtonVariant;
};

/**
 * How a kind presents itself. The translation keys are typed against the
 * dictionary, so a kind whose copy is missing fails to compile rather than
 * showing a raw key in the feed.
 */
export type NotificationDescriptor = {
  icon: IconName;
  tone: NotificationTone;
  titleKey: TranslationKey<AppDictionary>;
  bodyKey: TranslationKey<AppDictionary>;
  actions?: readonly NotificationAction[];
};

/**
 * Every kind the app knows about.
 *
 * To add one: extend `NotificationKind`, add an entry here, add its copy under
 * `news.kinds.*`. TypeScript then points at anything left undone — the record
 * is exhaustive by type.
 */
export const notificationRegistry: Record<NotificationKind, NotificationDescriptor> = {
  adminAnnouncement: {
    icon: icons.megaphone,
    tone: 'brand',
    titleKey: 'news.kinds.adminAnnouncement.title',
    bodyKey: 'news.kinds.adminAnnouncement.body',
  },
  tutorJoined: {
    icon: icons.person,
    tone: 'info',
    titleKey: 'news.kinds.tutorJoined.title',
    bodyKey: 'news.kinds.tutorJoined.body',
  },
  paymentRunningOut: {
    icon: icons.wallet,
    tone: 'warning',
    titleKey: 'news.kinds.paymentRunningOut.title',
    bodyKey: 'news.kinds.paymentRunningOut.body',
  },
  lessonStartingSoon: {
    icon: icons.clock,
    tone: 'info',
    titleKey: 'news.kinds.lessonStartingSoon.title',
    bodyKey: 'news.kinds.lessonStartingSoon.body',
  },
  lessonNeedsConfirmation: {
    icon: icons.checkCircle,
    tone: 'success',
    titleKey: 'news.kinds.lessonNeedsConfirmation.title',
    bodyKey: 'news.kinds.lessonNeedsConfirmation.body',
    actions: [
      { id: 'markHeld', labelKey: 'news.actions.markHeld', variant: 'primary' },
      { id: 'markMissed', labelKey: 'news.actions.markMissed', variant: 'secondary' },
      // The quick answers above settle the schedule; this settles the record.
      // Offered here because this is the moment a tutor is already thinking about
      // the lesson — asking them to find it again later is how a gradebook ends
      // up empty.
      { id: 'writeUp', labelKey: 'news.actions.writeUp', variant: 'ghost' },
    ],
  },
};

export function describeNotification(kind: NotificationKind): NotificationDescriptor {
  return notificationRegistry[kind];
}
