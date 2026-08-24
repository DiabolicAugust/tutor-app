import { http } from '@/shared/api/http';
import { ApiError } from '@/shared/api/api-error';

import type { Subject, SubjectUsage } from './subject';

export type SubjectsClient = {
  /**
   * The school's whole list, hidden ones included.
   *
   * One request rather than two: the pickers want what is offered and the
   * management screen wants everything, and filtering on this side means opening
   * the panel does not go back to the server for a list it already has.
   */
  list: () => Promise<Subject[]>;
  create: (name: string) => Promise<Subject>;
  rename: (id: string, name: string) => Promise<Subject>;
  /** What still points at it — read before offering to hide. */
  usage: (id: string) => Promise<SubjectUsage>;
  /**
   * Takes it off the list without deleting it.
   *
   * Rejects with a 409 while anything current still points at it, and the error
   * carries the usage report so the screen can name who has to be moved.
   */
  hide: (id: string) => Promise<Subject>;
  restore: (id: string) => Promise<Subject>;
};

export const httpSubjectsClient: SubjectsClient = {
  list: () => http.get<Subject[]>('/subjects', { includeHidden: true }),
  create: (name) => http.post<Subject>('/subjects', { name }),
  rename: (id, name) => http.patch<Subject>(`/subjects/${id}`, { name }),
  usage: (id) => http.get<SubjectUsage>(`/subjects/${id}/usage`),
  hide: (id) => http.post<Subject>(`/subjects/${id}/hide`),
  restore: (id) => http.post<Subject>(`/subjects/${id}/restore`),
};

/**
 * The conflict the server answers with when a name is already taken.
 *
 * Read by the form so it can offer to bring a hidden subject back instead of
 * reporting that a name nobody can see is unavailable.
 */
export type SubjectConflict = {
  code: 'SUBJECT_EXISTS' | 'SUBJECT_HIDDEN';
  subject: Subject;
};

/** The 409 body when something current still studies the subject. */
export type SubjectInUse = {
  code: 'SUBJECT_IN_USE';
  usage: SubjectUsage;
};

export function conflictFrom(error: unknown): SubjectConflict | null {
  const body = error instanceof ApiError ? error.body : null;
  if (!body || typeof body !== 'object') return null;

  const { code, subject } = body as Partial<SubjectConflict>;
  if (code !== 'SUBJECT_EXISTS' && code !== 'SUBJECT_HIDDEN') return null;
  return subject ? { code, subject } : null;
}

export function inUseFrom(error: unknown): SubjectUsage | null {
  const body = error instanceof ApiError ? error.body : null;
  if (!body || typeof body !== 'object') return null;

  const { code, usage } = body as Partial<SubjectInUse>;
  return code === 'SUBJECT_IN_USE' && usage ? usage : null;
}

