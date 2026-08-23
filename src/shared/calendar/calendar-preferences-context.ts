import { createContext } from 'react';

import type { CalendarViewMode } from './view-mode';

export type CalendarPreferences = {
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  /** Ids of the calendars currently overlaid on the grid. */
  visibleCalendarIds: readonly string[];
  isCalendarVisible: (id: string) => boolean;
  toggleCalendar: (id: string) => void;
};

export const CalendarPreferencesContext = createContext<CalendarPreferences | null>(null);
