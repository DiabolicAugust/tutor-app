import { Pressable, View } from 'react-native';

import { useFormat } from '@/shared/i18n';
import { lessonStart, type Lesson } from '@/shared/lessons';
import { useStudents } from '@/shared/students';
import { createStyles, useTheme } from '@/shared/theme';
import { tutorColorIndex } from '@/shared/tutors';
import { Text } from '@/shared/ui';

export type EventBlockProps = {
  lesson: Lesson;
  /** Hides the time line when the caller already shows it (agenda lists). */
  compact?: boolean;
  onPress?: (lesson: Lesson) => void;
};

const useStyles = createStyles((t) => ({
  block: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: t.radius.sm,
  },
  accent: { width: 3 },
  body: { flex: 1, paddingHorizontal: t.spacing.sm, paddingVertical: 4, gap: 1 },
  cancelled: { textDecorationLine: 'line-through' },
}));

/**
 * A single lesson as it appears on the calendar.
 *
 * The color comes from *whose* calendar the lesson belongs to, not from its
 * subject — that is what makes several overlaid schedules readable at a glance.
 * Cancelled lessons keep their slot but lose their color, so the day still
 * reads correctly without pretending the lesson is happening.
 */
export function EventBlock({ lesson, compact = false, onPress }: EventBlockProps) {
  const styles = useStyles();
  const { eventColors, colors } = useTheme();
  const format = useFormat();
  const { nameOf } = useStudents();

  const studentName = nameOf(lesson.studentId);

  const cancelled = lesson.status === 'cancelled';
  const palette = eventColors[tutorColorIndex(lesson.tutorId) % eventColors.length];

  const background = cancelled ? colors.surfaceMuted : palette.soft;
  const accent = cancelled ? colors.borderStrong : palette.solid;

  return (
    <Pressable
      style={[styles.block, { backgroundColor: background }]}
      onPress={onPress ? () => onPress(lesson) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${format.time(lessonStart(lesson))} ${studentName} ${lesson.subject}`}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text
          variant="caption"
          color={cancelled ? 'textMuted' : 'text'}
          numberOfLines={1}
          style={cancelled ? styles.cancelled : undefined}
        >
          {studentName}
        </Text>
        {!compact ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {format.time(lessonStart(lesson))} · {lesson.subject}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
