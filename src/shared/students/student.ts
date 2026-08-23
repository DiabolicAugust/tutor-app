/**
 * A student the tutor teaches.
 *
 * Lessons reference a student by id rather than repeating a name: a student is
 * an entity with a history, a payment balance and eventually a parent contact —
 * not a string typed afresh for every lesson.
 */
export type Student = {
  id: string;
  name: string;
  /** What they usually study; prefills the subject when booking. */
  subject: string;
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
