import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { SubjectPicker } from '@/shared/subjects';
import { createStyles } from '@/shared/theme';
import { Button, ModalSheet, Text, TextField, motion } from '@/shared/ui';

import type { Student } from '../student';
import { useStudents } from '../students-store';

export type StudentFormSheetProps = {
  /**
   * `null` closes the sheet; `{ student: null }` opens it for a new student.
   *
   * Callers should give this component a `key` derived from the student, so
   * opening it on somebody else remounts it. That is what resets the fields —
   * see the note on the state below.
   */
  editing: { student: Student | null } | null;
  onClose: () => void;
  /** Called after a student is removed, so the caller can leave their screen. */
  onRemoved?: () => void;
};

/**
 * Add, edit or remove a student.
 *
 * Extracted because two screens need it — the roster, for adding, and a
 * student's own page, for editing them. A second copy of a form with a
 * destructive action in it is how the two versions end up disagreeing about what
 * removal warns you about.
 */
/** The fields, as one value so reseeding them is one assignment. */
type Draft = { name: string; subjectId: string | null; paidLessons: string };

const draftFor = (student: Student | null): Draft => ({
  name: student?.name ?? '',
  subjectId: student?.subject?.id ?? null,
  paidLessons: String(student?.paidLessonsLeft ?? 0),
});

export function StudentFormSheet({ editing, onClose, onRemoved }: StudentFormSheetProps) {
  const { t } = useT();
  const styles = useStyles();
  const { addStudent, updateStudent, removeStudent } = useStudents();

  const student = editing?.student ?? null;

  /**
   * Reseeded whenever the sheet is pointed at a different subject — including at
   * "nobody", which is what adding a student is.
   *
   * A `key` on the caller was not enough: for a new student that key is the
   * constant `'new'`, so React kept this component and its state across opens
   * and the next "add student" arrived pre-filled with the last one's name.
   *
   * Adjusted during render rather than in an effect, so the stale values are
   * never painted — an effect runs after a frame has already shown them.
   */
  const key = editing ? (student?.id ?? 'new') : null;
  const [state, setState] = useState(() => ({ key, draft: draftFor(student) }));
  const current = state.key === key ? state : { key, draft: draftFor(student) };
  if (state.key !== key) setState(current);

  const { name, subjectId, paidLessons } = current.draft;
  const set = <K extends keyof Draft>(field: K, value: Draft[K]) =>
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));

  const [showNameError, setShowNameError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const save = async () => {
    if (name.trim().length < 1) {
      setShowNameError(true);
      return;
    }

    setIsSaving(true);
    setFailed(false);
    try {
      if (student) {
        await updateStudent(student.id, {
          name: name.trim(),
          // Sent even when unchanged, and `null` when cleared: the form owns the
          // whole record while it is open, so "not mentioned" would mean this
          // field could never be emptied.
          subjectId,
          paidLessonsLeft: Number(paidLessons) || 0,
        });
      } else {
        await addStudent(name, subjectId);
      }
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!student) return;

    setIsSaving(true);
    try {
      await removeStudent(student.id);
      onClose();
      onRemoved?.();
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalSheet
      visible={editing !== null}
      onClose={onClose}
      title={student ? t('studentsAdmin.edit') : t('studentsAdmin.add')}
      testID="student-sheet"
      footer={
        <Button
          testID="student-save"
          label={t('studentsAdmin.save')}
          fullWidth
          size="lg"
          loading={isSaving}
          onPress={() => void save()}
        />
      }
    >
      <TextField
        testID="student-name"
        label={t('studentsAdmin.name')}
        value={name}
        onChangeText={(value) => {
          set('name', value);
          setShowNameError(false);
        }}
        placeholder={t('studentsAdmin.namePlaceholder')}
        error={
          showNameError
            ? t('studentsAdmin.nameRequired')
            : failed
              ? t('studentsAdmin.failed')
              : undefined
        }
        autoCapitalize="words"
        autoFocus
      />

      <SubjectPicker
        testID="student-subject"
        label={t('studentsAdmin.subject')}
        value={subjectId}
        onChange={(next) => set('subjectId', next)}
        // Offered even if the school has retired it, so editing this student's
        // name does not quietly move them off it.
        current={student?.subject ?? null}
      />

      {/* Only when editing: a new student has no balance yet, and a field
          starting at zero invites typing something meaningless. */}
      {student ? (
        <TextField
          testID="student-paid-lessons"
          label={t('studentsAdmin.paidLessons')}
          value={paidLessons}
          onChangeText={(value) => set('paidLessons', value)}
          keyboardType="number-pad"
        />
      ) : null}

      {student ? (
        <View style={styles.removal}>
          {confirmingRemoval ? (
            <Animated.View entering={motion.messageEnter()} style={styles.removalRow}>
              <Text variant="bodySm" color="danger" style={styles.removalText}>
                {t('studentsAdmin.removeConfirm', { name: student.name })}
              </Text>
              <Button
                testID="student-remove-cancel"
                label={t('studentsAdmin.removeCancel')}
                variant="ghost"
                onPress={() => setConfirmingRemoval(false)}
              />
              <Button
                testID="student-remove-confirm"
                label={t('common.delete')}
                variant="danger"
                loading={isSaving}
                onPress={() => void remove()}
              />
            </Animated.View>
          ) : (
            <Button
              testID="student-remove"
              label={t('studentsAdmin.remove')}
              variant="ghost"
              onPress={() => setConfirmingRemoval(true)}
            />
          )}
        </View>
      ) : null}
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  removal: { paddingTop: t.spacing.md, gap: t.spacing.sm },
  removalRow: { gap: t.spacing.sm },
  removalText: { paddingBottom: t.spacing.xs },
}));
