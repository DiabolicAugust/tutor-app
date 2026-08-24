import { http } from '@/shared/api/http';

import {
  toDomainAttendance,
  toWireAttendance,
  type AttendanceStatus,
  type WireAttendance,
} from './attendance';
import type { Grade, GradeInput, GradeKind, GradeSubject } from './grade';
import type { ProgressSummary } from './progress';

import type { Lesson, LessonStatus } from '@/shared/lessons/lesson';
import type { Subject } from '@/shared/subjects/subject';

/** One student's line, as a write-up sends it. */
export type AttendanceMark = {
  studentId: string;
  status: AttendanceStatus;
  /** Tri-state; omitted leaves it alone, which is how "unchecked" is preserved. */
  homeworkDone?: boolean;
};

/**
 * What one write-up changes.
 *
 * `attendance` is a list even for a one-to-one lesson, so there is one shape
 * rather than two — special-casing the individual case would be a second code
 * path to keep in step for no gain.
 */
export type JournalInput = {
  topic?: string;
  homework?: string;
  attendance?: AttendanceMark[];
  status?: LessonStatus;
};

/**
 * The seam for the gradebook.
 *
 * `writeJournal` is one method rather than three, because writing up a lesson is
 * one action. The whole reason a tutor does this on a phone is that the lesson
 * has just ended and they have a minute — three requests is three chances to
 * half-save, and the version that gets abandoned.
 */
export type GradebookClient = {
  writeJournal: (lessonId: string, input: JournalInput) => Promise<Lesson>;
  listGrades: (subject: GradeSubject) => Promise<Grade[]>;
  addGrade: (subject: GradeSubject, input: GradeInput) => Promise<Grade>;
  updateGrade: (id: string, input: GradeInput) => Promise<Grade>;
  removeGrade: (id: string) => Promise<void>;
  progress: (studentId: string) => Promise<ProgressSummary>;
};

type WireKind = 'CLASSIC' | 'PERCENTAGE' | 'DESCRIPTIVE';

type WireGrade = Omit<Grade, 'kind'> & { kind: WireKind };

type WireLesson = {
  id: string;
  tutorId: string;
  subject: Subject | null;
  startsAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  topic: string | null;
  homework: string | null;
  studentId: string | null;
  group: WireGroup | null;
  attendances: WireAttendance_[];
};

type WireGroup = {
  id: string;
  name: string;
  subject: Subject | null;
  level: string | null;
  members: { student: { id: string; name: string } }[];
};

type WireAttendance_ = {
  studentId: string;
  status: WireAttendance;
  homeworkDone: boolean | null;
};

const toDomainKind = (kind: WireKind): GradeKind => kind.toLowerCase() as GradeKind;
const toWireKind = (kind: GradeKind): WireKind => kind.toUpperCase() as WireKind;

const toDomainGrade = (wire: WireGrade): Grade => ({
  ...wire,
  kind: toDomainKind(wire.kind),
});

const toWireGrade = (input: GradeInput) => ({
  ...input,
  kind: toWireKind(input.kind),
});

const toDomainLesson = (wire: WireLesson): Lesson => ({
  id: wire.id,
  tutorId: wire.tutorId,
  studentId: wire.studentId,
  group: wire.group,
  subject: wire.subject,
  startsAt: wire.startsAt,
  durationMinutes: wire.durationMinutes,
  status: wire.status.toLowerCase() as LessonStatus,
  topic: wire.topic,
  homework: wire.homework,
  attendances: (wire.attendances ?? []).map((entry) => ({
    studentId: entry.studentId,
    // Non-null by construction: a register row always has a status, unlike the
    // nullable column this replaced.
    status: toDomainAttendance(entry.status)!,
    homeworkDone: entry.homeworkDone,
  })),
});

const gradesPath = (subject: GradeSubject): string =>
  subject.kind === 'student'
    ? `/students/${subject.id}/grades`
    : `/lessons/${subject.id}/grades`;

export const httpGradebookClient: GradebookClient = {
  async writeJournal(lessonId, input) {
    const wire = await http.patch<WireLesson>(`/lessons/${lessonId}/journal`, {
      ...input,
      ...(input.attendance
        ? {
            attendance: input.attendance.map((mark) => ({
              ...mark,
              status: toWireAttendance(mark.status),
            })),
          }
        : {}),
      ...(input.status ? { status: input.status.toUpperCase() } : {}),
    });
    return toDomainLesson(wire);
  },

  async listGrades(subject) {
    const wire = await http.get<WireGrade[]>(gradesPath(subject));
    return wire.map(toDomainGrade);
  },

  async addGrade(subject, input) {
    return toDomainGrade(await http.post<WireGrade>(gradesPath(subject), toWireGrade(input)));
  },

  // `PUT`, not `PATCH`: a correction replaces the mark whole, because changing
  // the kind changes which of its fields mean anything.
  async updateGrade(id, input) {
    return toDomainGrade(await http.put<WireGrade>(`/grades/${id}`, toWireGrade(input)));
  },

  async removeGrade(id) {
    await http.delete<void>(`/grades/${id}`);
  },

  progress: (studentId) => http.get<ProgressSummary>(`/students/${studentId}/progress`),
};
