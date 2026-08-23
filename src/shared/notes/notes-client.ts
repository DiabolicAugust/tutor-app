import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

import type { Note, NoteSubject } from './note';

/**
 * The seam for notes.
 *
 * One pair of methods taking a subject rather than four methods: the difference
 * between a student note and a lesson note is which URL it lives under, and
 * pushing that decision down here keeps every caller — hook, screen, component —
 * unaware of it.
 */
export type NotesClient = {
  list: (subject: NoteSubject) => Promise<Note[]>;
  add: (subject: NoteSubject, text: string) => Promise<Note>;
  remove: (id: string) => Promise<void>;
};

const pathFor = (subject: NoteSubject): string =>
  subject.kind === 'student' ? `/students/${subject.id}/notes` : `/lessons/${subject.id}/notes`;

export const httpNotesClient: NotesClient = {
  list: (subject) => http.get<Note[]>(pathFor(subject)),
  add: (subject, text) => http.post<Note>(pathFor(subject), { text }),
  remove: async (id) => {
    await http.delete<void>(`/notes/${id}`);
  },
};

/**
 * Stand-in until the API exists.
 *
 * Notes added during a session are held in memory so the flow is genuinely
 * exercisable — write one, see it, remove it. Nothing survives a reload, which is
 * the honest behaviour with no server to store it.
 */
const added = new Map<string, Note[]>();
let localId = 0;

const keyFor = (subject: NoteSubject): string => `${subject.kind}:${subject.id}`;

export const mockNotesClient: NotesClient = {
  async list(subject) {
    const seeded = fixtures.notes.filter((note) =>
      subject.kind === 'student' ? note.studentId === subject.id : note.lessonId === subject.id,
    );

    return [...(added.get(keyFor(subject)) ?? []), ...seeded];
  },

  async add(subject, text) {
    localId += 1;
    const note: Note = {
      id: `local-note-${localId}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      author: { id: 'me', name: fixtures.ownName },
      studentId: subject.kind === 'student' ? subject.id : null,
      lessonId: subject.kind === 'lesson' ? subject.id : null,
    };

    added.set(keyFor(subject), [note, ...(added.get(keyFor(subject)) ?? [])]);
    return note;
  },

  async remove(id) {
    for (const [key, notes] of added) {
      added.set(
        key,
        notes.filter((note) => note.id !== id),
      );
    }
  },
};
