import { View } from 'react-native';

import { useFormat, useT } from '@/shared/i18n';
import { lessonEnd, lessonStart, lessonsForDay, type Lesson } from '@/shared/lessons';
import { createStyles } from '@/shared/theme';
import { Button, ModalSheet, Text } from '@/shared/ui';

import { EventBlock } from './event-block';

export type DayAgendaSheetProps = {
  day: Date | null;
  lessons: readonly Lesson[];
  /**
   * Opening one of the day's lessons.
   *
   * Optional, because the sheet is useful without it — it is a list of the day,
   * and it was that before a lesson could be opened at all.
   */
  onSelectLesson?: (lesson: Lesson) => void;
  visibleCalendarIds: readonly string[];
  onClose: () => void;
  /** Offered inside the sheet so a month-view tap can lead straight to booking. */
  onAddEvent: (day: Date) => void;
};

const useStyles = createStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'stretch' },
  time: { width: 64, paddingTop: 2 },
  block: { flex: 1, minHeight: 44 },
}));

/**
 * The day's schedule as a list, opened by tapping a date in the month view.
 *
 * An agenda rather than a miniature grid: at this size a list of times reads
 * faster than a scaled-down time axis, and it is the same information.
 */
export function DayAgendaSheet({
  day,
  lessons,
  onSelectLesson,
  visibleCalendarIds,
  onClose,
  onAddEvent,
}: DayAgendaSheetProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();

  const dayLessons = day ? lessonsForDay(lessons, day, visibleCalendarIds) : [];

  return (
    <ModalSheet
      visible={day !== null}
      onClose={onClose}
      title={day ? format.dayTitle(day) : ''}
      testID="agenda-sheet"
      footer={
        day ? (
          <Button
            testID="agenda-add"
            label={t('event.add')}
            fullWidth
            onPress={() => onAddEvent(day)}
          />
        ) : undefined
      }
    >
      {dayLessons.length === 0 ? (
        <Text testID="agenda-empty" color="textSecondary">
          {t('calendar.empty')}
        </Text>
      ) : (
        dayLessons.map((lesson) => (
          <View key={lesson.id} style={styles.row}>
            <View style={styles.time}>
              <Text variant="bodySm">{format.time(lessonStart(lesson))}</Text>
              <Text variant="caption" color="textMuted">
                {format.time(lessonEnd(lesson))}
              </Text>
            </View>
            <View style={styles.block}>
              {/* Expandable here and not in the grid: a list has vertical room,
                  a twenty-pixel grid cell does not. */}
              {/* Expandable *and* pressable: tapping a group block opens the
                  lesson, and the chevron inside it still expands the member
                  list without the two fighting over the same tap. */}
              <EventBlock
                lesson={lesson}
                compact
                expandable
                onPress={onSelectLesson}
              />
            </View>
          </View>
        ))
      )}
    </ModalSheet>
  );
}
