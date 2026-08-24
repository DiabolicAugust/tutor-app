import * as Notifications from 'expo-notifications';

import { lessonStart, type Lesson } from '@/shared/lessons';

import { REMINDER_CHANNEL_ID, REMINDER_SOUND } from './reminder-channel';

/**
 * Content for one reminder.
 *
 * Built by the caller so the strings are translated — this module never sees the
 * dictionary, which keeps it usable from a background task later.
 */
export type ReminderContent = {
  title: string;
  body: string;
};

export type ReminderPlan = {
  lesson: Lesson;
  /** When the notification should fire. */
  fireAt: Date;
  content: ReminderContent;
};

/**
 * Marks our notifications so reconciling can cancel only what we scheduled.
 *
 * Cancelling everything would also throw away notifications scheduled by
 * anything else in the app, now or later.
 */
const REMINDER_TAG = 'lessonReminder';

/**
 * Which lessons deserve a reminder, and when.
 *
 * Only the tutor's own upcoming, still-scheduled lessons: a colleague's lesson
 * is not theirs to attend, a cancelled one is not happening, and a past one is
 * not a reminder. `leadMinutes` in the past is dropped rather than fired
 * immediately — a notification for a lesson that has already started is noise.
 */
export function planReminders(
  lessons: readonly Lesson[],
  leadMinutes: number,
  describe: (lesson: Lesson, startsAt: Date) => ReminderContent,
  /** Whose lessons to remind about — the session's user, not a constant. */
  ownId: string,
  now: Date = new Date(),
): ReminderPlan[] {
  return lessons
    .filter((lesson) => lesson.tutorId === ownId && lesson.status === 'scheduled')
    .map((lesson) => {
      const startsAt = lessonStart(lesson);
      return {
        lesson,
        fireAt: new Date(startsAt.getTime() - leadMinutes * 60 * 1000),
        content: describe(lesson, startsAt),
      };
    })
    .filter((plan) => plan.fireAt.getTime() > now.getTime())
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/** Everything we previously scheduled, so it can be replaced wholesale. */
async function cancelOurs(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((item) => (item.content.data as { tag?: string } | null)?.tag === REMINDER_TAG)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/**
 * Makes the scheduled notifications match `plans` exactly.
 *
 * Cancel-then-schedule rather than diffing: the schedule changes for many
 * reasons — a lesson moved, was cancelled, the lead time changed, the app
 * reloaded — and a diff would have to be right about all of them. Replacing is
 * cheap for the tens of notifications a tutor's week produces.
 */
export async function syncReminders(plans: readonly ReminderPlan[]): Promise<number> {
  await cancelOurs();

  for (const plan of plans) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: plan.content.title,
        body: plan.content.body,
        sound: REMINDER_SOUND,
        data: { tag: REMINDER_TAG, lessonId: plan.lesson.id },
        // iOS: an interruption level above passive so it lights the screen,
        // without claiming to be time-critical (which needs an entitlement).
        interruptionLevel: 'active',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: plan.fireAt,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  }

  return plans.length;
}

/** Used when the user turns reminders off. */
export async function clearReminders(): Promise<void> {
  await cancelOurs();
}
