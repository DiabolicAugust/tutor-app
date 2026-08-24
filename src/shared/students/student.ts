import type { Subject } from '@/shared/subjects/subject';

/**
 * A student the tutor teaches.
 *
 * Lessons reference a student by id rather than repeating a name: a student is
 * an entity with a history, a payment balance and eventually a parent contact —
 * not a string typed afresh for every lesson.
 */
export type Student = {
  id: string;
  /**
   * The tutor who teaches them. A school's roster holds everyone's students, but
   * a tutor books lessons only for their own — see `ownStudents`.
   */
  tutorId: string;
  name: string;
  /**
   * What they usually study; prefills the subject when booking.
   *
   * The row rather than its name, so a form can preselect it and a screen can
   * show it without a second lookup. Null is a real state: a student can be on
   * the books before anybody has settled what they are studying.
   */
  subject: Subject | null;
  /**
   * Lessons remaining on their current package. Drives the payment reminders in
   * the news feed.
   */
  paidLessonsLeft: number;
};

/** Alphabetical, for pickers and lists. */
export function byName(a: Student, b: Student): number {
  return a.name.localeCompare(b.name);
}
