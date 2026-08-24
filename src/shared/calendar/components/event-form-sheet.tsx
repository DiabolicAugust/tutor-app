import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAddons } from '@/shared/addons';
import { describeGroup, useGroups } from '@/shared/groups';
import { useFormat, useT } from '@/shared/i18n';
import { useLessons, type NewLesson } from '@/shared/lessons';
import { addDays, startOfDay } from '@/shared/lib/date';
import { useStudents } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { useOwnCalendarId } from '@/shared/tutors';
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
  const { ownStudents, find, addStudent, reload: reloadStudents } = useStudents();
  const { groups, reload: reloadGroups } = useGroups();
  const { has } = useAddons();
  const ownId = useOwnCalendarId();

  /** Whether this lesson is for one student or for a group. */
  const [taught, setTaught] = useState<'student' | 'group'>('student');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const [startMinutes, setStartMinutes] = useState(String(9 * 60));
  const [duration, setDuration] = useState('60');
  const [showError, setShowError] = useState(false);

  /**
   * Re-reads both lists when the sheet opens.
   *
   * A student added on another device — or by an admin, or on this device before
   * the roster last loaded — was otherwise invisible here, and the form insisted
   * there was nobody to book for. Cheap: two requests, only when somebody is
   * actually about to book.
   */
  useEffect(() => {
    if (!visible) return;
    void reloadStudents();
    void reloadGroups();
  }, [visible, reloadStudents, reloadGroups]);

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

  const selectGroup = (id: string) => {
    setGroupId(id);
    setShowError(false);
    setSubject(groups.find((group) => group.id === id)?.subject ?? '');
  };

  const reset = () => {
    setTaught('student');
    setGroupId(null);
    setStudentId(null);
    setAddingStudent(false);
    setNewStudentName('');
    setSubject('');
    setShowError(false);
  };

  const forGroup = taught === 'group';

  const handleCreate = async () => {
    const group = forGroup ? (groups.find((it) => it.id === groupId) ?? null) : null;

    // Either an existing student, or one created on the spot. Creating goes
    // through the API layer, so it has to be awaited before the lesson can
    // reference the new id.
    const resolvedId = forGroup
      ? null
      : addingStudent
        ? newStudentName.trim()
          ? (await addStudent(newStudentName, subject)).id
          : null
        : studentId;

    // Exactly one of the two, which is also what the server enforces.
    if (forGroup ? !group : !resolvedId) {
      setShowError(true);
      return;
    }

    const startsAt = addDays(baseDay, Number(dayOffset));
    startsAt.setHours(Math.floor(Number(startMinutes) / 60), Number(startMinutes) % 60, 0, 0);

    const draft: NewLesson = {
      // Always the tutor's own calendar — see the note above. The session's real
      // id: a fixture constant here put every new lesson on a calendar the grid
      // then filtered out, so booking appeared to do nothing.
      tutorId: ownId,
      studentId: resolvedId,
      group: group
        ? {
            id: group.id,
            name: group.name,
            subject: group.subject,
            level: group.level,
            // Carried so the new block can expand before anything is refetched.
            members: group.members.map((member) => ({
              student: { id: member.student.id, name: member.student.name },
            })),
          }
        : null,
      // Subject is optional in the form; the grid reads better with a fallback
      // than with an empty second line.
      subject: subject.trim() || t('lessons.title'),
      startsAt: startsAt.toISOString(),
      durationMinutes: Number(duration),
      status: 'scheduled',
      topic: null,
      homework: null,
      attendances: [],
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
      testID="event-sheet"
      footer={
        <Button
          testID="event-create"
          label={t('event.create')}
          fullWidth
          size="lg"
          onPress={() => void handleCreate()}
        />
      }
    >
      {/* Only offered when there is a group to book for. A school that teaches
          one-to-one only should not have to look past a control it never uses. */}
      {groups.length > 0 ? (
        <SegmentedControl
          testID="event-taught"
          options={[
            { value: 'student', label: t('event.forStudent') },
            { value: 'group', label: t('event.forGroup') },
          ]}
          value={taught}
          onChange={(value) => {
            setTaught(value);
            setShowError(false);
          }}
          accessibilityLabel={t('event.taught')}
        />
      ) : null}

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t(forGroup ? 'event.group' : 'event.student')}
        </Text>

        {forGroup ? (
          <View style={styles.students}>
            {groups.map((group, index) => (
              <ListRow
                key={group.id}
                testID={`event-group-${index}`}
                label={group.name}
                description={describeGroup(group)}
                value={t('groups.count', { count: group.members.length })}
                selectable
                selected={group.id === groupId}
                onPress={() => selectGroup(group.id)}
              />
            ))}

            {showError ? (
              <Text testID="event-error" variant="caption" color="danger">
                {t('event.missingGroup')}
              </Text>
            ) : null}
          </View>
        ) : addingStudent ? (
          <TextField
            testID="event-new-student-name"
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
            {ownStudents.map((student, index) => (
              <ListRow
                key={student.id}
                testID={`event-student-${index}`}
                label={student.name}
                description={student.subject}
                value={t('event.lessonsLeft', { count: student.paidLessonsLeft })}
                selectable
                selected={student.id === studentId}
                onPress={() => selectStudent(student.id)}
              />
            ))}

            {showError ? (
              <Text testID="event-error" variant="caption" color="danger">
                {t('event.missingStudent')}
              </Text>
            ) : null}
          </View>
        )}

        {/* Adding a student here is the same capability as adding one on the
            students screen, so it is gated the same way. Meaningless while
            booking for a group, whose membership is edited on the roster. */}
        {!forGroup && has('MANAGE_STUDENTS') ? (
          <Button
            testID="event-toggle-new-student"
            label={addingStudent ? t('event.pickExisting') : t('event.newStudent')}
            variant="ghost"
            onPress={() => {
              setAddingStudent(!addingStudent);
              setShowError(false);
            }}
          />
        ) : null}
      </View>

      <TextField
        testID="event-subject"
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
          testID="event-date"
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
          testID="event-time"
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
          testID="event-duration"
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
