import type { Subject } from '@/shared/subjects/subject';

/**
 * What the test school teaches, and one thing it used to.
 *
 * Chemistry is retired on purpose. It is the state the whole model exists for —
 * nothing can be booked in it any more, and Oleh's lessons still say that is
 * what he was taught. Without it in the fixtures the only way to see a hidden
 * subject is to hide one by hand first.
 */
export const fixtureSubjects: Subject[] = [
  { id: 'subject-algebra', name: 'Algebra', hiddenAt: null },
  { id: 'subject-chemistry', name: 'Chemistry', hiddenAt: '2026-02-01T00:00:00.000Z' },
  { id: 'subject-english', name: 'English', hiddenAt: null },
  { id: 'subject-geometry', name: 'Geometry', hiddenAt: null },
  { id: 'subject-mathematics', name: 'Mathematics', hiddenAt: null },
  { id: 'subject-physics', name: 'Physics', hiddenAt: null },
];

/** Looked up by name, for the fixtures that used to hold the name itself. */
export function fixtureSubject(name: string): Subject {
  const found = fixtureSubjects.find((subject) => subject.name === name);
  if (!found) throw new Error(`No fixture subject called ${name}`);
  return found;
}
