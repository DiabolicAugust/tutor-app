import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Matches the backend's `DevicePlatform`. */
export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

export type DeviceRegistration = {
  token: string;
  platform: DevicePlatform;
};

/**
 * Why a token could not be obtained. Distinguished because they call for
 * different responses: one is a setting the user can change, the others are not
 * their problem at all.
 */
export type PushUnavailable =
  | { reason: 'denied' }
  | { reason: 'unsupported' }
  | { reason: 'failed' };

export type PushTokenResult = DeviceRegistration | PushUnavailable;

export const isRegistration = (result: PushTokenResult): result is DeviceRegistration =>
  'token' in result;

const platform = (): DevicePlatform =>
  Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

/**
 * Asks the OS for permission and the platform for a token.
 *
 * The **device's own** token — an FCM registration token on Android — not an Expo
 * one. The server talks to FCM directly, so putting Expo's push service in the
 * middle would mean an account, a second set of credentials and somebody else's
 * rate limits for a hop that adds nothing.
 *
 * Returns a reason rather than throwing, because every failure here is ordinary:
 * somebody declined, this is a browser, or the build has no Firebase
 * configuration in it. A caller that has to catch exceptions for the normal cases
 * ends up treating them all the same, and "you said no" deserves different
 * handling from "this cannot work here".
 *
 * Permission is requested only if not already granted — asking again when the
 * answer is already yes shows nothing, and asking again after a no is a prompt
 * the OS will not display anyway.
 */
export async function requestPushToken(): Promise<PushTokenResult> {
  // Web push needs a service worker and a VAPID key, neither of which this app
  // has. Saying so is better than a token that never receives anything.
  if (Platform.OS === 'web') return { reason: 'unsupported' };

  try {
    const existing = await Notifications.getPermissionsAsync();
    const granted =
      existing.granted ||
      existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      (await Notifications.requestPermissionsAsync()).granted;

    if (!granted) return { reason: 'denied' };

    // Throws when the build has no `google-services.json` in it, which is the
    // "not set up in this build" case the status line reports.
    const { data } = await Notifications.getDevicePushTokenAsync();

    // Checked rather than trusted: the token's type is `any` on the platforms
    // this code actually runs on — the web shape is an object, and TypeScript
    // widens the union to cover it. Posting an object as a token would register a
    // device that can never be reached, and nothing would say so.
    if (typeof data !== 'string' || data.length === 0) return { reason: 'failed' };

    return { token: data, platform: platform() };
  } catch {
    return { reason: 'failed' };
  }
}
