import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useSession } from '@/shared/auth';
import { AppProviders } from '@/shared/providers/app-providers';
import { toNavigationTheme, useTheme } from '@/shared/theme';
import { AppSplash } from '@/shared/ui';

SplashScreen.preventAutoHideAsync();

/**
 * Route guards.
 *
 * Both groups are always declared; `guard` decides which one is reachable, and
 * Expo Router redirects accordingly — including for deep links. This is why no
 * screen ever calls `router.replace` after signing in or out: flipping the
 * session moves the user on its own.
 */
function RootNavigator() {
  const theme = useTheme();
  const { isSignedIn } = useSession();

  return (
    <NavigationThemeProvider value={toNavigationTheme(theme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>

      {/* After the stack, not before: later siblings paint on top, and an
          overlay underneath the app is not an overlay. */}
      <AppSplash />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
