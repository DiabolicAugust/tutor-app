import { useMemo } from 'react';

import { useCurrentUser } from '@/shared/auth';
import { useSchool } from '@/shared/school';

import { calendarOwnersFor, tutorColorIndex, type Tutor } from './tutor';

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
 * The colleagues come from the school roster, which is the only place they could
 * come from. Until this was wired up it passed none at all — so the filter
 * offered one calendar and overlaying, the entire reason it is filterable, did
 * nothing.
 *
 * The caller is left out of the list rather than appearing twice: the roster is
 * everybody in the school, and "my calendar" is already the first entry.
 */
export function useCalendarOwners(): Tutor[] {
  const ownId = useOwnCalendarId();
  const { tutors } = useSchool();

  return useMemo(
    () =>
      calendarOwnersFor(
        ownId,
        tutors
          .filter((member) => member.id !== ownId)
          .map((member) => ({
            id: member.id,
            name: member.name,
            // The roster does not say what somebody teaches, and inventing a
            // line for it would be worse than leaving it blank: the filter shows
            // this under the name, where an empty string simply takes no room.
            speciality: '',
            colorIndex: tutorColorIndex(member.id),
          })),
      ),
    [ownId, tutors],
  );
}

/**
 * Who teaches a lesson, by name.
 *
 * Returns null rather than an id when the roster has not loaded or the tutor is
 * no longer in the school: a screen showing a raw cuid where a person's name
 * belongs is worse than one showing nothing there.
 */
export function useTutorName(): (tutorId: string) => string | null {
  const ownId = useOwnCalendarId();
  const ownName = useCurrentUser().name;
  const { tutors } = useSchool();

  return useMemo(() => {
    const byId = new Map(tutors.map((member) => [member.id, member.name]));

    return (tutorId: string) =>
      tutorId === ownId ? ownName : (byId.get(tutorId) ?? null);
  }, [ownId, ownName, tutors]);
}
