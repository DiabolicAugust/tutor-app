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

export const ownCalendarId = 'me';

/**
 * The signed-in tutor's own calendar. Always present, fixtures or not — without
 * it there is nothing to show a schedule on.
 */
export const ownCalendar: Tutor = {
  id: ownCalendarId,
  name: 'My calendar',
  speciality: '',
  colorIndex: 0,
};

/** Own calendar first, then any colleagues. */
export const calendarOwners: Tutor[] = [
  ownCalendar,
  ...(fixturesEnabled ? fixtureColleagues : []),
];

export function findTutor(id: string): Tutor | undefined {
  return calendarOwners.find((tutor) => tutor.id === id);
}

export function tutorColorIndex(id: string): number {
  return findTutor(id)?.colorIndex ?? 0;
}
