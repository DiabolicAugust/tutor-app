import { addDays, addMinutes, startOfDay } from '@/shared/lib/date';
import type { Lesson } from '@/shared/lessons/lesson';
import { ownCalendarId } from '@/shared/tutors/tutor';

/**
 * Test schedule. Generated relative to *now* on every launch, so a test build
 * always demonstrates the whole feature set whenever it is opened:
 *
 * - a lesson that has already ended but is still unconfirmed, so the news feed
 *   always has a "did this take place?" item to act on;
 * - a lesson starting within the hour, so "starting soon" always appears;
 * - two lessons at the same time, so the grid's overlap columns are visible;
 * - cancelled and completed lessons, so every status has a look;
 * - colleagues' lessons, so calendar filters have something to filter;
 * - lessons spread across the month, so the month view is not empty.
 */

/** Anchored to the hour so times read cleanly rather than at 14:37. */
function hoursFromNow(hours: number, minuteOffset = 0): string {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  return addMinutes(date, hours * 60 + minuteOffset).toISOString();
}

function onDay(dayOffset: number, hour: number, minute = 0): string {
  const date = startOfDay(addDays(new Date(), dayOffset));
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

let sequence = 0;
function lesson(
  tutorId: string,
  studentName: string,
  subject: string,
  startsAt: string,
  durationMinutes: number,
  status: Lesson['status'] = 'scheduled',
): Lesson {
  sequence += 1;
  return {
    id: `fixture-${sequence}`,
    tutorId,
    studentName,
    subject,
    startsAt,
    durationMinutes,
    status,
  };
}

export const fixtureLessons: Lesson[] = [
  // Relative to now: these drive the news feed, so they must always exist.
  lesson(ownCalendarId, 'Anna Koval', 'Mathematics', hoursFromNow(-3), 60),
  lesson(ownCalendarId, 'Petro Melnyk', 'Algebra', hoursFromNow(-1, -30), 45),
  lesson(ownCalendarId, 'Sofia Bondar', 'Geometry', hoursFromNow(1), 90),

  // Same slot as the one above, on a colleague's calendar: overlap + filters.
  lesson('tutor-2', 'Daria Sydorenko', 'English', hoursFromNow(1), 60),
  lesson('tutor-3', 'Ihor Palii', 'Physics', hoursFromNow(4), 60),

  // Every status has a look.
  lesson(ownCalendarId, 'Maksym Zhuk', 'Mathematics', hoursFromNow(7), 60, 'cancelled'),
  lesson(ownCalendarId, 'Mariia Tkachenko', 'Mathematics', onDay(-1, 13), 60, 'completed'),
  lesson(ownCalendarId, 'Anna Koval', 'Mathematics', onDay(-2, 10), 60, 'completed'),

  // Fixed days, for the three-day and month views.
  lesson(ownCalendarId, 'Ivan Shevchenko', 'Mathematics', onDay(1, 9, 30), 60),
  lesson(ownCalendarId, 'Anna Koval', 'Mathematics', onDay(1, 15), 60),
  lesson('tutor-2', 'Kateryna Lymar', 'English', onDay(1, 10), 45),
  lesson('tutor-4', 'Oleh Kravets', 'Chemistry', onDay(1, 13), 60),
  lesson(ownCalendarId, 'Sofia Bondar', 'Geometry', onDay(2, 11), 60),
  lesson('tutor-3', 'Ihor Palii', 'Physics', onDay(2, 17), 90),
  lesson(ownCalendarId, 'Petro Melnyk', 'Algebra', onDay(4, 12), 45),
  lesson(ownCalendarId, 'Anna Koval', 'Mathematics', onDay(7, 9), 60),
  lesson('tutor-2', 'Daria Sydorenko', 'English', onDay(8, 14), 60),
  lesson(ownCalendarId, 'Sofia Bondar', 'Geometry', onDay(-6, 16), 60, 'completed'),
  lesson(ownCalendarId, 'Yaroslav Bilyk', 'Mathematics', onDay(12, 10, 30), 60),
];
