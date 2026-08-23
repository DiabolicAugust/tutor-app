/**
 * Calendar arithmetic. Plain `Date` on purpose — no date library until one
 * earns its place, and every helper here is timezone-naive by design: a lesson
 * on Tuesday is on Tuesday in the tutor's own timezone.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(value: Date): boolean {
  return isSameDay(value, new Date());
}

/**
 * Start of the week containing `value`.
 *
 * `weekStartsOn` is a parameter rather than a constant because it is a locale
 * decision (Sunday in the US, Monday in Ukraine) that the caller resolves.
 */
export function startOfWeek(value: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = startOfDay(value);
  const shift = (result.getDay() - weekStartsOn + 7) % 7;
  return addDays(result, -shift);
}

/** The seven days of the week containing `value`. */
export function weekDays(value: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const first = startOfWeek(value, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}
