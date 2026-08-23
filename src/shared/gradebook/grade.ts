/**
 * A mark.
 *
 * Three kinds because schools genuinely grade in three registers, and forcing
 * one on them is what makes a gradebook go unused: a scale mark for a test, a
 * percentage for a quiz, and words for everything that does not reduce to a
 * number.
 */
export type GradeKind = 'classic' | 'percentage' | 'descriptive';

export type Grade = {
  id: string;
  kind: GradeKind;
  /** Null for a descriptive mark, which carries no number at all. */
  value: number | null;
  /** What it was for — "speaking", "unit 3 test". Free text, the school's words. */
  category: string | null;
  /** The whole mark when descriptive; a remark otherwise. */
  comment: string | null;
  /** How much it counts in the average. A term test is not a vocabulary quiz. */
  weight: number;
  /** ISO 8601. */
  createdAt: string;
  studentId: string;
  /** The lesson it came out of, when it came out of one. */
  lessonId: string | null;
  author: { id: string; name: string };
};

/** What a new or corrected mark carries. */
export type GradeInput = {
  /**
   * Who the mark is for.
   *
   * Only needed when marking from inside a **group** lesson, where the lesson
   * alone cannot say. Absent everywhere else, and rejected by the API on a
   * one-to-one lesson whose single student would be the only valid answer.
   */
  studentId?: string;
  kind: GradeKind;
  value?: number;
  category?: string;
  comment?: string;
  weight?: number;
};

/** Where a mark is being written. */
export type GradeSubject = { kind: 'student'; id: string } | { kind: 'lesson'; id: string };

export const gradeKindOrder = [
  'classic',
  'percentage',
  'descriptive',
] as const satisfies readonly GradeKind[];

export const gradeKindKeys = {
  classic: 'gradebook.kind.classic',
  percentage: 'gradebook.kind.percentage',
  descriptive: 'gradebook.kind.descriptive',
} as const satisfies Record<GradeKind, string>;

/** Fixed by definition, unlike a school's classic scale. */
export const MAX_PERCENTAGE = 100;

/**
 * The mark as a short string.
 *
 * A percentage keeps its sign so it cannot be mistaken for a scale mark, and a
 * descriptive one has no short form at all — its words are the mark, and
 * abbreviating them would be inventing a grade nobody gave.
 */
export function formatGradeValue(grade: Grade): string | null {
  if (grade.value === null) return null;
  // Whole numbers read as "9", halves as "8.5" — never "9.00".
  const value = Number.isInteger(grade.value) ? String(grade.value) : grade.value.toFixed(1);
  return grade.kind === 'percentage' ? `${value}%` : value;
}

/** Newest first, the order the gradebook is read in. */
export function byNewestGrade(a: Grade, b: Grade): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
