/**
 * Something the school teaches.
 *
 * A row rather than a word typed onto every student, group and lesson. As free
 * text the same subject arrived spelled several ways, "how many maths lessons
 * this month" had no answer, and every picker was a blank field with no right
 * value in it.
 *
 * Scoped to one school by the server, which is why there is no `schoolId` here:
 * the app never sees another school's list, so nothing on this side has to check.
 */
export type Subject = {
  id: string;
  name: string;
  /**
   * ISO 8601 when the school stopped teaching it; null while it is on offer.
   *
   * Hidden rather than deleted, so a lesson taught last term can still say what
   * it was about. Screens that offer a choice must leave these out; screens that
   * show what already happened must not.
   */
  hiddenAt: string | null;
};

/**
 * What still points at a subject, and so what has to be dealt with before it can
 * come off the list.
 *
 * Students and groups block because they say what somebody is studying now, and
 * so do lessons still to come. Lessons already taught do not, which is the whole
 * distinction: a subject taught for three years has hundreds behind it, and if
 * those counted it could never be retired at all.
 */
export type SubjectUsage = {
  subject: Subject;
  students: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  upcomingLessons: number;
  /** Shown so the admin sees what hiding preserves, rather than what it blocks. */
  pastLessons: number;
  canHide: boolean;
};

/** Alphabetical, for pickers and for the management list. */
export function bySubjectName(a: Subject, b: Subject): number {
  return a.name.localeCompare(b.name);
}

/** Still on offer — the only ones a form may propose. */
export function isOffered(subject: Subject): boolean {
  return subject.hiddenAt === null;
}
