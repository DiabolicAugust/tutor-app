import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAddons } from '@/shared/addons';
import { useCurrentUser } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { useStudents, type Student } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { ownCalendarId } from '@/shared/tutors';
import { Button, Card, ListRow, ModalSheet, Text, TextField, motion } from '@/shared/ui';

/** Blank means "new"; a student means "edit that one". */
type Editing = { student: Student | null } | null;

/**
 * Student management, behind the `MANAGE_STUDENTS` capability.
 *
 * A tutor sees and edits their own; an admin holds every capability and the
 * server hands them the whole school, so the same screen serves both without a
 * branch — the list is simply longer.
 *
 * Rows the caller may not edit are still shown, because the calendar shows those
 * students' lessons and a roster that hides half of them would be confusing.
 * They are just not openable.
 */
export default function StudentsScreen() {
  const { t } = useT();
  const styles = useStyles();
  const user = useCurrentUser();
  const { has } = useAddons();
  const { students, isLoading, addStudent, updateStudent, removeStudent } = useStudents();

  const [editing, setEditing] = useState<Editing>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [paidLessons, setPaidLessons] = useState('0');
  const [showNameError, setShowNameError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const canManage = has('MANAGE_STUDENTS');
  const isAdmin = user.role === 'admin';

  /** An admin may edit anyone; a tutor only the students they teach. */
  const mayEdit = (student: Student) => canManage && (isAdmin || student.tutorId === ownCalendarId);

  const open = (student: Student | null) => {
    setEditing({ student });
    setName(student?.name ?? '');
    setSubject(student?.subject ?? '');
    setPaidLessons(String(student?.paidLessonsLeft ?? 0));
    setShowNameError(false);
    setFailed(false);
    setConfirmingRemoval(false);
  };

  const close = () => setEditing(null);

  const save = async () => {
    if (name.trim().length < 1) {
      setShowNameError(true);
      return;
    }

    setIsSaving(true);
    setFailed(false);
    try {
      if (editing?.student) {
        await updateStudent(editing.student.id, {
          name: name.trim(),
          subject: subject.trim(),
          paidLessonsLeft: Number(paidLessons) || 0,
        });
      } else {
        await addStudent(name, subject);
      }
      close();
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!editing?.student) return;

    setIsSaving(true);
    try {
      await removeStudent(editing.student.id);
      close();
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {students.length === 0 && !isLoading ? (
          <Card style={styles.empty}>
            <Text variant="titleSm">{t('studentsAdmin.empty')}</Text>
            <Text variant="bodySm" color="textSecondary" style={styles.centered}>
              {t('studentsAdmin.emptyHint')}
            </Text>
          </Card>
        ) : (
          <Card>
            {isLoading ? (
              <Text color="textSecondary">{t('common.loading')}</Text>
            ) : (
              students.map((student) => (
                <Animated.View key={student.id} layout={motion.listReflow()}>
                  <ListRow
                    label={student.name}
                    description={student.subject}
                    value={t('event.lessonsLeft', { count: student.paidLessonsLeft })}
                    onPress={mayEdit(student) ? () => open(student) : undefined}
                  />
                </Animated.View>
              ))
            )}
          </Card>
        )}

        {canManage ? (
          <>
            <Button label={t('studentsAdmin.add')} fullWidth onPress={() => open(null)} />
            {!isAdmin ? (
              <Text variant="caption" color="textMuted">
                {t('studentsAdmin.ownOnly')}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={editing !== null}
        onClose={close}
        title={editing?.student ? t('studentsAdmin.edit') : t('studentsAdmin.add')}
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

        {/* Only when editing: a new student has no balance to set yet, and a
            field starting at zero invites typing something meaningless. */}
        {editing?.student ? (
          <TextField
            label={t('studentsAdmin.paidLessons')}
            value={paidLessons}
            onChangeText={setPaidLessons}
            keyboardType="number-pad"
          />
        ) : null}

        {editing?.student ? (
          <View style={styles.removal}>
            {confirmingRemoval ? (
              <Animated.View entering={motion.messageEnter()} style={styles.removalRow}>
                <Text variant="bodySm" color="danger" style={styles.removalText}>
                  {t('studentsAdmin.removeConfirm', { name: editing.student.name })}
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
    </>
  );
}

const useStyles = createStyles((t) => ({
  content: {
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  empty: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl },
  centered: { textAlign: 'center' },
  removal: { paddingTop: t.spacing.md, gap: t.spacing.sm },
  removalRow: { gap: t.spacing.sm },
  removalText: { paddingBottom: t.spacing.xs },
}));
