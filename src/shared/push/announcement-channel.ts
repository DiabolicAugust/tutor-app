import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { basePalettes } from '@/shared/theme';

/**
 * The Android channel school announcements arrive on.
 *
 * Must match what the server sends as `channelId`.
 *
 * Its own channel rather than the lesson-reminder one, for two reasons. Android
 * lets people mute a channel, and "the school is telling you something" is a
 * thing somebody may want to treat differently from "your lesson starts soon".
 * And it keeps the reminder chime meaning one thing — an announcement arriving
 * with the sound of a lesson starting would be actively misleading.
 *
 * The default sound, therefore, not the custom one.
 */
export const ANNOUNCEMENT_CHANNEL_ID = 'announcements';

/** Safe to call repeatedly; a no-op off Android. */
export async function ensureAnnouncementChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANNOUNCEMENT_CHANNEL_ID, {
    name: 'School announcements',
    description: 'Messages sent to everyone at your school.',
    // High, not max: worth interrupting for, not an alarm.
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: basePalettes.light.brand,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
