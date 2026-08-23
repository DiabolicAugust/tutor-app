import { fixtures } from '@/shared/fixtures';

import { isAttended, type AttendanceStatus } from './attendance';
import type { Grade, GradeInput, GradeSubject } from './grade';
import type {
  AttendanceMark,
  GradebookClient,
  JournalInput,
} from './gradebook-client';
import { emptyProgress, type GradeAverage, type ProgressSummary } from './progress';

import {
  lessonStudentIds,
  type Lesson,
  type LessonAttendance,
} from '@/shared/lessons/lesson';

/**
 * Fixture-backed gradebook.
 *
 * Writes are kept in memory so the flow is genuinely exercisable in a test
 * build — mark a lesson, add a mark, watch the average move. Nothing survives a
 * reload, which is the honest behaviour with no server to store it.
 *
 * The arithmetic below deliberately mirrors the server's `progress.ts` rather
 * than sharing it: the server is authoritative for the real app, and a fixture
 * build must not be the reason a production calculation lives on the client.
 */

/** Journal fields written this session, by lesson id. */
const journals = new Map<string, JournalInput>();
/** Marks added this session, by student id. */
const added = new Map<string, Grade[]>();
let localId = 0;

function lessonById(id: string): Lesson | undefined {
  return fixtures.lessons.find((lesson) => lesson.id === id);
}

/** The fixture lesson with this session's write-up applied over it. */
function withJournal(lesson: Lesson): Lesson {
  const journal = journals.get(lesson.id);
  if (!journal) return lesson;

  const attendances = mergeRegister(lesson.attendances ?? [], journal.attendance);

  return {
    ...lesson,
    topic: journal.topic?.trim() ? journal.topic.trim() : (lesson.topic ?? null),
    homework: journal.homework?.trim()
      ? journal.homework.trim()
      : (lesson.homework ?? null),
    attendances,
    status: journal.status ?? statusFor(attendances) ?? lesson.status,
  };
}

/**
 * The register with this session's marks laid over it.
 *
 * A mark that omits `homeworkDone` keeps whatever was there, matching the
 * server: marking attendance must not wipe a homework check made a week later.
 */
function mergeRegister(
  existing: readonly LessonAttendance[],
  marks: readonly AttendanceMark[] | undefined,
): LessonAttendance[] {
  if (!marks?.length) return [...existing];

  const merged = new Map(existing.map((entry) => [entry.studentId, entry]));
  for (const mark of marks) {
    const previous = merged.get(mark.studentId);
    merged.set(mark.studentId, {
      studentId: mark.studentId,
      status: mark.status,
      homeworkDone: mark.homeworkDone ?? previous?.homeworkDone ?? null,
    });
  }

  return [...merged.values()];
}

/**
 * The same rule the server applies, for the same reasons: anybody charged means
 * the lesson happened, everybody excused means it did not.
 */
function statusFor(
  register: readonly LessonAttendance[],
): Lesson['status'] | undefined {
  if (register.length === 0) return undefined;
  return register.some((entry) => entry.status !== 'absentExcused')
    ? 'completed'
    : 'cancelled';
}

function gradesFor(studentId: string): Grade[] {
  const seeded = fixtures.grades.filter((grade) => grade.studentId === studentId);
  return [...(added.get(studentId) ?? []), ...seeded];
}

function averageOf(grades: readonly Grade[]): GradeAverage | null {
  let weighted = 0;
  let weight = 0;
  let count = 0;

  for (const grade of grades) {
    if (grade.value === null || grade.weight <= 0) continue;
    weighted += grade.value * grade.weight;
    weight += grade.weight;
    count += 1;
  }

  if (weight === 0) return null;
  return { average: Math.round((weighted / weight) * 100) / 100, count };
}

