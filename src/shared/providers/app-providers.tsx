import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SessionProvider } from '@/shared/auth';
import { I18nProvider } from '@/shared/i18n';
import { LessonsProvider } from '@/shared/lessons';
import { TabPreferencesProvider } from '@/shared/navigation';
import { NotificationsProvider } from '@/shared/notifications';
import { SchoolProvider } from '@/shared/school';
import { StudentsProvider } from '@/shared/students';
import { ToastProvider } from '@/shared/ui';
import { UserConfigProvider } from '@/shared/user-config';
import { ThemeProvider } from '@/shared/theme';

/**
 * Every app-wide singleton, composed in one place and mounted once in the root
 * layout. Add new providers here (auth session, query client, feature flags)
 * rather than nesting them into a route file.
 *
 * Order matters: i18n sits outside the theme so themed components may translate
 * (a themed empty-state needs `t()`), while nothing in i18n needs the theme.
 * Order matters twice more: the session sits inside theme and i18n because it
 * may need both to render errors, and the notification feed sits inside the
 * schedule because it derives half its items from it. Students sit outside both:
 * a lesson refers to a student, and the feed needs their names.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // Required by react-native-gesture-handler, and easy to miss: expo-router
    // wraps its own stack but not the app, so without this every gesture below
    // silently does nothing on Android — no warning, no error.
    <GestureHandlerRootView style={fill}>
      <I18nProvider>
        <ThemeProvider>
          {/* Above the session and the data providers, because they are the ones
              with failures nothing on screen can report. Rendered over the app,
              which is why it wraps rather than sits beside. */}
          <ToastProvider>
            <SessionProvider>
              <UserConfigProvider>
                <SchoolProvider>
                  <StudentsProvider>
                    <LessonsProvider>
                      <NotificationsProvider>
                        <TabPreferencesProvider>{children}</TabPreferencesProvider>
                      </NotificationsProvider>
                    </LessonsProvider>
                  </StudentsProvider>
                </SchoolProvider>
              </UserConfigProvider>
            </SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

/** Declared once rather than inline, which would be a new object each render. */
const fill = { flex: 1 } as const;
