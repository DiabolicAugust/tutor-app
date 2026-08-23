import Constants from 'expo-constants';
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
  | { reason: 'not-configured' }
  | { reason: 'failed' };

export type PushTokenResult = DeviceRegistration | PushUnavailable;

export const isRegistration = (result: PushTokenResult): result is DeviceRegistration =>
  'token' in result;

const platform = (): DevicePlatform =>
  Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

/**
 * The EAS project this app belongs to.
 *
 * Required by `getExpoPushTokenAsync`: the token identifies a project, not just
 * a device, and Expo's service routes by it. Read from the config rather than
 * hardcoded so a build for a different project needs no code change.
 */
function projectId(): string | undefined {
  const eas = Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined;
  return eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Asks the OS for permission and the push service for a token.
 *
 * Returns a reason rather than throwing, because every failure here is ordinary:
 * somebody declined, the build has no project configured yet, or this is a
 * browser. A caller that has to catch exceptions for the normal cases ends up
 * treating them all the same, and "you said no" deserves different handling from
 * "this cannot work here".
 *
 * Permission is requested only if not already granted — asking again when the
 * answer is already yes shows nothing, and asking again after a no is a prompt
 * the OS will not display anyway.
 */
export async function requestPushToken(): Promise<PushTokenResult> {
  // Web push needs a service worker and a VAPID key, neither of which this app
  // has. Saying so is better than a token that never receives anything.
  if (Platform.OS === 'web') return { reason: 'unsupported' };

  const id = projectId();
  if (!id) return { reason: 'not-configured' };

  try {
    const existing = await Notifications.getPermissionsAsync();
    const granted =
      existing.granted ||
      existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      (await Notifications.requestPermissionsAsync()).granted;

    if (!granted) return { reason: 'denied' };

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    return { token: data, platform: platform() };
  } catch {
    return { reason: 'failed' };
  }
}
