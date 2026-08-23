/**
 * The gradebook: what happened in a lesson, and how a student is doing.
 *
 * The one feature language schools name as most valuable once they have used a
 * system for a while — attendance, marks, lesson topics, homework, and the
 * average that falls out of them.
 */
export {
  attendanceKeys,
  attendanceOrder,
  attendanceShortKeys,
  isAttended,
  toDomainAttendance,
  toWireAttendance,
  type AttendanceStatus,
} from './attendance';
export {
  MAX_PERCENTAGE,
  byNewestGrade,
  formatGradeValue,
  gradeKindKeys,
  gradeKindOrder,
  type Grade,
  type GradeInput,
  type GradeKind,
  type GradeSubject,
} from './grade';
export { emptyProgress, type ProgressSummary } from './progress';
export type { GradebookClient, JournalInput } from './gradebook-client';
export { useLessonJournal, type JournalDraft } from './use-lesson-journal';
export { useGradesEnabled } from './use-grades-enabled';
export { useGradebook, useStudentProgress } from './use-student-gradebook';
export { AttendancePicker } from './components/attendance-picker';
export { GradeBadge } from './components/grade-badge';
export { GradeFormSheet } from './components/grade-form-sheet';
export { GradeSection } from './components/grade-section';
export { LessonJournalSheet } from './components/lesson-journal-sheet';
export { ProgressCard } from './components/progress-card';
