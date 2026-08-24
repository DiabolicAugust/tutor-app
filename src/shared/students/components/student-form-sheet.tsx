import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
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
type Draft = { name: string; subject: string; paidLessons: string };

const draftFor = (student: Student | null): Draft => ({
  name: student?.name ?? '',
  subject: student?.subject ?? '',
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

  const { name, subject, paidLessons } = current.draft;
  const set = (field: keyof Draft, value: string) =>
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
          subject: subject.trim(),
          paidLessonsLeft: Number(paidLessons) || 0,
        });
      } else {
        await addStudent(name, subject);
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

      <TextField
        testID="student-subject"
        label={t('studentsAdmin.subject')}
        value={subject}
        onChangeText={(value) => set('subject', value)}
        placeholder={t('studentsAdmin.subjectPlaceholder')}
      />

      {/* Only when editing: a new student has no balance yet, and a field
          starting at zero invites typing something meaningless. */}
      {student ? (
        <TextField
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
                label={t('studentsAdmin.removeCancel')}
                variant="ghost"
                onPress={() => setConfirmingRemoval(false)}
              />
              <Button
                label={t('common.delete')}
                variant="danger"
                loading={isSaving}
                onPress={() => void remove()}
              />
            </Animated.View>
          ) : (
            <Button
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
