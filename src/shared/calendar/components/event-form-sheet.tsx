import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useFormat, useT } from '@/shared/i18n';
import { useLessons, type NewLesson } from '@/shared/lessons';
import { addDays, startOfDay } from '@/shared/lib/date';
import { useStudents } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { ownCalendarId } from '@/shared/tutors';
import {
  Button,
  ChipGroup,
  ListRow,
  ModalSheet,
  SegmentedControl,
  Text,
  TextField,
} from '@/shared/ui';

import { timeGrid } from '../time-grid';

export type EventFormSheetProps = {
  visible: boolean;
  /** The day the sheet opens on — whatever the user was looking at. */
  initialDay: Date;
  onClose: () => void;
};

/** Days offered in the date row: a fortnight starting from the opened day. */
const DATE_RANGE = 14;
const SLOT_MINUTES = 30;
const DURATIONS = [30, 45, 60, 90] as const;

const useStyles = createStyles((t) => ({
  section: { gap: t.spacing.xs, paddingTop: t.spacing.xs },
  students: { gap: 0 },
}));

/**
 * New-lesson form.
 *
 * The student is **picked, not typed**: a student is an entity with a history
 * and a balance, and retyping a name every week invites typos that split one
 * student into several. Typing is still available for someone new, behind an
 * explicit "add student" step.
 *
 * Lessons always land on the tutor's own calendar. Colleagues' calendars are
 * visible for coordination, not for booking into — scheduling someone else's
 * time is a different feature with different rules.
 *
 * Everything else is a chip row or a segmented control: booking is picking from
 * a small set of sane options, and this works identically on all platforms with
 * no dependency.
 */
export function EventFormSheet({ visible, initialDay, onClose }: EventFormSheetProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const { addLesson } = useLessons();
  const { students, find, addStudent } = useStudents();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const [startMinutes, setStartMinutes] = useState(String(9 * 60));
  const [duration, setDuration] = useState('60');
  const [showError, setShowError] = useState(false);

  const baseDay = useMemo(() => startOfDay(initialDay), [initialDay]);

  const dateOptions = useMemo(
    () =>
      Array.from({ length: DATE_RANGE }, (_, index) => {
        const day = addDays(baseDay, index);
        return {
          value: String(index),
          label: String(day.getDate()),
          caption: format.weekday(day, 'short'),
        };
      }),
    [baseDay, format],
  );

  const timeOptions = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    for (let hour = timeGrid.startHour; hour < timeGrid.endHour; hour += 1) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        slots.push({
          value: String(hour * 60 + minute),
          label: format.time(new Date(2000, 0, 1, hour, minute)),
        });
      }
    }
    return slots;
  }, [format]);

  const durationOptions = DURATIONS.map((minutes) => ({
    value: String(minutes),
    label: t('event.minutes', { count: minutes }),
  }));

  const selectStudent = (id: string) => {
    setStudentId(id);
    setAddingStudent(false);
    setShowError(false);
    // Their usual subject is the likely answer; still editable below.
    setSubject(find(id)?.subject ?? '');
  };

  const reset = () => {
    setStudentId(null);
    setAddingStudent(false);
    setNewStudentName('');
    setSubject('');
    setShowError(false);
  };

  const handleCreate = () => {
    // Either an existing student, or one created on the spot.
    const resolvedId = addingStudent
      ? newStudentName.trim()
        ? addStudent(newStudentName, subject).id
        : null
      : studentId;

    if (!resolvedId) {
      setShowError(true);
      return;
    }

    const startsAt = addDays(baseDay, Number(dayOffset));
    startsAt.setHours(Math.floor(Number(startMinutes) / 60), Number(startMinutes) % 60, 0, 0);

    const draft: NewLesson = {
      // Always the tutor's own calendar — see the note above.
      tutorId: ownCalendarId,
      studentId: resolvedId,
      // Subject is optional in the form; the grid reads better with a fallback
      // than with an empty second line.
      subject: subject.trim() || t('lessons.title'),
      startsAt: startsAt.toISOString(),
      durationMinutes: Number(duration),
      status: 'scheduled',
    };

    addLesson(draft);
    reset();
    onClose();
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t('event.add')}
      footer={<Button label={t('event.create')} fullWidth size="lg" onPress={handleCreate} />}
    >
      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('event.student')}
        </Text>

        {addingStudent ? (
          <TextField
            label={t('event.newStudentName')}
            value={newStudentName}
            onChangeText={(value) => {
              setNewStudentName(value);
              if (showError) setShowError(false);
            }}
            placeholder={t('event.studentPlaceholder')}
            error={showError ? t('event.missingStudent') : undefined}
            autoCapitalize="words"
            autoFocus
          />
        ) : (
          <View style={styles.students}>
            {students.map((student) => (
              <ListRow
                key={student.id}
                label={student.name}
                description={student.subject}
                value={t('event.lessonsLeft', { count: student.paidLessonsLeft })}
                selectable
                selected={student.id === studentId}
                onPress={() => selectStudent(student.id)}
              />
            ))}

            {showError ? (
              <Text variant="caption" color="danger">
                {t('event.missingStudent')}
              </Text>
            ) : null}
          </View>
        )}

        <Button
          label={addingStudent ? t('event.pickExisting') : t('event.newStudent')}
          variant="ghost"
          onPress={() => {
            setAddingStudent(!addingStudent);
            setShowError(false);
          }}
        />
      </View>

      <TextField
        label={t('event.subject')}
        value={subject}
        onChangeText={setSubject}
        placeholder={t('event.subjectPlaceholder')}
      />

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('event.date')}
        </Text>
        <ChipGroup
          options={dateOptions}
          value={dayOffset}
          onChange={setDayOffset}
          accessibilityLabel={t('event.date')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('event.startTime')}
        </Text>
        <ChipGroup
          options={timeOptions}
          value={startMinutes}
          onChange={setStartMinutes}
          accessibilityLabel={t('event.startTime')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('event.duration')}
        </Text>
        <SegmentedControl
          options={durationOptions}
          value={duration}
          onChange={setDuration}
          accessibilityLabel={t('event.duration')}
        />
      </View>

      <Text variant="caption" color="textMuted">
        {t('event.ownCalendarNote')}
      </Text>
    </ModalSheet>
  );
}
