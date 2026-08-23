import type { ReactNode } from 'react';

import { SessionProvider } from '@/shared/auth';
import { I18nProvider } from '@/shared/i18n';
import { LessonsProvider } from '@/shared/lessons';
import { TabPreferencesProvider } from '@/shared/navigation';
import { NotificationsProvider } from '@/shared/notifications';
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
 * schedule because it derives half its items from it.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <SessionProvider>
          <LessonsProvider>
            <NotificationsProvider>
              <TabPreferencesProvider>{children}</TabPreferencesProvider>
            </NotificationsProvider>
          </LessonsProvider>
        </SessionProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
