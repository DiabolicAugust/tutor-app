import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/shared/auth';
import { I18nProvider } from '@/shared/i18n';
import { ToastProvider } from '@/shared/ui';
import { ThemeProvider } from '@/shared/theme';

/**
 * The singletons that exist before anybody has signed in.
 *
 * The **data** providers are deliberately not here — see `(app)/_layout.tsx`.
 * Mounted app-wide they fetched on the sign-in screen with no token to fetch
 * with, and the 401s arrived as toasts over a form nobody had filled in yet.
 * There is no schedule before there is a session.
 *
 * Order matters: i18n sits outside the theme so themed components may translate
 * (a themed empty state needs `t()`), while nothing in i18n needs the theme. The
 * session sits inside both because it may need either to report a failure.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // Required by react-native-gesture-handler, and easy to miss: expo-router
    // wraps its own stack but not the app, so without this every gesture below
    // silently does nothing on Android — no warning, no error.
    <GestureHandlerRootView style={fill}>
      <I18nProvider>
        <ThemeProvider>
          {/* Inside a `SafeAreaProvider`, or `useSafeAreaInsets` reports zero
              and the toast layer renders under the status bar — half a message,
              which is how a report of "cut-off toasts" begins.

              Above the session, so a message about signing out survives the
              screen that was showing when it happened. */}
          <SafeAreaProvider>
            <ToastProvider>
              <SessionProvider>{children}</SessionProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

/** Declared once rather than inline, which would be a new object each render. */
const fill = { flex: 1 } as const;
