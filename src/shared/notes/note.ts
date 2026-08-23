/**
 * Something written down about a student, or about one lesson.
 *
 * Field names match the API's responses, so the HTTP client is a fetch and a
 * cast rather than a mapping layer.
 */
export type Note = {
  id: string;
  text: string;
  /** ISO 8601. */
  createdAt: string;
  /** Who wrote it — a school has more than one tutor. */
  author: { id: string; name: string };
  /** Set on a note about the student in general. */
  studentId: string | null;
  /** Set on a note about one lesson. Never both. */
  lessonId: string | null;
};

/**
 * What a set of notes is about.
 *
 * A tagged union rather than two optional ids, so "neither" and "both" are not
 * states any caller can construct — the server enforces the same rule, and this
 * is the client-side half of it.
 */
export type NoteSubject = { kind: 'student'; id: string } | { kind: 'lesson'; id: string };

/** Newest first, the order both lists are read in. */
export function byNewestNote(a: Note, b: Note): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
