import { lessonEnd, lessonStart, type Lesson } from '@/shared/lessons';

/**
 * Geometry for the hour-by-hour grid (the Teams-style day column).
 *
 * All vertical positions derive from these three numbers, so changing the
 * visible range or zoom level is a single edit here rather than a hunt through
 * component styles.
 */
export const timeGrid = {
  /** First hour rendered. Lessons earlier than this are clamped into view. */
  startHour: 7,
  /** Last hour rendered (exclusive end of the final row). */
  endHour: 22,
  /** Pixels per hour — the grid's zoom level. */
  hourHeight: 64,
} as const;

const MINUTES_PER_HOUR = 60;

export const pixelsPerMinute = timeGrid.hourHeight / MINUTES_PER_HOUR;

/** Total height of the scrollable grid. */
export const gridHeight = (timeGrid.endHour - timeGrid.startHour) * timeGrid.hourHeight;

/** The hours to label down the gutter. */
export const gridHours: readonly number[] = Array.from(
  { length: timeGrid.endHour - timeGrid.startHour },
  (_, index) => timeGrid.startHour + index,
);

/** Minutes from the top of the grid to `date`, clamped to the visible range. */
export function offsetMinutes(date: Date): number {
  const minutes = date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
  const start = timeGrid.startHour * MINUTES_PER_HOUR;
  const end = timeGrid.endHour * MINUTES_PER_HOUR;
  return Math.min(Math.max(minutes, start), end) - start;
}

/** Vertical offset in pixels for `date`. */
export function offsetFor(date: Date): number {
  return offsetMinutes(date) * pixelsPerMinute;
}

/**
 * One positioned event.
 *
 * `column` / `columnCount` describe horizontal sharing: three lessons at the
 * same hour each get a third of the width, the way Teams and Google Calendar
 * split concurrent meetings.
 */
export type PositionedLesson = {
  lesson: Lesson;
  top: number;
  height: number;
  column: number;
  columnCount: number;
};

/** Shortest block that stays readable, however brief the lesson. */
const MIN_BLOCK_HEIGHT = 22;

/**
 * Lays out a single day's lessons, splitting overlapping ones into columns.
 *
 * Events are clustered by actual overlap first, so a busy morning does not
 * squeeze an unrelated evening lesson: each cluster is sized independently.
 */
export function layoutDay(lessons: readonly Lesson[]): PositionedLesson[] {
  const sorted = [...lessons].sort(
    (a, b) => lessonStart(a).getTime() - lessonStart(b).getTime(),
  );

  const result: PositionedLesson[] = [];
  let cluster: Lesson[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;

    // Greedy column assignment: reuse the first column that has already ended.
    const columnEnds: number[] = [];
    const assigned = cluster.map((lesson) => {
      const start = lessonStart(lesson).getTime();
      let column = columnEnds.findIndex((end) => end <= start);
      if (column === -1) {
        column = columnEnds.length;
      }
      columnEnds[column] = lessonEnd(lesson).getTime();
      return { lesson, column };
    });

    for (const { lesson, column } of assigned) {
      const top = offsetFor(lessonStart(lesson));
      const bottom = offsetFor(lessonEnd(lesson));
      result.push({
        lesson,
        top,
        height: Math.max(bottom - top, MIN_BLOCK_HEIGHT),
        column,
        columnCount: columnEnds.length,
      });
    }

    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const lesson of sorted) {
    const start = lessonStart(lesson).getTime();
    if (start >= clusterEnd) flush();
    cluster.push(lesson);
    clusterEnd = Math.max(clusterEnd, lessonEnd(lesson).getTime());
  }
  flush();

  return result;
}
