import { http } from '@/shared/api/http';
import { fixtures } from '@/shared/fixtures';

import type { Lesson, LessonStatus, StudentLesson } from './lesson';

export type NewLessonInput = {
  studentId: string;
  subject: string;
  /** ISO instant. */
  startsAt: string;
  durationMinutes: number;
};

export type LessonRange = {
  /** ISO instant, inclusive. */
  from: string;
  /** ISO instant, exclusive. */
  to: string;
  /** Calendars to include. Empty means the caller's own. */
  tutorIds?: readonly string[];
};

export type LessonsClient = {
  list: (range: LessonRange) => Promise<Lesson[]>;
  /**
   * One student's lessons, newest first.
   *
   * Not a variation of `list`: the calendar asks what is in a date window, this
   * asks what has happened, and the two want opposite orderings and opposite
   * defaults.
   */
  listForStudent: (studentId: string) => Promise<StudentLesson[]>;
  create: (input: NewLessonInput) => Promise<Lesson>;
  setStatus: (id: string, status: LessonStatus) => Promise<Lesson>;
};

/**
 * The API speaks `SCHEDULED`, the app speaks `scheduled`.
 *
 * Two vocabularies for the same three states is a small annoyance that becomes a
 * bug the moment it is handled in more than one place — so it is handled here,
 * at the boundary, and nowhere else.
 */
type WireStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

type WireLesson = {
  id: string;
  tutorId: string;
  studentId: string;
  subject: string;
  startsAt: string;
  durationMinutes: number;
  status: WireStatus;
  /** Prisma's shape for an aggregate; flattened on the way in. */
  _count?: { notes: number };
};

const toDomainStatus = (status: WireStatus): LessonStatus =>
  status.toLowerCase() as LessonStatus;

const toWireStatus = (status: LessonStatus): WireStatus =>
  status.toUpperCase() as WireStatus;

function toDomain(lesson: WireLesson): Lesson {
  return {
    id: lesson.id,
    tutorId: lesson.tutorId,
    studentId: lesson.studentId,
    subject: lesson.subject,
    startsAt: lesson.startsAt,
    durationMinutes: lesson.durationMinutes,
    status: toDomainStatus(lesson.status),
  };
}

export const httpLessonsClient: LessonsClient = {
  async listForStudent(studentId) {
    const wire = await http.get<WireLesson[]>(`/students/${studentId}/lessons`);
    return wire.map((lesson) => ({
      ...toDomain(lesson),
      noteCount: lesson._count?.notes ?? 0,
    }));
  },

  async list({ from, to, tutorIds }) {
    const wire = await http.get<WireLesson[]>('/lessons', {
      from,
      to,
      tutorIds: tutorIds?.length ? tutorIds.join(',') : undefined,
    });
    return wire.map(toDomain);
  },

  async create(input) {
    return toDomain(await http.post<WireLesson>('/lessons', input));
  },

  async setStatus(id, status) {
    return toDomain(
      await http.patch<WireLesson>(`/lessons/${id}/status`, { status: toWireStatus(status) }),
    );
  },
};

/** Fixture-backed. Range is ignored: the whole fixture set is small by design. */
let localId = 0;

export const mockLessonsClient: LessonsClient = {
  async list() {
    return [...fixtures.lessons];
  },

  async listForStudent(studentId) {
    return fixtures.lessons
      .filter((lesson) => lesson.studentId === studentId)
      .map((lesson) => ({
        ...lesson,
        noteCount: fixtures.notes.filter((note) => note.lessonId === lesson.id).length,
      }))
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  },

  async create(input) {
    localId += 1;
    return {
      id: `local-${localId}`,
      tutorId: 'me',
      studentId: input.studentId,
      subject: input.subject,
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      status: 'scheduled',
    };
  },

  async setStatus(id, status) {
    const existing = fixtures.lessons.find((lesson) => lesson.id === id);
    if (!existing) throw new Error(`Unknown lesson: ${id}`);
    return { ...existing, status };
  },
};
