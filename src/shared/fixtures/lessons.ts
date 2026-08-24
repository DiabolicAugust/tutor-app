import { addDays, addMinutes, startOfDay } from '@/shared/lib/date';
import type { AttendanceStatus } from '@/shared/gradebook/attendance';
import type { Lesson, LessonGroup } from '@/shared/lessons/lesson';

import { fixtureGroups } from './groups';
import { fixtureOwnCalendarId } from '@/shared/tutors/tutor';

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

/**
 * The gradebook half of a lesson: what was covered, what was set, who turned up.
 *
 * Optional, because an unwritten-up lesson is a real and common state — and one
 * the app has to render, since "which of yesterday's lessons still need writing
 * up" is the question the journal exists to answer.
 */
type Journal = {
  topic?: string | null;
  homework?: string | null;
  /** How the single student was marked. Group fixtures mark each member. */
  attendance?: AttendanceStatus;
  homeworkDone?: boolean | null;
};

/**
 * The fixture groups, as a lesson carries them.
 *
 * Referenced by id rather than imported whole, so a renamed group is a compile
 * error here instead of a lesson pointing at nothing.
 */
function groupOf(id: string): LessonGroup {
  const group = fixtureGroups.find((candidate) => candidate.id === id);
  if (!group) throw new Error(`Unknown fixture group: ${id}`);

  return {
    id: group.id,
    name: group.name,
    subject: group.subject,
    level: group.level,
    members: group.members.map((member) => ({
      student: { id: member.student.id, name: member.student.name },
    })),
  };
}

let sequence = 0;
function lesson(
  tutorId: string,
  studentId: string,
  subject: string,
  startsAt: string,
  durationMinutes: number,
  status: Lesson['status'] = 'scheduled',
  journal?: Journal,
): Lesson {
  sequence += 1;
  return {
    id: `fixture-${sequence}`,
    tutorId,
    studentId,
    subject,
    startsAt,
    durationMinutes,
    status,
    group: null,
    topic: journal?.topic ?? null,
    homework: journal?.homework ?? null,
    // One line for the single student, so a fixture lesson reads the same way a
    // real one does after being written up.
    attendances: journal?.attendance
      ? [
          {
            studentId,
            status: journal.attendance,
            homeworkDone: journal.homeworkDone ?? null,
          },
        ]
      : [],
  };
}

/** A lesson for a group rather than for one student. */
function groupLesson(
  groupId: string,
  subject: string,
  startsAt: string,
  durationMinutes: number,
  status: Lesson['status'] = 'scheduled',
  register: Lesson['attendances'] = [],
): Lesson {
  sequence += 1;
  const group = groupOf(groupId);

  return {
    id: `fixture-${sequence}`,
    tutorId: fixtureOwnCalendarId,
    studentId: null,
    group,
    subject,
    startsAt,
    durationMinutes,
    status,
    topic: null,
    homework: null,
    attendances: register,
  };
}

export const fixtureLessons: Lesson[] = [
  // Relative to now: these drive the news feed, so they must always exist.
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', hoursFromNow(-3), 60),
  lesson(fixtureOwnCalendarId, 'student-petro', 'Algebra', hoursFromNow(-1, -30), 45),
  lesson(fixtureOwnCalendarId, 'student-sofia', 'Geometry', hoursFromNow(1), 90),

  // Same slot as the one above, on a colleague's calendar: overlap + filters.
  lesson('tutor-2', 'student-daria', 'English', hoursFromNow(1), 60),
  lesson('tutor-3', 'student-ihor', 'Physics', hoursFromNow(4), 60),

  // Every status has a look.
  lesson(fixtureOwnCalendarId, 'student-maksym', 'Mathematics', hoursFromNow(7), 60, 'cancelled'),
  lesson(fixtureOwnCalendarId, 'student-mariia', 'Mathematics', onDay(-1, 13), 60, 'completed', {
    topic: 'Quadratic equations — completing the square',
    homework: 'Exercises 4.1–4.6',
    // Set but not yet reviewed, which is the state most lessons sit in.
    homeworkDone: null,
    attendance: 'present',
  }),
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(-2, 10), 60, 'completed', {
    topic: 'Fractions: common denominators',
    homework: 'Workbook p. 31',
    homeworkDone: true,
    attendance: 'late',
  }),

  // Anna's history, so one student has a gradebook worth opening: a no-show that
  // was charged, an excused absence that was not, and a lesson still unwritten.
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(-9, 10), 60, 'completed', {
    topic: 'Percentages in word problems',
    homework: null,
    attendance: 'absentUnexcused',
  }),
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(-16, 10), 60, 'cancelled', {
    topic: null,
    homework: null,
    attendance: 'absentExcused',
  }),
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(-23, 10), 60, 'completed', {
    topic: 'Order of operations',
    homework: 'Sheet 2',
    homeworkDone: false,
    attendance: 'present',
  }),

  // Fixed days, for the three-day and month views.
  lesson(fixtureOwnCalendarId, 'student-ivan', 'Mathematics', onDay(1, 9, 30), 60),
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(1, 15), 60),
  lesson('tutor-2', 'student-kateryna', 'English', onDay(1, 10), 45),
  lesson('tutor-4', 'student-oleh', 'Chemistry', onDay(1, 13), 60),
  lesson(fixtureOwnCalendarId, 'student-sofia', 'Geometry', onDay(2, 11), 60),
  lesson('tutor-3', 'student-ihor', 'Physics', onDay(2, 17), 90),
  lesson(fixtureOwnCalendarId, 'student-petro', 'Algebra', onDay(4, 12), 45),
  lesson(fixtureOwnCalendarId, 'student-anna', 'Mathematics', onDay(7, 9), 60),
  lesson('tutor-2', 'student-daria', 'English', onDay(8, 14), 60),
  lesson(fixtureOwnCalendarId, 'student-sofia', 'Geometry', onDay(-6, 16), 60, 'completed'),
  lesson(fixtureOwnCalendarId, 'student-yaroslav', 'Mathematics', onDay(12, 10, 30), 60),

  // Group lessons, so the calendar shows a group block in every view and the
  // register has somewhere with more than one line to be filled in.
  groupLesson('group-b1', 'Mathematics', hoursFromNow(2), 90),
  groupLesson('group-exam', 'Mathematics', onDay(1, 17), 60),
  groupLesson('group-b1', 'Mathematics', onDay(3, 16), 90),
  // Already written up, so a marked group register is visible without touching
  // anything: two came, one late, one cancelled in time.
  groupLesson('group-b1', 'Mathematics', onDay(-3, 16), 90, 'completed', [
    { studentId: 'student-anna', status: 'present', homeworkDone: true },
    { studentId: 'student-petro', status: 'late', homeworkDone: false },
    { studentId: 'student-sofia', status: 'absentExcused', homeworkDone: null },
  ]),
  // Ended and untouched, so the "needs writing up" dot has a group to sit on.
  groupLesson('group-exam', 'Mathematics', hoursFromNow(-5), 60),
];
