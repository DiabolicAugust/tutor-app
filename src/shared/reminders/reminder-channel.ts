import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { basePalettes } from '@/shared/theme';

/**
 * The Android channel lesson reminders are delivered on.
 *
 * Must match `defaultChannel` in the `expo-notifications` plugin config, and the
 * sound name must match the file bundled by that plugin — Android resolves it
 * from `res/raw`, so it is the file name, not a path.
 *
 * Channels are created once and then owned by the user: Android ignores later
 * changes to importance or sound for an existing channel. That is deliberate on
 * their part, and it means getting this right the first time matters more than
 * usual.
 */
export const REMINDER_CHANNEL_ID = 'lesson-reminders';

export const REMINDER_SOUND = 'lesson-reminder.wav';

/**
 * Creates the channel. Safe to call repeatedly; a no-op off Android.
 *
 * `HIGH` rather than `MAX`: a lesson reminder should light up the screen and
 * make a sound, but it is not an alarm and should not take over the display.
 */
export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Lesson reminders',
    description: 'Sent shortly before a scheduled lesson.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: REMINDER_SOUND,
    lightColor: basePalettes.light.brand,
    // A short double pulse: noticeable in a pocket, not a buzz that outlasts the
    // sound.
    vibrationPattern: [0, 180, 120, 180],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
