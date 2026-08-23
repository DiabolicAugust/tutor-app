import { useEffect, useRef } from 'react';

import { apiClients } from '@/shared/api';
import { useSession } from '@/shared/auth';

import { ensureAnnouncementChannel } from './announcement-channel';
import { isRegistration, requestPushToken, type DeviceRegistration } from './push-token';

/**
 * Registers this device for push while somebody is signed in, and unregisters it
 * when they sign out.
 *
 * Mounted once inside the signed-in tree. Both halves matter: a token left
 * registered after sign-out sends the next person to use this phone the previous
 * person's school announcements.
 *
 * Runs on sign-in rather than at launch, and only asks for permission the first
 * time. A prompt that appears before the app has shown what it would notify
 * about is the one most reliably declined — by the time somebody has a session
 * they have seen their calendar.
 */
export function usePushRegistration(): void {
  const { user } = useSession();
  const registered = useRef<DeviceRegistration | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    let active = true;

    void (async () => {
      // Before the token: a notification arriving on a channel that does not
      // exist yet is delivered silently on Android, and the channel cannot be
      // changed afterwards.
      await ensureAnnouncementChannel();

      const result = await requestPushToken();
      if (!active || !isRegistration(result)) return;

      try {
        await apiClients.push.register(result);
        registered.current = result;
      } catch {
        // Nothing to tell the user: they did not ask for this, and a failed
        // registration means quiet notifications rather than a broken app.
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  // Unregisters on sign-out. Deliberately not in the effect above's cleanup:
  // that also runs when the account changes, and by then the token has already
  // been reassigned to the new user by the registration that followed.
  const previousUserId = useRef(userId);
  useEffect(() => {
    const wasSignedIn = previousUserId.current !== null;
    previousUserId.current = userId;

    if (userId !== null || !wasSignedIn) return;

    const device = registered.current;
    registered.current = null;
    if (device) void apiClients.push.unregister(device).catch(() => undefined);
  }, [userId]);
}
