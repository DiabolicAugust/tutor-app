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
  /** Set once the interface tour has been seen, so it never returns unasked. */
  tutorialSeen: 'fox.tutorial.seen',
  /**
   * Set by registration to ask for the tour, and cleared once it starts.
   *
   * Persisted rather than held in state because the request and the start happen
   * on opposite sides of the sign-in guard, which unmounts everything in between.
   */
  tutorialPending: 'fox.tutorial.pending',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
