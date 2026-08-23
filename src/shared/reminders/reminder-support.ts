/**
 * Whether this platform can actually deliver a scheduled lesson reminder.
 *
 * True on native. The distinction exists because the alternative is a setting
 * that lies: on web the toggle would ask for browser permission, save "on", and
 * then schedule nothing — see the `.web` variant.
 */
export const remindersSupported = true;
