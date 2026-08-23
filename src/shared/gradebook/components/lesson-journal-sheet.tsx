import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { isGroupLesson, lessonStudentIds } from '@/shared/lessons';
import { NoteSection } from '@/shared/notes';
import { useStudents } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { Button, ModalSheet, Text, TextField } from '@/shared/ui';

import { useLessonJournal } from '../use-lesson-journal';
import { GradeSection } from './grade-section';
import { RegisterRow } from './register-row';

import type { Lesson } from '@/shared/lessons';

export type LessonJournalSheetProps = {
  /** The lesson to write up, or `null` to close. */
  lesson: Lesson | null;
  /** The sheet's title — who or what was taught, and when. */
  title: string;
  onClose: () => void;
  /**
   * Called with the updated lesson after a successful save, so the list behind
   * the sheet reflects the new status without refetching.
   */
  onSaved?: (lesson: Lesson) => void;
  /** Called after any gradebook write, so a progress card can refresh. */
  onChanged?: () => void;
};

/**
 * Writing up a lesson.
 *
 * The whole design target is one minute: the lesson has just ended, the tutor has
 * their phone out, and everything that has to be recorded is on this one sheet in
 * the order it comes to mind — who turned up, what was covered, what was set.
 *
 * A sheet rather than a screen, because writing up happens while looking at the
 * list of lessons, and pushing a screen means finding your place again afterwards.
 *
 * The register is first because it is the part that always gets filled in, and it
 * is the same component per student whether the lesson is one-to-one or a group of
 * eight. Marks and notes sit below the save button: worth having, and not what
 * makes somebody open this.
 */
export function LessonJournalSheet({
  lesson,
  title,
  onClose,
  onSaved,
  onChanged,
}: LessonJournalSheetProps) {
  const { t } = useT();
  const styles = useStyles();
  const { nameOf } = useStudents();
  const { draft, set, mark, setHomeworkDone, isDirty, isSaving, hasError, save } =
    useLessonJournal(lesson);

  const submit = async () => {
    const updated = await save();
    if (!updated) return;

    onSaved?.(updated);
    onChanged?.();
  };

  // A group's names come from the lesson itself, so the register is readable even
  // before the roster has loaded; a colleague's group would not be in it at all.
  const nameFromLesson = new Map(
    (lesson?.group?.members ?? []).map((member) => [
      member.student.id,
      member.student.name,
    ]),
  );

  const isGroup = lesson ? isGroupLesson(lesson) : false;
  const askHomework = draft.homework.trim().length > 0;

  return (
    <ModalSheet
      visible={lesson !== null}
      onClose={onClose}
      title={title}
      footer={
        <Button
          label={t('gradebook.journal.save')}
          onPress={() => void submit()}
          loading={isSaving}
          // Nothing to send is not a failure; the button simply has no work.
          disabled={!isDirty}
          fullWidth
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text variant="label">
            {t(isGroup ? 'gradebook.journal.register' : 'gradebook.journal.attendance')}
          </Text>

          {draft.register.length === 0 ? (
            <Text variant="bodySm" color="textMuted">
              {t('gradebook.journal.registerEmpty')}
            </Text>
          ) : (
            draft.register.map((line) => (
              <RegisterRow
                key={line.studentId}
                line={line}
                name={nameFromLesson.get(line.studentId) ?? nameOf(line.studentId)}
                showName={isGroup}
                askHomework={askHomework}
                onMark={(status) => mark(line.studentId, status)}
                onHomeworkDone={(done) => setHomeworkDone(line.studentId, done)}
              />
            ))
          )}

          <Text variant="caption" color="textMuted">
            {t('gradebook.journal.attendanceHint')}
          </Text>
        </View>

        <TextField
          label={t('gradebook.journal.topic')}
          value={draft.topic}
          onChangeText={(value) => set('topic', value)}
          placeholder={t('gradebook.journal.topicHint')}
          multiline
        />

        <TextField
          label={t('gradebook.journal.homework')}
          value={draft.homework}
          onChangeText={(value) => set('homework', value)}
          placeholder={t('gradebook.journal.homeworkHint')}
          multiline
        />

        {hasError ? (
          <Text variant="bodySm" color="danger">
            {t('gradebook.journal.failed')}
          </Text>
        ) : null}
      </View>

      {/* Marks on a group lesson have to name a student, so the section is only
          offered where it can do that unambiguously. Marking an individual
          student in a group happens from their own page. */}
      {lesson && !isGroup && lessonStudentIds(lesson).length === 1 ? (
        <GradeSection
          subject={{ kind: 'lesson', id: lesson.id }}
          title={t('gradebook.journal.marks')}
          emptyHint={t('gradebook.journal.marksEmpty')}
          onChanged={onChanged}
        />
      ) : null}

      <NoteSection
        subject={lesson ? { kind: 'lesson', id: lesson.id } : null}
        title={t('notes.lessonTitle')}
        emptyHint={t('notes.lessonEmpty')}
      />
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  form: { gap: t.spacing.md, paddingBottom: t.spacing.md },
  field: { gap: t.spacing.sm },
}));
