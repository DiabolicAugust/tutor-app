import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { useFormat } from '@/shared/i18n';
import { lessonsForDay, type Lesson } from '@/shared/lessons';
import { isToday } from '@/shared/lib/date';
import { createStyles } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { gridHeight, gridHours, layoutDay, offsetFor, timeGrid } from '../time-grid';
import { EventBlock } from './event-block';

export type TimeGridViewProps = {
  /** One column per day — one entry for day view, three for the 3-day view. */
  days: readonly Date[];
  lessons: readonly Lesson[];
  visibleCalendarIds: readonly string[];
  onSelectLesson?: (lesson: Lesson) => void;
};

const GUTTER_WIDTH = 52;

const useStyles = createStyles((t) => ({
  container: { flex: 1 },
  columnHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  gutterSpacer: { width: GUTTER_WIDTH },
  columnHeader: { flex: 1, alignItems: 'center', paddingVertical: t.spacing.xs, gap: 1 },
  columnHeaderToday: { backgroundColor: t.colors.brandSoft },
  body: { flexDirection: 'row', height: gridHeight },
  gutter: { width: GUTTER_WIDTH },
  hourLabel: {
    height: timeGrid.hourHeight,
    alignItems: 'flex-end',
    paddingRight: t.spacing.sm,
    // Nudged up so the label sits against its own gridline, not below it.
    transform: [{ translateY: -7 }],
  },
  columns: { flex: 1, flexDirection: 'row' },
  column: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: t.colors.border,
  },
  hourLine: {
    height: timeGrid.hourHeight,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  eventsLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  event: { position: 'absolute', paddingRight: 2 },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: t.colors.danger,
  },
  nowDot: {
    position: 'absolute',
    left: -3,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.danger,
  },
}));

/**
 * The hour-by-hour schedule: a labelled time gutter, one column per day, and
 * lessons positioned by their actual start and duration.
 *
 * Concurrent lessons share a column's width via `layoutDay`, and today's column
 * carries a "now" line — the two things that make a grid readable at a glance
 * rather than just accurate.
 */
export function TimeGridView({
  days,
  lessons,
  visibleCalendarIds,
  onSelectLesson,
}: TimeGridViewProps) {
  const styles = useStyles();
  const format = useFormat();
  const scrollRef = useRef<ScrollView>(null);

  const columns = useMemo(
    () =>
      days.map((day) => ({
        day,
        positioned: layoutDay(lessonsForDay(lessons, day, visibleCalendarIds)),
      })),
    [days, lessons, visibleCalendarIds],
  );

  // Open near the current hour instead of at the top of the visible range —
  // 07:00 is rarely what the user wants to see first.
  useEffect(() => {
    const now = new Date();
    const target = Math.max(offsetFor(now) - timeGrid.hourHeight, 0);
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y: target, animated: false }), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.columnHeaderRow}>
        <View style={styles.gutterSpacer} />
        {days.map((day) => (
          <View
            key={day.toISOString()}
            style={[styles.columnHeader, isToday(day) && styles.columnHeaderToday]}
          >
            <Text variant="caption" color="textMuted">
              {format.weekday(day, 'short')}
            </Text>
            <Text variant="bodyStrong" color={isToday(day) ? 'brand' : 'text'}>
              {day.getDate()}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView ref={scrollRef}>
        <View style={styles.body}>
          <View style={styles.gutter}>
            {gridHours.map((hour) => (
              <View key={hour} style={styles.hourLabel}>
                <Text variant="caption" color="textMuted">
                  {format.time(new Date(2000, 0, 1, hour, 0))}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.columns}>
            {columns.map(({ day, positioned }) => (
              <View key={day.toISOString()} style={styles.column}>
                {gridHours.map((hour) => (
                  <View key={hour} style={styles.hourLine} />
                ))}

                <View style={styles.eventsLayer}>
                  {positioned.map(({ lesson, top, height, column, columnCount }) => (
                    <View
                      key={lesson.id}
                      style={[
                        styles.event,
                        {
                          top,
                          height,
                          left: `${(column / columnCount) * 100}%`,
                          width: `${100 / columnCount}%`,
                        },
                      ]}
                    >
                      <EventBlock lesson={lesson} onPress={onSelectLesson} />
                    </View>
                  ))}

                  {isToday(day) ? <NowLine /> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** The "you are here" marker. Recomputed on mount; a minute-ticker would be overkill. */
function NowLine() {
  const styles = useStyles();
  return (
    <View style={[styles.nowLine, { top: offsetFor(new Date()) }]}>
      <View style={styles.nowDot} />
    </View>
  );
}
