/**
 * Per-account preferences, as stored on the server in `users.config`.
 *
 * Account-level, not device-level: these follow the person to a new phone, which
 * is why they are here and not in `shared/lib/storage` alongside theme and
 * language. That split is the rule — if losing the value on reinstall would be
 * wrong, it belongs on the server.
 */
export type UserConfig = {
  /** Whether to send an automatic reminder before a lesson. */
  lessonReminders: boolean;
  /** How long before the lesson to send it. */
  lessonReminderMinutes: number;
  /**
   * Whether this tutor marks work at all.
   *
   * A display preference, not a permission: switching it off hides marks and
   * averages from this person's app and changes nothing that is stored, so
   * switching it back on finds the history intact. Per-account rather than
   * per-school, because two tutors in one school genuinely differ —
   * conversation practice has nothing to mark, exam prep is mostly marking.
   */
  gradesEnabled: boolean;
};

/** What the app assumes before the server says otherwise. */
export const defaultUserConfig: UserConfig = {
  // Off by default: an app that starts notifying without being asked gets muted.
  lessonReminders: false,
  lessonReminderMinutes: 30,
  // On by default: the gradebook is the reason most schools want a system at
  // all, and a feature nobody can find is worse than one somebody switches off.
  gradesEnabled: true,
};

/** Offered as chips in settings; the server accepts any value in range. */
export const reminderPresetsMinutes: readonly number[] = [15, 30, 60, 120];

export type UserConfigPatch = Partial<UserConfig>;

/**
 * Fills in anything a session is missing.
 *
 * A session persisted before this field existed must still work, so absence is
 * treated as "use defaults" rather than as an error.
 */
export function withConfigDefaults(config: Partial<UserConfig> | undefined): UserConfig {
  return { ...defaultUserConfig, ...config };
}
