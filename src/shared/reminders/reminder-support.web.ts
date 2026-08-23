/**
 * Web cannot deliver these. The Notification API fires only while a tab is open,
 * which is the opposite of a reminder for something happening later.
 *
 * So the controls are hidden rather than offered and quietly ignored — a toggle
 * that stores "on" while nothing will ever arrive is worse than no toggle, since
 * the tutor would rely on it.
 */
export const remindersSupported = false;
