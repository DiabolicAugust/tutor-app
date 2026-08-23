import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useNotifications } from '@/shared/notifications';

/**
 * Reacts to a push arriving or being tapped.
 *
 * Two separate things, and both are needed:
 *
 * - **Tapped** — the app opens on the news feed, because a notification that
 *   drops somebody on whatever screen they were last looking at makes them hunt
 *   for what they were just told.
 * - **Arrived while open** — the feed is refetched. Without this the notification
 *   appears in the tray and *not* in the app, which is the more confusing half of
 *   the pair.
 *
 * The listeners are added inside the signed-in tree, so a notification arriving
 * on the sign-in screen is left to the OS.
 */
export function usePushReceiver(): void {
  const { refresh } = useNotifications();

  useEffect(() => {
    // Fires while the app is foregrounded. The server has already stored the
    // row, so refetching is all that is needed to make it appear.
    const received = Notifications.addNotificationReceivedListener(() => {
      void refresh();
    });

    const tapped = Notifications.addNotificationResponseReceivedListener(() => {
      void refresh();
      router.navigate('/news');
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [refresh]);
}
