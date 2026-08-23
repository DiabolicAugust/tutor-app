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
export function StudentFormSheet({ editing, onClose, onRemoved }: StudentFormSheetProps) {
  const { t } = useT();
  const styles = useStyles();
  const { addStudent, updateStudent, removeStudent } = useStudents();

  const student = editing?.student ?? null;

  // Initialised from the student, never re-synced. Resetting the fields when the
  // sheet opens on somebody else is the caller's `key`, not an effect here: an
  // effect that writes state has to render once with the wrong values first,
  // which is a visible flash of the previous student's name.
  const [name, setName] = useState(student?.name ?? '');
  const [subject, setSubject] = useState(student?.subject ?? '');
  const [paidLessons, setPaidLessons] = useState(String(student?.paidLessonsLeft ?? 0));
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
          label={t('studentsAdmin.save')}
          fullWidth
          size="lg"
          loading={isSaving}
          onPress={() => void save()}
        />
      }
    >
      <TextField
        label={t('studentsAdmin.name')}
        value={name}
        onChangeText={(value) => {
          setName(value);
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
        label={t('studentsAdmin.subject')}
        value={subject}
        onChangeText={setSubject}
        placeholder={t('studentsAdmin.subjectPlaceholder')}
      />

      {/* Only when editing: a new student has no balance yet, and a field
          starting at zero invites typing something meaningless. */}
      {student ? (
        <TextField
          label={t('studentsAdmin.paidLessons')}
          value={paidLessons}
          onChangeText={setPaidLessons}
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
