import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useFormat } from '@/shared/i18n';
import { lessonsForDay, type Lesson } from '@/shared/lessons';
import { isSameDay, isToday, weekDays } from '@/shared/lib/date';
import { createStyles, useTheme } from '@/shared/theme';
import { tutorColorIndex } from '@/shared/tutors';
import { Text } from '@/shared/ui';

import { isSameMonth, monthWeeks } from '../month-grid';

export type MonthViewProps = {
  /** Any day in the month to render. */
  month: Date;
  selectedDay: Date;
  lessons: readonly Lesson[];
  visibleCalendarIds: readonly string[];
  onSelectDay: (day: Date) => void;
};

/** Dots shown per cell before collapsing into a count. */
const MAX_DOTS = 3;

const useStyles = createStyles((t) => ({
  container: { flex: 1, paddingHorizontal: t.spacing.sm },
  weekdayRow: { flexDirection: 'row', paddingVertical: t.spacing.xs },
  weekdayCell: { flex: 1, alignItems: 'center' },
  week: { flexDirection: 'row', flex: 1 },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: t.spacing.xs,
    gap: t.spacing.xs,
    borderRadius: t.radius.sm,
    margin: 1,
  },
  cellPressed: { backgroundColor: t.colors.surfaceActive },
  cellSelected: { backgroundColor: t.colors.brandSoft },
  dayBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeToday: { backgroundColor: t.colors.brand },
  dots: { flexDirection: 'row', gap: 3, alignItems: 'center', minHeight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
}));

/**
 * Month overview.
 *
 * Density is shown as identity-colored dots rather than event titles: at this
 * zoom level a title is unreadable anyway, while the dots answer the two
 * questions a month view is actually for — how busy is that day, and whose
 * lessons are on it. Tapping a day hands off to the caller, which opens the
 * day's agenda.
 *
 * The grid is always six weeks tall so paging between months does not make the
 * layout jump.
 */
export function MonthView({
  month,
  selectedDay,
  lessons,
  visibleCalendarIds,
  onSelectDay,
}: MonthViewProps) {
  const styles = useStyles();
  const { eventColors } = useTheme();
  const format = useFormat();

  const weeks = useMemo(() => monthWeeks(month), [month]);
  const weekdayLabels = useMemo(() => weekDays(month), [month]);

  return (
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((day) => (
          <View key={day.toISOString()} style={styles.weekdayCell}>
            <Text variant="caption" color="textMuted">
              {format.weekday(day, 'narrow')}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].toISOString()} style={styles.week}>
          {week.map((day) => {
            const dayLessons = lessonsForDay(lessons, day, visibleCalendarIds);
            const outside = !isSameMonth(day, month);
            const selected = isSameDay(day, selectedDay);
            const today = isToday(day);

            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => onSelectDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${format.date(day, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}, ${dayLessons.length}`}
                style={({ pressed }) => [
                  styles.cell,
                  selected && styles.cellSelected,
                  pressed && !selected && styles.cellPressed,
                ]}
              >
                <View style={[styles.dayBadge, today && styles.dayBadgeToday]}>
                  <Text
                    variant="bodySm"
                    color={today ? 'textOnAccent' : outside ? 'textMuted' : 'text'}
                  >
                    {day.getDate()}
                  </Text>
                </View>

                <View style={styles.dots}>
                  {dayLessons.slice(0, MAX_DOTS).map((lesson) => (
                    <View
                      key={lesson.id}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            eventColors[tutorColorIndex(lesson.tutorId) % eventColors.length].solid,
                        },
                      ]}
                    />
                  ))}
                  {dayLessons.length > MAX_DOTS ? (
                    <Text variant="caption" color="textMuted">
                      +{dayLessons.length - MAX_DOTS}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
