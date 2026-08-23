import { addMinutes, isSameDay } from '@/shared/lib/date';

/**
 * The core scheduling entity. Defined before any backend exists so screens are
 * written against the shape the API will return, not against mock data.
 */

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';

export type Lesson = {
  id: string;
  /** Whose calendar this belongs to — see `shared/tutors`. */
  tutorId: string;
  studentName: string;
  subject: string;
  /** ISO 8601 — the wire format, parsed at the edges. */
  startsAt: string;
  durationMinutes: number;
  status: LessonStatus;
};

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
