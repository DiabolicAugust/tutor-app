import { lessonEnd, lessonStart, type Lesson } from '@/shared/lessons';
import { ownCalendarId } from '@/shared/tutors';

import type { Notification } from './notification';

const HOUR = 60 * 60 * 1000;

/** How far ahead counts as "starting soon". */
const SOON_WINDOW = 3 * HOUR;
/** How far back an unconfirmed lesson keeps nagging. */
const CONFIRMATION_WINDOW = 7 * 24 * HOUR;

/**
 * Notifications computed from the schedule rather than sent by a server.
 *
 * Keeping these derived instead of stored means they cannot go stale: confirm a
 * lesson and its reminder is gone on the next render, with no message to
 * retract and no read-state to reconcile. Only the tutor's own calendar
 * produces them — a colleague's unconfirmed lesson is not the user's chore.
 */
export function deriveNotifications(lessons: readonly Lesson[], now: Date): Notification[] {
  const result: Notification[] = [];
  const nowMs = now.getTime();

  for (const lesson of lessons) {
    if (lesson.tutorId !== ownCalendarId || lesson.status !== 'scheduled') continue;

    const startMs = lessonStart(lesson).getTime();
    const endMs = lessonEnd(lesson).getTime();

    if (endMs < nowMs && nowMs - endMs <= CONFIRMATION_WINDOW) {
      result.push({
        id: `derived-confirm-${lesson.id}`,
        kind: 'lessonNeedsConfirmation',
        // Sorted as of when the lesson ended, so the feed reads chronologically.
        createdAt: new Date(endMs).toISOString(),
        data: { studentName: lesson.studentName, at: lesson.startsAt },
        lessonId: lesson.id,
        derived: true,
      });
      continue;
    }

    if (startMs >= nowMs && startMs - nowMs <= SOON_WINDOW) {
      result.push({
        id: `derived-soon-${lesson.id}`,
        kind: 'lessonStartingSoon',
        createdAt: now.toISOString(),
        data: { studentName: lesson.studentName, at: lesson.startsAt },
        lessonId: lesson.id,
        derived: true,
      });
    }
  }

  return result;
}
