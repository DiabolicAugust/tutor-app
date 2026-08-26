import type { AttendanceStatus } from '@/shared/gradebook/attendance';
import type { MeetingProvider } from '@/shared/meetings';
import { addMinutes, isSameDay } from '@/shared/lib/date';
import type { Subject } from '@/shared/subjects/subject';

/**
 * The core scheduling entity. Defined before any backend exists so screens are
 * written against the shape the API will return, not against mock data.
 */

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';

export type Lesson = {
  id: string;
  /** Whose calendar this belongs to — see `shared/tutors`. */
  tutorId: string;
  /**
   * The student taught, for a one-to-one lesson — see `shared/students`.
   *
   * Null for a group lesson. **Exactly one of `studentId` and `group` is set**,
   * which the server enforces; this side only has to render whichever it is.
   */
  studentId: string | null;
  /** The group taught, for a group lesson. Null for a one-to-one lesson. */
  group?: LessonGroup | null;
  /**
   * What was taught.
   *
   * Kept as the row, which is what lets a lesson from last term still name a
   * subject the school has since retired. Null for a lesson booked without one
   * — the calendar shows those as simply a lesson.
   */
  subject: Subject | null;
  /** ISO 8601 — the wire format, parsed at the edges. */
  startsAt: string;
  durationMinutes: number;
  status: LessonStatus;
  /**
   * What was actually covered. Null until the lesson has been written up, which
   * is also what makes "which lessons still need writing up" answerable.
   */
  topic?: string | null;
  /** What was set for next time. The student's half of the record. */
  homework?: string | null;
  /**
   * Where to join, for a lesson taught online. Null for one taught in a room.
   *
   * Written when the lesson was booked, from the tutor's settings at that
   * moment, and never rewritten — so a tutor who changes provider does not
   * silently invalidate a link a student already has.
   */
  meetingUrl?: string | null;
  /** Which provider produced `meetingUrl`, stored beside it for the same reason. */
  meetingProvider?: MeetingProvider | null;
  /**
   * Who turned up, one line per student — see `shared/gradebook`.
   *
   * A list rather than a single value, because since groups a lesson can be a
   * room where two people were present, one was late and one never came. Absent
   * from a response means nobody has been marked.
   *
   * Optional because the calendar's own reads predate it and do not care: a
   * block does not need to know, and making every one of them carry the field
   * would be a migration through code that has no use for it.
   */
  attendances?: LessonAttendance[];
};

/** A group, as a lesson carries it. Members come along so a block can expand. */
export type LessonGroup = {
  id: string;
  name: string;
  subject: Subject | null;
  level: string | null;
  members: { student: { id: string; name: string } }[];
};

/** One student's line in a lesson's register. */
export type LessonAttendance = {
  studentId: string;
  status: AttendanceStatus;
  /**
   * Whether this student's homework came back done.
   *
   * Per-student while the homework *text* is per-lesson: one assignment is set
   * for the room, and each person either did it or did not. Three states, so
   * nullable — treating "unchecked" as `false` would report every unchecked
   * lesson as work not done.
   */
  homeworkDone: boolean | null;
};

/** True for a lesson taught to a group rather than to one student. */
export function isGroupLesson(lesson: Lesson): boolean {
  return lesson.group != null;
}

/** The students a lesson is for: the one it names, or the group's members. */
export function lessonStudentIds(lesson: Lesson): string[] {
  if (lesson.group) {
    return lesson.group.members.map((member) => member.student.id);
  }
  return lesson.studentId ? [lesson.studentId] : [];
}

/**
 * What a lesson is called on a calendar block or in a list.
 *
 * The group's name for a group lesson, the student's for an individual one — one
 * function rather than the same conditional at every call site, because there are
 * four of them and they must not disagree.
 *
 * `nameOf` is passed in rather than imported so this stays a pure function the
 * calendar's own tests can call.
 */
export function lessonLabel(
  lesson: Lesson,
  nameOf: (studentId: string) => string,
): string {
  if (lesson.group) return lesson.group.name;
  return lesson.studentId ? nameOf(lesson.studentId) : '';
}

/** This student's line in the register, if anybody has marked them. */
export function attendanceFor(
  lesson: Lesson,
  studentId: string,
): LessonAttendance | undefined {
  return lesson.attendances?.find((entry) => entry.studentId === studentId);
}

/**
 * True when the lesson has happened but nobody has written it up.
 *
 * Keyed on status rather than on the register, because marking anybody settles
 * the status — so a lesson still `scheduled` after it ended is exactly the one
 * nobody has touched, group or not.
 */
export function needsWriteUp(lesson: Lesson, now: Date): boolean {
  return lesson.status === 'scheduled' && lessonEnd(lesson) < now;
}

/**
 * A lesson as a student's history shows it.
 *
 * The note count comes with the row because the list needs it and fetching notes
 * per lesson to count them would be one request per row.
 */
export type StudentLesson = Lesson & { noteCount: number };

export function lessonStart(lesson: Lesson): Date {
  return new Date(lesson.startsAt);
}

export function lessonEnd(lesson: Lesson): Date {
  return addMinutes(lessonStart(lesson), lesson.durationMinutes);
}

/** Lessons on `day`, owned by one of `calendarIds`, in chronological order. */
export function lessonsForDay(
  lessons: readonly Lesson[],
  day: Date,
  calendarIds: readonly string[],
): Lesson[] {
  return lessons
    .filter((lesson) => calendarIds.includes(lesson.tutorId))
    .filter((lesson) => isSameDay(lessonStart(lesson), day))
    .sort(byStartTime);
}

/** Chronological, for rendering a day or an agenda. */
export function byStartTime(a: Lesson, b: Lesson): number {
  return lessonStart(a).getTime() - lessonStart(b).getTime();
}
