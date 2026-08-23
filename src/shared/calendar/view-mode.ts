/**
 * How much of the schedule is on screen at once.
 *
 * `day` and `threeDays` are the same time-grid rendering with a different
 * column count, which is why they carry `dayCount`; `month` is a different
 * layout entirely and reports `null`.
 */
export type CalendarViewMode = 'day' | 'threeDays' | 'month';

export const calendarViewModes: readonly CalendarViewMode[] = ['day', 'threeDays', 'month'];

export function isCalendarViewMode(value: unknown): value is CalendarViewMode {
  return typeof value === 'string' && (calendarViewModes as readonly string[]).includes(value);
}

/** Columns to render in the time grid, or `null` for the month layout. */
export function dayCountFor(mode: CalendarViewMode): number | null {
  switch (mode) {
    case 'day':
      return 1;
    case 'threeDays':
      return 3;
    case 'month':
      return null;
  }
}
