import type { Grade } from '@/shared/gradebook/grade';

import { fixtureLessons } from './lessons';
import { fixtureOwnName } from './notes';

/**
 * Test marks.
 *
 * Deliberately covers every case a screen has to render: all three grading kinds,
 * a weighted mark (so the average is visibly not a plain mean), a mark tied to a
 * lesson and one that is not, and a mark written by somebody else — which is the
 * only way to see that its edit and remove controls are correctly absent.
 *
 * Anna carries the full history, so there is one student whose gradebook is worth
 * opening in a test build.
 */

/** A written-up lesson to hang lesson-bound marks on, found by content rather
 *  than index: the schedule is generated relative to now and its order is not a
 *  contract. */
const markedLesson = fixtureLessons.find(
  (lesson) =>
    lesson.studentId === 'student-anna' &&
    lesson.attendances?.some((entry) => entry.status === 'present'),
);

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const you = { id: 'me', name: fixtureOwnName };
const colleague = { id: 'tutor-2', name: 'Olena Rudenko' };

export const fixtureGrades: Grade[] = [
  {
    id: 'grade-1',
    kind: 'classic',
    value: 11,
    category: 'Unit test',
    comment: 'Strong on the algebra, rushed the last page.',
    // Weighted, so the average is visibly not the plain mean of the marks.
    weight: 3,
    createdAt: daysAgo(2),
    studentId: 'student-anna',
    lessonId: markedLesson?.id ?? null,
    author: you,
  },
  {
    id: 'grade-2',
    kind: 'classic',
    value: 8,
    category: 'Homework',
    comment: null,
    weight: 1,
    createdAt: daysAgo(9),
    studentId: 'student-anna',
    lessonId: null,
    author: you,
  },
  {
    id: 'grade-3',
    kind: 'percentage',
    value: 87.5,
    category: 'Term test',
    comment: null,
    weight: 2,
    createdAt: daysAgo(16),
    studentId: 'student-anna',
    lessonId: null,
    author: you,
  },
  {
    id: 'grade-4',
    kind: 'descriptive',
    value: null,
    category: 'Speaking',
    comment: 'Explains her reasoning out loud now. Still guesses when unsure.',
    weight: 1,
    createdAt: daysAgo(23),
    studentId: 'student-anna',
    lessonId: null,
    // Somebody else's, so the absent edit and remove controls are visible.
    author: colleague,
  },
  {
    id: 'grade-5',
    kind: 'classic',
    value: 6,
    category: 'Homework',
    comment: null,
    weight: 1,
    createdAt: daysAgo(4),
    studentId: 'student-petro',
    lessonId: null,
    author: you,
  },
  {
    id: 'grade-6',
    kind: 'percentage',
    value: 64,
    category: 'Quiz',
    comment: 'Needs another pass over the vocabulary.',
    weight: 1,
    createdAt: daysAgo(6),
    studentId: 'student-petro',
    lessonId: null,
    author: you,
  },
  {
    id: 'grade-7',
    kind: 'classic',
    value: 12,
    category: 'Unit test',
    comment: null,
    weight: 2,
    createdAt: daysAgo(3),
    studentId: 'student-sofia',
    lessonId: null,
    author: you,
  },
];
