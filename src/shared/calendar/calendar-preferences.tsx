import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';
import { ownCalendarId } from '@/shared/tutors';

import {
  CalendarPreferencesContext,
  type CalendarPreferences,
} from './calendar-preferences-context';
import { isCalendarViewMode, type CalendarViewMode } from './view-mode';

const viewModeStore = createPersistedValue<CalendarViewMode>(
  StorageKeys.calendarViewMode,
  isCalendarViewMode,
);

const visibleCalendarsStore = createPersistedValue<string[]>(
  StorageKeys.calendarVisibleIds,
  (value): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string'),
);

/**
 * View mode and calendar filters, persisted.
 *
 * These are view preferences rather than app-wide settings, so the provider is
 * mounted by the calendar route instead of `AppProviders` — nothing outside the
 * calendar has any use for them.
 */
export function CalendarPreferencesProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<CalendarViewMode>(
    () => viewModeStore.read() ?? 'day',
  );
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(
    () => visibleCalendarsStore.read() ?? [ownCalendarId],
  );

  const setViewMode = useCallback((mode: CalendarViewMode) => {
    setViewModeState(mode);
    viewModeStore.write(mode);
  }, []);

  const toggleCalendar = useCallback((id: string) => {
    setVisibleCalendarIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      visibleCalendarsStore.write(next);
      return next;
    });
  }, []);

  const value = useMemo<CalendarPreferences>(
    () => ({
      viewMode,
      setViewMode,
      visibleCalendarIds,
      isCalendarVisible: (id) => visibleCalendarIds.includes(id),
      toggleCalendar,
    }),
    [viewMode, setViewMode, visibleCalendarIds, toggleCalendar],
  );

  return (
    <CalendarPreferencesContext.Provider value={value}>
      {children}
    </CalendarPreferencesContext.Provider>
  );
}
