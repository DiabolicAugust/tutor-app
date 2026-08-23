import { useCallback, useState } from 'react';

import { apiClients } from '@/shared/api';

import type { AttendanceStatus } from './attendance';
import type {
  AttendanceMark,
  GradebookClient,
  JournalInput,
} from './gradebook-client';

import {
  lessonStudentIds,
  type Lesson,
  type LessonAttendance,
} from '@/shared/lessons/lesson';

/** One student's line as the sheet edits it, before it is sent. */
export type RegisterLine = {
  studentId: string;
  /** Null while nobody has been marked — the sheet renders no selection. */
  status: AttendanceStatus | null;
  /** Tri-state: null is "nobody has checked", not "not done". */
  homeworkDone: boolean | null;
};

/** The draft a write-up sheet edits. */
export type JournalDraft = {
  topic: string;
  homework: string;
  /**
   * One line per student the lesson is for — one for an individual lesson, one
   * per member for a group.
   *
   * A list even in the individual case, so the sheet has one shape to render
   * rather than two, and the group case is not a special path bolted on later.
   */
  register: RegisterLine[];
};

export type LessonJournalState = {
  draft: JournalDraft;
  /** Patches `topic` or `homework`. Merged, so callers never rebuild the draft. */
  set: (key: 'topic' | 'homework', value: string) => void;
  /** Marks one student. */
  mark: (studentId: string, status: AttendanceStatus) => void;
  /** Records whether one student's homework came back. */
  setHomeworkDone: (studentId: string, done: boolean | null) => void;
  /** True once the draft differs from what the lesson already says. */
  isDirty: boolean;
  isSaving: boolean;
  hasError: boolean;
  /** Sends the whole draft in one request. Resolves to the updated lesson. */
  save: () => Promise<Lesson | null>;
};

const lineFor = (
  studentId: string,
  existing: LessonAttendance | undefined,
): RegisterLine => ({
  studentId,
  status: existing?.status ?? null,
  homeworkDone: existing?.homeworkDone ?? null,
});

function draftFrom(lesson: Lesson | null): JournalDraft {
  if (!lesson) return { topic: '', homework: '', register: [] };

  const marked = new Map(
    (lesson.attendances ?? []).map((entry) => [entry.studentId, entry]),
  );

  return {
    topic: lesson.topic ?? '',
    homework: lesson.homework ?? '',
    // Ordered by the lesson's own membership, so the register reads the same way
    // twice — the server returns marks in name order, but unmarked students have
    // no row to order by.
    register: lessonStudentIds(lesson).map((studentId) =>
      lineFor(studentId, marked.get(studentId)),
    ),
  };
}

/** The draft, plus which lesson it was seeded from. */
type Seeded = { key: string | null; draft: JournalDraft; hasError: boolean };

const seed = (lesson: Lesson | null): Seeded => ({
  key: lesson?.id ?? null,
  draft: draftFrom(lesson),
  hasError: false,
});

/**
 * The write-up for one lesson.
 *
 * Seeded from the lesson the caller already has rather than fetched: the sheet is
 * opened from a list that has just rendered these exact fields, and a request to
 * re-read them would mean a spinner over data already on screen. A group lesson
 * carries its members with it for the same reason.
 *
 * The draft is local until `save`, which sends everything in a single request.
 * That is the point of the feature — the tutor has a minute between lessons, and
 * a field that saves itself on blur is a field that half-saves when the phone
 * loses signal in a stairwell.
 */
export function useLessonJournal(
  lesson: Lesson | null,
  client: GradebookClient = apiClients.gradebook,
): LessonJournalState {
  const [state, setState] = useState<Seeded>(() => seed(lesson));
  const [isSaving, setIsSaving] = useState(false);

  const lessonId = lesson?.id ?? null;

  // Reset when the sheet is pointed at a different lesson. Adjusted during
  // render rather than in an effect: an effect runs *after* a paint, so the
  // previous lesson's write-up would be visible for a frame in somebody else's
  // sheet — and React Compiler rightly refuses synchronous setState in effects.
  //
  // Keyed on the id rather than the object, so a re-rendered parent does not
  // discard what is being typed.
  const current = state.key === lessonId ? state : seed(lesson);
  if (state.key !== lessonId) setState(current);

  const set = useCallback((key: 'topic' | 'homework', value: string) => {
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [key]: value },
    }));
  }, []);

  const patchLine = useCallback(
    (studentId: string, patch: Partial<Omit<RegisterLine, 'studentId'>>) => {
      setState((previous) => ({
        ...previous,
        draft: {
          ...previous.draft,
          register: previous.draft.register.map((line) =>
            line.studentId === studentId ? { ...line, ...patch } : line,
          ),
        },
      }));
    },
    [],
  );

  const mark = useCallback(
    (studentId: string, status: AttendanceStatus) => patchLine(studentId, { status }),
    [patchLine],
  );

  const setHomeworkDone = useCallback(
    (studentId: string, homeworkDone: boolean | null) =>
      patchLine(studentId, { homeworkDone }),
    [patchLine],
  );

  const original = draftFrom(lesson);
  const { draft } = current;
  const isDirty =
    draft.topic.trim() !== original.topic.trim() ||
    draft.homework.trim() !== original.homework.trim() ||
    draft.register.some((line, index) => {
      const before = original.register[index];
      return line.status !== before?.status || line.homeworkDone !== before?.homeworkDone;
    });

  const save = useCallback(async (): Promise<Lesson | null> => {
    if (!lesson) return null;

    setIsSaving(true);
    setState((previous) => ({ ...previous, hasError: false }));
    try {
      const attendance: AttendanceMark[] = draft.register
        // Unmarked students are left out entirely, so saving a topic does not
        // silently mark a register nobody filled in.
        .filter(
          (line): line is RegisterLine & { status: AttendanceStatus } =>
            line.status !== null,
        )
        .map((line) => ({
          studentId: line.studentId,
          status: line.status,
          ...(line.homeworkDone === null ? {} : { homeworkDone: line.homeworkDone }),
        }));

      const input: JournalInput = {
        topic: draft.topic,
        homework: draft.homework,
        ...(attendance.length > 0 ? { attendance } : {}),
      };
      return await client.writeJournal(lesson.id, input);
    } catch {
      setState((previous) => ({ ...previous, hasError: true }));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [client, lesson, draft]);

  return {
    draft,
    set,
    mark,
    setHomeworkDone,
    isDirty,
    isSaving,
    hasError: current.hasError,
    save,
  };
}
