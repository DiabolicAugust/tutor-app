/**
 * Web has no scheduled local notifications worth the name — the Notification API
 * only fires while a tab is open, which is the opposite of a reminder.
 *
 * A no-op rather than a partial implementation: a reminder that silently depends
 * on the browser being open is worse than none, because the tutor would trust it.
 */
export function useLessonReminders(): void {}
