import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useFormat, useT } from '@/shared/i18n';
import {
  isGroupLesson,
  lessonLabel,
  lessonStart,
  needsWriteUp,
  type Lesson,
} from '@/shared/lessons';
import { useNow } from '@/shared/lib/use-now';
import { useStudents } from '@/shared/students';
import { createStyles, useTheme } from '@/shared/theme';
import { tutorColorIndex } from '@/shared/tutors';
import { Icon, Text, icons } from '@/shared/ui';

export type EventBlockProps = {
  lesson: Lesson;
  /** Hides the time line when the caller already shows it (agenda lists). */
  compact?: boolean;
  /**
   * Lets a group block open to show who is in it.
   *
   * Off by default, and deliberately: a block in the day grid can be twenty
   * pixels tall, and growing it would push the rest of the column around. Only
   * list contexts with vertical room to spare turn this on.
   */
  expandable?: boolean;
  onPress?: (lesson: Lesson) => void;
};

/**
 * A single lesson as it appears on the calendar.
 *
 * The color comes from *whose* calendar the lesson belongs to, not from its
 * subject — that is what makes several overlaid schedules readable at a glance.
 * Cancelled lessons keep their slot but lose their color, so the day still
 * reads correctly without pretending the lesson is happening.
 *
 * A group lesson shows the group's name and how many people are in it, because
 * that is what the tutor recognises it by — the members are one tap away rather
 * than crammed onto the block.
 */
export function EventBlock({
  lesson,
  compact = false,
  expandable = false,
  onPress,
}: EventBlockProps) {
  const styles = useStyles();
  const { eventColors, colors } = useTheme();
  const format = useFormat();
  const { t } = useT();
  const { nameOf } = useStudents();
  // Shared ticker rather than a clock read during render, which React Compiler
  // rightly refuses — and which would also never re-render as time passed.
  const now = useNow();

  const [expanded, setExpanded] = useState(false);

  const label = lessonLabel(lesson, nameOf);
  const isGroup = isGroupLesson(lesson);
  const members = lesson.group?.members ?? [];
  // The whole point of a gradebook is that it gets filled in, so the calendar is
  // where a gap should be visible: a lesson that has ended and still says
  // nothing about what happened.
  const unwritten = needsWriteUp(lesson, new Date(now));

  const cancelled = lesson.status === 'cancelled';
  const palette = eventColors[tutorColorIndex(lesson.tutorId) % eventColors.length];

  const background = cancelled ? colors.surfaceMuted : palette.soft;
  const accent = cancelled ? colors.borderStrong : palette.solid;

  // Expanding wins over the caller's action on a group block, so one tap does the
  // thing the chevron promises. A group with nobody in it has nothing to open.
  const canExpand = expandable && isGroup && members.length > 0;
  const handlePress = canExpand
    ? () => setExpanded((current) => !current)
    : onPress
      ? () => onPress(lesson)
      : undefined;

  return (
    <Pressable
      style={[styles.block, { backgroundColor: background }]}
      onPress={handlePress}
      accessibilityRole={handlePress ? 'button' : undefined}
      accessibilityState={canExpand ? { expanded } : undefined}
      accessibilityLabel={[
        format.time(lessonStart(lesson)),
        label,
        isGroup ? t('gradebook.journal.groupOf', { count: members.length }) : lesson.subject,
        // Spoken, because a coloured dot is invisible to a screen reader and this
        // one carries the only information on the block that asks for action.
        unwritten ? t('gradebook.journal.needsWriteUp') : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          {isGroup ? <Icon name={icons.people} size={13} color="textMuted" /> : null}
          <Text
            variant="caption"
            color={cancelled ? 'textMuted' : 'text'}
            numberOfLines={1}
            style={[styles.name, cancelled ? styles.cancelled : undefined]}
          >
            {label}
          </Text>
          {unwritten ? <View style={styles.unwritten} /> : null}
          {canExpand ? (
            <Icon
              name={expanded ? icons.arrowUp : icons.arrowDown}
              size={13}
              color="textMuted"
            />
          ) : null}
        </View>

        {!compact ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {format.time(lessonStart(lesson))} ·{' '}
            {isGroup
              ? t('gradebook.journal.groupOf', { count: members.length })
              : lesson.subject}
          </Text>
        ) : null}

        {/* Who is actually in the room. The names come with the lesson, so this
            opens instantly rather than loading. */}
        {expanded ? (
          <View style={styles.members}>
            {members.map((member) => (
              <Text
                key={member.student.id}
                variant="caption"
                color="textSecondary"
                numberOfLines={1}
              >
                {member.student.name}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

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
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1 },
  // A dot rather than an icon or a badge: a block in a day column can be 20px
  // tall, and this has to survive that without pushing the name out.
  unwritten: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.warning,
  },
  members: { paddingTop: 2, gap: 1 },
}));
