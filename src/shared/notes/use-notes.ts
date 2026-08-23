import { useCallback, useMemo, useState } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import { byNewestNote, type Note, type NoteSubject } from './note';
import type { NotesClient } from './notes-client';

export type NotesState = {
  notes: Note[];
  isLoading: boolean;
  /** True when the last write failed, so the screen can say so. */
  hasError: boolean;
  add: (text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

/**
 * Notes for one subject, loaded on mount.
 *
 * Local state rather than a provider: notes are read on exactly one screen at a
 * time, and a store held app-wide would be cache to invalidate for no benefit.
 *
 * Writes go to the server first and the list is updated from what comes back.
 * The optimistic alternative would show a note that might not exist a moment
 * later — and for something somebody typed, briefly showing it and then removing
 * it is worse than a short wait.
 */
export function useNotes(
  subject: NoteSubject | null,
  client: NotesClient = apiClients.notes,
): NotesState {
  const [hasError, setHasError] = useState(false);

  const { data, isLoading, setData } = useAsyncData(
    subject ? `${subject.kind}:${subject.id}` : null,
    async () => (await client.list(subject!)).sort(byNewestNote),
  );

  // Memoised so the callbacks below do not get a new dependency every render.
  const notes = useMemo(() => data ?? [], [data]);

  const add = useCallback(
    async (text: string) => {
      if (!subject || text.trim().length === 0) return;

      setHasError(false);
      try {
        const created = await client.add(subject, text);
        setData((current) => [created, ...(current ?? [])]);
      } catch {
        setHasError(true);
      }
    },
    [client, subject, setData],
  );

  const remove = useCallback(
    async (id: string) => {
      setHasError(false);
      // Removed locally first: the note is already gone as far as the person who
      // asked is concerned, and putting it back on failure is clearer than a
      // list that does not react to a tap.
      const previous = notes;
      setData(previous.filter((note) => note.id !== id));

      try {
        await client.remove(id);
      } catch {
        setData(previous);
        setHasError(true);
      }
    },
    [client, notes, setData],
  );

  return { notes, isLoading, hasError, add, remove };
}