export const mockGradebookClient: GradebookClient = {
  async writeJournal(lessonId, input) {
    const lesson = lessonById(lessonId);
    if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`);

    journals.set(lessonId, { ...journals.get(lessonId), ...input });
    return withJournal(lesson);
  },

  async listGrades(subject: GradeSubject) {
    if (subject.kind === 'student') return gradesFor(subject.id);

    const lesson = lessonById(subject.id);
    if (!lesson) return [];

    // A group lesson's marks belong to several students, so they are gathered
    // from each member rather than from one.
    return lessonStudentIds(lesson)
      .flatMap(gradesFor)
      .filter((grade) => grade.lessonId === subject.id);
  },

  async addGrade(subject, input: GradeInput) {
    const studentId =
      subject.kind === 'student'
        ? subject.id
        : // On a group lesson the caller names the student, exactly as the API
          // requires; on a one-to-one lesson the lesson answers for itself.
          (input.studentId ?? lessonById(subject.id)?.studentId);
    if (!studentId) throw new Error('Unknown subject');

    localId += 1;
    const grade: Grade = {
      id: `local-grade-${localId}`,
      kind: input.kind,
      value: input.kind === 'descriptive' ? null : (input.value ?? null),
      category: input.category?.trim() || null,
      comment: input.comment?.trim() || null,
      weight: input.weight ?? 1,
      createdAt: new Date().toISOString(),
      studentId,
      lessonId: subject.kind === 'lesson' ? subject.id : null,
      author: { id: 'me', name: fixtures.ownName },
    };

    added.set(studentId, [grade, ...(added.get(studentId) ?? [])]);
    return grade;
  },

  async updateGrade(id, input) {
    for (const [studentId, grades] of added) {
      const existing = grades.find((grade) => grade.id === id);
      if (!existing) continue;

      const updated: Grade = {
        ...existing,
        kind: input.kind,
        value: input.kind === 'descriptive' ? null : (input.value ?? null),
        category: input.category?.trim() || null,
        comment: input.comment?.trim() || null,
        weight: input.weight ?? 1,
      };
      added.set(
        studentId,
        grades.map((grade) => (grade.id === id ? updated : grade)),
      );
      return updated;
    }

    // Seeded fixtures are read-only here; the server allows the edit, and a
    // fixture build pretending to persist it would be the misleading answer.
    throw new Error('Only marks added in this session can be changed offline');
  },

  async removeGrade(id) {
    for (const [studentId, grades] of added) {
      added.set(
        studentId,
        grades.filter((grade) => grade.id !== id),
      );
    }
  },

  async progress(studentId) {
    // Group lessons count too: from a student's side there is no difference
    // between being taught alone and being taught with four others.
    const lessons = fixtures.lessons
      .map(withJournal)
      .filter((lesson) => lessonStudentIds(lesson).includes(studentId));

    const grades = gradesFor(studentId);
    if (lessons.length === 0 && grades.length === 0) return emptyProgress;

    // Their own lines only: a group lesson holds the whole room's register.
    const register = lessons.flatMap((lesson) =>
      (lesson.attendances ?? []).filter((entry) => entry.studentId === studentId),
    );

    const countAttendance = (status: AttendanceStatus) =>
      register.filter((entry) => entry.status === status).length;

    const present = countAttendance('present');
    const late = countAttendance('late');
    const absentExcused = countAttendance('absentExcused');
    const absentUnexcused = countAttendance('absentUnexcused');
    const marked = present + late + absentExcused + absentUnexcused;
    const attended = register.filter((entry) => isAttended(entry.status)).length;

    const summary: ProgressSummary = {
      lessons: {
        total: lessons.length,
        completed: lessons.filter((lesson) => lesson.status === 'completed').length,
        cancelled: lessons.filter((lesson) => lesson.status === 'cancelled').length,
        scheduled: lessons.filter((lesson) => lesson.status === 'scheduled').length,
      },
      attendance: {
        present,
        late,
        absentExcused,
        absentUnexcused,
        marked,
        rate: marked === 0 ? null : Math.round((attended / marked) * 100) / 100,
      },
      grades: {
        count: grades.length,
        classic: averageOf(grades.filter((grade) => grade.kind === 'classic')),
        percentage: averageOf(grades.filter((grade) => grade.kind === 'percentage')),
        descriptiveCount: grades.filter((grade) => grade.kind === 'descriptive').length,
      },
    };

    return summary;
  },
};
