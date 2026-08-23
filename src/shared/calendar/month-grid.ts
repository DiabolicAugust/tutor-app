import { addDays, startOfWeek } from '@/shared/lib/date';

/** Six weeks always: a fixed grid height stops the month jumping as you page. */
const WEEKS = 6;

/**
 * The month containing `date` as six week-rows, padded with the neighbouring
 * months' days so every row is full.
 */
export function monthWeeks(date: Date, weekStartsOn: 0 | 1 = 1): Date[][] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth, weekStartsOn);

  return Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
