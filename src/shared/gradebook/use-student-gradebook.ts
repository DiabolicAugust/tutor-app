import { useCallback, useMemo, useState } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import { byNewestGrade, type Grade, type GradeInput, type GradeSubject } from './grade';
import type { GradebookClient } from './gradebook-client';
import type { ProgressSummary } from './progress';

export type GradebookState = {
  grades: Grade[];
  isLoading: boolean;
  hasError: boolean;
  add: (input: GradeInput) => Promise<void>;
  update: (id: string, input: GradeInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

/**
 * The marks for one subject — a student's whole record, or one lesson's.
 *
 * Local state rather than a provider, for the same reason notes use local state:
 * these are read on one screen at a time, and a store held app-wide would be
 * cache to invalidate for no benefit.
 *
 * Writes go to the server first and the list is updated from what comes back.
 * Showing an optimistic mark that might not exist a moment later is worse than a
 * short wait — a grade that appears and then vanishes is the kind of thing a
 * tutor will not trust again.
 */
export function useGradebook(
  subject: GradeSubject | null,
  client: GradebookClient = apiClients.gradebook,
): GradebookState {
  const [hasError, setHasError] = useState(false);

  const { data, isLoading, setData } = useAsyncData(
    subject ? `${subject.kind}:${subject.id}` : null,
    async () => (await client.listGrades(subject!)).sort(byNewestGrade),
  );

  const grades = useMemo(() => data ?? [], [data]);

  const add = useCallback(
    async (input: GradeInput) => {
      if (!subject) return;

      setHasError(false);
      try {
        const created = await client.addGrade(subject, input);
        setData((current) => [created, ...(current ?? [])]);
      } catch {
        setHasError(true);
      }
    },
    [client, subject, setData],
  );

  const update = useCallback(
    async (id: string, input: GradeInput) => {
      setHasError(false);
      try {
        const updated = await client.updateGrade(id, input);
        setData((current) =>
          (current ?? []).map((grade) => (grade.id === id ? updated : grade)),
        );
      } catch {
        setHasError(true);
      }
    },
    [client, setData],
  );

  const remove = useCallback(
    async (id: string) => {
      setHasError(false);
      // Removed locally first: it is already gone as far as the person who asked
      // is concerned, and putting it back on failure is clearer than a list that
      // does not react to a tap.
      const previous = grades;
      setData(previous.filter((grade) => grade.id !== id));

      try {
        await client.removeGrade(id);
      } catch {
        setData(previous);
        setHasError(true);
      }
    },
    [client, grades, setData],
  );

  return { grades, isLoading, hasError, add, update, remove };
}

/**
 * The headline numbers for one student.
 *
 * A separate hook from the marks, and a separate request, because the two change
 * for different reasons: the list is what a tutor edits, and the summary is what
 * they glance at. `reload` is exposed so writing a mark can refresh the average
 * without re-reading the list it already updated.
 */
export function useStudentProgress(
  studentId: string | null,
  client: GradebookClient = apiClients.gradebook,
): {
  progress: ProgressSummary | null;
  isLoading: boolean;
  reload: () => void;
} {
  const { data, isLoading, reload } = useAsyncData(studentId, (id) => client.progress(id));

  return { progress: data, isLoading, reload };
}
