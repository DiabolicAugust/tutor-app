import { http } from '@/shared/api/http';

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
