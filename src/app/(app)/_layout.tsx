import { Stack } from 'expo-router';

import { useT } from '@/shared/i18n';
import { LessonsProvider } from '@/shared/lessons';
import { TabPreferencesProvider } from '@/shared/navigation';
import { NotificationsProvider } from '@/shared/notifications';
import { usePushReceiver, usePushRegistration } from '@/shared/push';
import { useLessonReminders } from '@/shared/reminders';
import { SchoolProvider } from '@/shared/school';
import { StudentsProvider } from '@/shared/students';
import { SubjectsProvider } from '@/shared/subjects';
import { useTheme } from '@/shared/theme';
import { TutorialOverlay, TutorialProvider } from '@/shared/tutorial';
import { UserConfigProvider } from '@/shared/user-config';

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
  return (
    // The data providers live here rather than app-wide, because every one of
    // them needs a session to fetch with. Mounted above the guard they ran on
    // the sign-in screen, went out unauthenticated, and reported the 401s as
    // toasts over a form nobody had filled in.
    //
    // Mounting here also means signing in gets a *fresh* fetch with the new
    // token, instead of whatever an earlier anonymous attempt left behind — an
    // empty roster that made the booking form claim there were no students.
    //
    // Order within: the notification feed derives half its items from the
    // schedule, so it sits inside it; students sit outside both, because a
    // lesson refers to a student and the feed needs their names.
    <UserConfigProvider>
      <SchoolProvider>
        {/* Above students and lessons: what the school teaches is a property of
            the school, and every form that takes somebody on or books an hour
            needs the list before it can offer anything. */}
        <SubjectsProvider>
          <StudentsProvider>
            <LessonsProvider>
              <NotificationsProvider>
                <TabPreferencesProvider>
                  <TutorialProvider>
                    <AppStack />
                    {/* After the stack, not before: later siblings paint on top,
                        and a tour underneath the app it explains explains
                        nothing. */}
                    <TutorialOverlay />
                  </TutorialProvider>
                </TabPreferencesProvider>
              </NotificationsProvider>
            </LessonsProvider>
          </StudentsProvider>
        </SubjectsProvider>
      </SchoolProvider>
    </UserConfigProvider>
  );
}

function AppStack() {
  const { t } = useT();
  const { colors } = useTheme();

  // Mounted once, here: reminders follow from the schedule and the user's
  // preference, not from anyone looking at a particular screen. Inside the
  // authenticated group, because there is no schedule before sign-in.
  useLessonReminders();

  // Also once, and also here rather than at launch: registering needs a session
  // to attach the device to, and asking for notification permission before
  // somebody has seen what the app would notify them about is the surest way to
  // be told no.
  usePushRegistration();
  usePushReceiver();

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
      <Stack.Screen name="files" options={{ headerShown: true, title: t('more.files') }} />
      <Stack.Screen
        name="reports"
        options={{ headerShown: true, title: t('reports.title') }}
      />
      <Stack.Screen
        name="debtors"
        options={{ headerShown: true, title: t('debtors.title') }}
      />
      {/* One student, pushed over the tab bar. The roster itself is a tab now,
          so this is the only students route the stack owns. */}
      <Stack.Screen
        name="student/[id]"
        options={{ headerShown: true, title: t('studentsAdmin.title') }}
      />
    </Stack>
  );
}
