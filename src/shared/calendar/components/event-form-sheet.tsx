import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useFormat, useT } from '@/shared/i18n';
import { useLessons, type NewLesson } from '@/shared/lessons';
import { addDays, startOfDay } from '@/shared/lib/date';
import { createStyles, useTheme } from '@/shared/theme';
import { calendarOwners, ownCalendarId } from '@/shared/tutors';
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
  field: { gap: t.spacing.xs },
  section: { gap: t.spacing.xs, paddingTop: t.spacing.xs },
}));

/**
 * New-lesson form.
 *
 * Every input is a chip row or a segmented control rather than a free-text or
 * native picker: scheduling a lesson is picking from a small set of sane
 * options, and this way the same UI works on all three platforms with no
 * dependency. The only typed fields are the ones that are genuinely free —
 * who the lesson is with, and what it covers.
 */
export function EventFormSheet({ visible, initialDay, onClose }: EventFormSheetProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const { eventColors } = useTheme();
  const { addLesson } = useLessons();

  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const [startMinutes, setStartMinutes] = useState(String(9 * 60));
  const [duration, setDuration] = useState('60');
  const [tutorId, setTutorId] = useState(ownCalendarId);
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

  const reset = () => {
    setStudentName('');
    setSubject('');
    setShowError(false);
  };

  const handleCreate = () => {
    if (!studentName.trim()) {
      setShowError(true);
      return;
    }

    const startsAt = addDays(baseDay, Number(dayOffset));
    startsAt.setHours(Math.floor(Number(startMinutes) / 60), Number(startMinutes) % 60, 0, 0);

    const draft: NewLesson = {
      tutorId,
      studentName: studentName.trim(),
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
      <TextField
        label={t('event.student')}
        value={studentName}
        onChangeText={(value) => {
          setStudentName(value);
          if (showError) setShowError(false);
        }}
        placeholder={t('event.studentPlaceholder')}
        error={showError ? t('event.missingStudent') : undefined}
        autoCapitalize="words"
      />

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

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('event.calendar')}
        </Text>
        {calendarOwners.map((tutor) => (
          <ListRow
            key={tutor.id}
            label={tutor.name}
            description={tutor.speciality}
            swatchColor={eventColors[tutor.colorIndex % eventColors.length].solid}
            selectable
            selected={tutor.id === tutorId}
            onPress={() => setTutorId(tutor.id)}
          />
        ))}
      </View>
    </ModalSheet>
  );
}
