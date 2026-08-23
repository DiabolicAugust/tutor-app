import { useContext } from 'react';

import {
  CalendarPreferencesContext,
  type CalendarPreferences,
} from './calendar-preferences-context';

export function useCalendarPreferences(): CalendarPreferences {
  const value = useContext(CalendarPreferencesContext);
  if (!value) {
    throw new Error(
      'useCalendarPreferences must be used inside <CalendarPreferencesProvider>.',
    );
  }
  return value;
}
