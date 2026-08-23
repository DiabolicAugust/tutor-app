import { Stack } from 'expo-router';

import { useT } from '@/shared/i18n';
import { useLessonReminders } from '@/shared/reminders';
import { useTheme } from '@/shared/theme';

/**
 * Everything behind authentication. Reachable only while the root layout's
 * guard passes, so screens in here may assume a session exists
 * (see `useCurrentUser`).
 *
 * A stack over the tabs, so detail screens — settings today, a student or a
 * lesson tomorrow — push over the tab bar with a native back gesture instead of
 * becoming tabs of their own.
 */
export default function AppLayout() {
  const { t } = useT();
  const { colors } = useTheme();

  // Mounted once, here: reminders follow from the schedule and the user's
  // preference, not from anyone looking at a particular screen. Inside the
  // authenticated group, because there is no schedule before sign-in.
  useLessonReminders();

  return (
    <Stack
      // Headers are opt-in per screen: relying on `name="(tabs)"` to switch the
      // header off leaves nested URLs like `/more` matching no declared screen
      // on web, which renders a header titled with the raw route name.
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surfaceElevated },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Declared first, and therefore the stack's initial route. Leaving it out
          made `settings` the anchor: signing in landed the user on Settings with
          no back button, since it was the root of the stack. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ headerShown: true, title: t('more.settings') }} />
      <Stack.Screen name="school" options={{ headerShown: true, title: t('more.school') }} />
    </Stack>
  );
}
