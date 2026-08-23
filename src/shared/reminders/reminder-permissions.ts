import * as Notifications from 'expo-notifications';

import { ensureReminderChannel } from './reminder-channel';

/**
 * Asks for notification permission, creating the Android channel first.
 *
 * Order matters on Android 13+: the channel must exist before the permission
 * prompt, or the system has nothing to attach the grant to.
 *
 * Called when the user turns reminders **on**, never at startup. A permission
 * prompt on first launch, before the app has shown what it would notify about,
 * is the one most reliably denied.
 */
export async function requestReminderPermission(): Promise<boolean> {
  await ensureReminderChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  // `canAskAgain` false means the user has denied it in settings; asking again
  // resolves immediately with the same answer, so this is only about not
  // pretending it is a fresh question.
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });

  return requested.granted;
}

export async function hasReminderPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}
