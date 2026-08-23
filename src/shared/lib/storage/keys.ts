/**
 * Every persisted key in the app, in one place, so collisions are impossible
 * and a stored-shape migration is greppable.
 */
export const StorageKeys = {
  themeMode: 'fox.theme-mode',
  themeVariant: 'fox.theme-variant',
  locale: 'fox.locale',
  session: 'fox.session',
  calendarViewMode: 'fox.calendar.view-mode',
  calendarVisibleIds: 'fox.calendar.visible-ids',
  notificationsRead: 'fox.notifications.read',
  tabOrder: 'fox.tabs.order',
  tabHidden: 'fox.tabs.hidden',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
