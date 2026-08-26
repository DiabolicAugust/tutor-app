import { http } from '@/shared/api/http';
import { toDomainAttendance, type WireAttendance } from '@/shared/gradebook/attendance';
import type { MeetingProvider } from '@/shared/meetings';
import type { Subject } from '@/shared/subjects/subject';


import type { Lesson, LessonStatus, StudentLesson } from './lesson';

/** A group as the wire carries it inside a lesson. Already the domain shape. */
type WireLessonGroup = {
  id: string;
  name: string;
  subject: Subject | null;
  level: string | null;
  members: { student: { id: string; name: string } }[];
};

/**
 * Booking one lesson.
 *
 * Exactly one of `studentId` and `groupId`; the server rejects neither and both,
 * and the form only ever offers one of the two.
 */
export type NewLessonInput = {
  studentId?: string;
  groupId?: string;
  /**
   * What is being taught, as an id from the school's list.
   *
   * Optional, because a lesson has always been bookable without one and the
   * calendar shows such a lesson as simply a lesson. The form asks for a subject;
   * the wire does not insist on it.
   */
  subjectId?: string;
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
  subject: Subject | null;
  startsAt: string;
  durationMinutes: number;
  status: WireStatus;
  /** The gradebook half. Absent from responses written before it existed. */
  topic?: string | null;
  homework?: string | null;
  /**
   * Where to join. Spelled the same on both sides — see `shared/meetings` for
   * why this one list is not translated at the boundary the way status is.
   */
  meetingUrl?: string | null;
  meetingProvider?: MeetingProvider | null;
  studentId: string | null;
  group?: WireLessonGroup | null;
  attendances?: {
    studentId: string;
    status: WireAttendance;
    homeworkDone: boolean | null;
  }[];
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
    topic: lesson.topic ?? null,
    homework: lesson.homework ?? null,
    meetingUrl: lesson.meetingUrl ?? null,
    meetingProvider: lesson.meetingProvider ?? null,
    group: lesson.group ?? null,
    attendances: (lesson.attendances ?? []).map((entry) => ({
      studentId: entry.studentId,
      // Non-null by construction: a register row always carries a status.
      status: toDomainAttendance(entry.status)!,
      homeworkDone: entry.homeworkDone,
    })),
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
