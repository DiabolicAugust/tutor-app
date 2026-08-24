import { fixtureColleagues } from '@/shared/fixtures/colleagues';
import { fixturesEnabled } from '@/shared/fixtures/enabled';

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

/**
 * The fixtures' id for the signed-in tutor.
 *
 * **Not** a stand-in for "whoever is signed in" — use `user.id` for that. It was
 * used that way, and against a real server it was wrong in two expensive places:
 * students carry a real tutor id, so "my students" matched nothing and the
 * booking form said the school had none; and lessons carry one too, so the
 * calendar filtered out every lesson that had just been created and they looked
 * like they had failed to save.
 *
 * The mock auth client issues a user with this id, which is why fixture builds
 * kept working and hid the problem.
 */
export const fixtureOwnCalendarId = 'me';

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
  return [
    ownCalendarFor(userId),
    ...(fixturesEnabled ? fixtureColleagues : colleagues),
  ];
}

export function tutorColorIndex(id: string): number {
  const colleague = fixtureColleagues.find((tutor) => tutor.id === id);
  return colleague?.colorIndex ?? 0;
}
