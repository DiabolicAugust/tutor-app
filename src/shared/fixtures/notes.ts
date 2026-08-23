import type { Note } from '@/shared/notes/note';
import { fixtureLessons } from './lessons';

/** The signed-in tutor's own name in test builds, used as a note's author. */
export const fixtureOwnName = 'You';

/**
 * A lesson from the test schedule that has already happened, so a lesson note
 * has somewhere sensible to hang. Picked by status rather than by index: the
 * schedule is generated relative to now and its order is not a contract.
 */
const completedLesson = fixtureLessons.find((lesson) => lesson.status === 'completed');

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * Test notes.
 *
 * Deliberately covers all three cases a screen has to render: several notes on
 * one student, a note on a lesson, and a note written by somebody else — which is
 * the only way to see that its remove button is correctly absent.
 */
export const fixtureNotes: Note[] = [
  {
    id: 'note-1',
    text: 'Prefers morning lessons. Mother handles the scheduling.',
    createdAt: daysAgo(12),
    author: { id: 'me', name: fixtureOwnName },
    studentId: 'student-petro',
    lessonId: null,
  },
  {
    id: 'note-2',
    text: 'Paid for the next block in cash on the 3rd.',
    createdAt: daysAgo(4),
    author: { id: 'me', name: fixtureOwnName },
    studentId: 'student-petro',
    lessonId: null,
  },
  {
    id: 'note-3',
    text: 'Covered for me in July — she has the parent contact if needed.',
    createdAt: daysAgo(30),
    author: { id: 'tutor-2', name: 'Olena Hrytsenko' },
    studentId: 'student-petro',
    lessonId: null,
  },
  {
    id: 'note-4',
    text: 'Struggles with word problems. Try shorter sets next time.',
    createdAt: daysAgo(2),
    author: { id: 'me', name: fixtureOwnName },
    studentId: 'student-anna',
    lessonId: null,
  },
  ...(completedLesson
    ? [
        {
          id: 'note-5',
          text: 'Factoring is still shaky — start the next lesson with a recap.',
          createdAt: completedLesson.startsAt,
          author: { id: 'me', name: fixtureOwnName },
          studentId: null,
          lessonId: completedLesson.id,
        } satisfies Note,
      ]
    : []),
];
