/**
 * Who has run out of paid lessons.
 *
 * Built on the lesson balance that already exists rather than on a payments
 * system: the register spends it — an attended or missed lesson takes one, a
 * lesson cancelled in time gives it back — so who owes what is already being
 * worked out every time a lesson is written up.
 *
 * That is also the honest limit of it. This counts **lessons, not money**: the
 * app does not know what a lesson costs, so it never states a sum. A screen that
 * guessed at one would be wrong for every tutor who charges differently for a
 * first lesson, an exam-prep hour, or a group.
 */
export type Debtor = {
  studentId: string;
  name: string;
  tutorId: string;
  /** Null for a tutor who has left the school. */
  tutorName: string | null;
  /** What is left on the package: zero or negative, by definition of this list. */
  paidLessonsLeft: number;
  /** Lessons already taught beyond the package — the number to be paid for. */
  lessonsOwed: number;
  /** Still on the schedule, and so about to be owed too. */
  lessonsBooked: number;
  /** ISO instant, or null when nobody has written a lesson up for them yet. */
  lastTaughtAt: string | null;
};

/**
 * Which of the two situations a row is in.
 *
 * A person reads these differently and acts on them differently, so the screen
 * says which rather than showing a number and leaving them to work it out: one
 * is a conversation to have today, the other is a top-up before the next lesson.
 */
export function debtorKind(debtor: Debtor): 'owing' | 'runningOut' {
  return debtor.lessonsOwed > 0 ? 'owing' : 'runningOut';
}
