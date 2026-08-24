import { useMemo } from 'react';

import { useCurrentUser } from '@/shared/auth';

import { calendarOwnersFor, type Tutor } from './tutor';

/**
 * Whose calendar "mine" is.
 *
 * The signed-in user's own id, read from the session. This exists because it was
 * previously a module constant borrowed from the fixtures, and against a real
 * server that constant matched nothing: "my students" came back empty and every
 * lesson the app had just created was filtered off the calendar.
 *
 * Safe to call anywhere inside the authenticated group, which is the only place
 * a calendar is rendered.
 */
export function useOwnCalendarId(): string {
  return useCurrentUser().id;
}

/**
 * The calendars that can be overlaid on the grid: your own, then colleagues'.
 *
 * Memoised on the id alone, because the colleague list is a fixture today. When
 * it comes from the school roster instead, that dependency joins it here rather
 * than at every call site.
 */
export function useCalendarOwners(): Tutor[] {
  const ownId = useOwnCalendarId();
  return useMemo(() => calendarOwnersFor(ownId), [ownId]);
}
