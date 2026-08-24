/**
 * A calendar owner.
 *
 * Filters are expressed in terms of tutors rather than raw ids so a school admin
 * can overlay colleagues' schedules — the multi-tutor case is the reason
 * calendars are filterable at all.
 */
export type Tutor = {
  id: string;
  name: string;
  /** Subject they mainly teach; shown as secondary text in the filter list. */
  speciality: string;
  /** Index into the theme's `eventColors`, so identity colors stay stable. */
  colorIndex: number;
};

/** The signed-in tutor's own calendar, built from the session. */
export function ownCalendarFor(userId: string): Tutor {
  return { id: userId, name: 'My calendar', speciality: '', colorIndex: 0 };
}

/**
 * Own calendar first, then colleagues.
 *
 * A function of the session rather than a constant: which calendars exist
 * depends on who is signed in and which school they are in, and neither is known
 * at module load.
 */
export function calendarOwnersFor(
  userId: string,
  colleagues: readonly Tutor[] = [],
): Tutor[] {
  return [ownCalendarFor(userId), ...colleagues];
}

/**
 * A stable colour for a calendar, derived from its owner's id.
 *
 * This used to look the id up in the test data, which meant that against a real
 * server nothing was ever found and every colleague came back as index zero —
 * so a school's calendars were all drawn in the same colour, and the one thing
 * overlaying them is for stopped working. It looked right on a fixture build,
 * which is exactly how it survived.
 *
 * Derived rather than assigned, because there is nowhere to assign from: the
 * server does not hand out colours, and a counter over "whoever loaded first"
 * would give the same person a different colour on every launch. A hash of the
 * id is stable across devices, across sessions and across who else is on screen.
 *
 * The caller takes this modulo the palette length, so the range only has to be
 * non-negative.
 */
export function tutorColorIndex(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    // Multiply-and-add over the code points. `| 0` keeps it a 32-bit integer, so
    // the arithmetic stays exact instead of drifting into floating point.
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}
